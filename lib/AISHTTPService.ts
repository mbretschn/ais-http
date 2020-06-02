import { MessageLogger, Database, DatabaseError, PositionError } from 'ais-tools'
import { SSHTunnel } from './SSHTunnel'
import { HTTPDispatcher } from './HTTPDispatcher'
import { AISHubDecoder } from './AISHubDecoder'
import { EventEmitter } from 'events'

export class AISHTTPService extends EventEmitter {
    config: any
    logger: MessageLogger
    tunnel: SSHTunnel
    database: Database
    dispatcher: HTTPDispatcher
    decoder: AISHubDecoder
    exiting: boolean = false
    connected: boolean = false

    constructor(config: any) {
        super()

        this.config = config

        this.logger = new MessageLogger(this.config.logger)
        this.tunnel = new SSHTunnel(this.config.ssh, this.logger)
        this.database = new Database(this.config.database)
        this.dispatcher = new HTTPDispatcher(this.config.dispatcher, this.logger)
        this.decoder = new AISHubDecoder(this.database, this.logger)
    }

    private async teardown(): Promise<void> {
        if (this.exiting) return
        this.exiting = true

        this.logger.info(`Teardown AISHTTPService(${process.pid})`)
        await this.dispatcher.stop()

        if (this.connected) {
            await this.database.close()
            this.logger.info(`Database disconnected`)
        }

        await this.tunnel.stop()
        this.logger.info(`Exit AISHTTPService(${process.pid})`)

        this.emit('exit')
    }

    private onMessage = async (message: any): Promise<void> => {
        if (this.exiting) return

        try {
            await this.decoder.decode(message)
        } catch (ex) {
            if (ex instanceof DatabaseError) {
                this.dispatcher.off('message', this.onMessage)
                this.logger.error(ex.name, ex.message)
                this.teardown()
            } else if (ex instanceof PositionError) {
                this.logger.verbose(ex.name, ex.message)
            } else {
                this.logger.warn(ex.name, ex.message)
            }
        }
    }

    public stop = async (): Promise<void> => {
        if (this.exiting) return

        this.logger.warn('AISHTTPService Signal caught, exiting!')
        await this.teardown()
    }

    public async start(): Promise<void> {
        this.logger.info(`Start AISHTTPService(${process.pid})`)

        try {
            this.tunnel.start()
            await this.database.connect()
            this.connected = true
            this.logger.info(`Database connected`)

            this.dispatcher.on('message', this.onMessage)
            this.dispatcher.on('error', ex => {
                this.logger.error(ex.name, ex.message.replace(/username=([A-Z_0-9]+)/gm, 'username=********'))
                this.teardown()
            })
            this.dispatcher.start()

            this.logger.info('AISHTTPService started', {
                loglevel: this.logger.level,
                pid: process.pid,
                env: process.env.NODE_ENV
            })
        } catch (ex) {
            if (ex instanceof DatabaseError) {
                this.logger.error(ex.name, ex.message)
                this.teardown()
            } else {
                this.logger.warn(ex.name, ex.message)
            }
        }
    }
}
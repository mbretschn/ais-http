import { MessageLogger } from 'ais-tools'
import { DispatcherError } from './Errors'
import { default as moment } from 'moment'
import { default as fetch } from 'node-fetch'
import { Bzip2 } from 'compressjs'
import { EventEmitter } from 'events'

export class HTTPDispatcher extends EventEmitter {
    private config: any
    private logger: MessageLogger
    private url: string
    private closing: boolean = false
    private error: boolean = false
    private timeout: any

    constructor(config: any, logger: MessageLogger) {
        super()

        this.config = config
        this.logger = logger

        this.url = 'http://data.aishub.net/ws.php'
        this.url += '?username=' + this.config.rest.username
        this.url += '&format=1'
        this.url += '&output=json'
        this.url += '&compress=3'
        this.url += '&latmin=' + this.config.rest.latmin
        this.url += '&latmax=' + this.config.rest.latmax
        this.url += '&lonmin=' + this.config.rest.lonmin
        this.url += '&lonmax=' + this.config.rest.lonmax
    }

    private async delay(delay: number = 1000): Promise<void> {
        return new Promise(resolve => {
            this.timeout = setTimeout(() => {
                this.timeout = undefined
                resolve()
            }, delay)
        })
    }

    private async wait(): Promise<void> {
        const now = moment()
        const start = moment()

        start.add(2, 'minutes')
        start.seconds(this.config.second)

        const wait = start.diff(now)
        if (wait < 0) {
            this.logger.verbose(`HTTPDispatcher Start`)
        } else {
            this.logger.verbose(`HTTPDispatcher Wait ${(wait / 1000).toFixed(0)}s`)
            await this.delay(wait)
            this.logger.verbose('HTTPDispatcher Start')
        }
    }

    public async start(): Promise<void> {
        this.logger.info('HTTPDispatcher', this.url.replace(/username=([A-Z_0-9]+)/gm, 'username=********'))

        await this.wait()
        this.run()
    }

    public async stop(): Promise<void> {
        return new Promise(resolve => {
            this.closing = true
            if (this.timeout) {
                clearTimeout(this.timeout)
            }
            this.logger.info('HTTPDispatcher closed')
            resolve()
        })
    }

    public message(data: any): void {
        if (this.closing) {
            return
        }

        this.emit('message', data)
    }

    private async run(): Promise<void> {
        if (this.closing) {
            return
        }

        const start = moment()
        const end = moment().add(this.config.timeout, 'seconds')

        this.logger.verbose(`HTTPDispatcher Request ${start.format('hh:mm:ss')}`)
        await this.job()

        const now = moment()
        const wait = end.diff(now, 'milliseconds')

        if (wait > 0) {
            this.logger.verbose(`HTTPDispatcher Wait ${(wait / 1000).toFixed(0)}s`)
            await this.delay(wait)
        }

        this.run()
    }

    private async job(): Promise<void> {
        if (this.closing) {
            return
        }

        try {
            const res = await fetch(this.url)
            const buffer = await res.buffer()
            const decompressed = Bzip2.decompressFile(buffer);
            const str = Buffer.from(decompressed).toString('utf8');
            const json = JSON.parse(str)

            if (json[0].ERROR === false) {
                this.logger.verbose(`HTTPDispatcher Receive ${json[0].RECORDS} Records`)
                for (const data of json[1]) {
                    this.message(data)
                }
            } else {
                throw new DispatcherError(json[0].ERROR_MESSAGE, json[0].ERROR)
            }
        } catch (ex) {
            if (ex instanceof DispatcherError) {
                this.logger.warn(ex.name, ex.message)
            } else {
                this.emit('error', ex)
            }
        }
    }
}

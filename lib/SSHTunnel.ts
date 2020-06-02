import { spawn } from 'child_process'
import { MessageLogger } from 'ais-tools'

export class SSHTunnel {
    private config: any
    private ssh: any
    private logger: MessageLogger

    constructor(config: any, logger: MessageLogger) {
        this.config = config
        this.logger = logger
    }

    public start(): void {
        if (this.config.enabled === true) {
            this.ssh = spawn('ssh', ['-N', '-L', this.config.forward, this.config.host])
            this.logger.info(`SSH Tunnel established(${this.ssh.pid})`)
        }
    }

    public async stop(): Promise<void> {
        if (this.ssh) {
            this.ssh.kill('SIGTERM')
            this.logger.info(`SSH Tunnel closed(${this.ssh.pid})`)
        }
    }
}

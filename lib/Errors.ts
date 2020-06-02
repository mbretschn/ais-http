export class DecoderError extends Error {
    orig: any
    constructor (message: string, orig: any) {
        super(message)

        this.name = this.constructor.name
        this.orig = orig

        Error.captureStackTrace(this, this.constructor)
    }
}

export class DispatcherError extends Error {
    orig: any
    constructor (message: string, orig: any) {
        super(message)

        this.name = this.constructor.name
        this.orig = orig

        Error.captureStackTrace(this, this.constructor)
    }
}
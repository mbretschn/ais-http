import { MessageLogger, Database, HTTPDispatcherService } from 'ais-tools'

const main = async function () {
    const url = 'http://data.aishub.net/ws.php'
        + '?username=*********&format=1&output=json&compress=3'
        + '&latmin=53.36837&latmax=53.60574&lonmin=9.652862&lonmax=10.244407'

    const logger = new MessageLogger({
        "level": "info",
        "filter": 0,
        "filename": "/var/log/ais/hub/%DATE%.log",
        "zippedArchive": false
    })

    const database = new Database({
        "url": "mongodb://ais:*******@localhost:27017",
        "options": {
            "useNewUrlParser": true,
            "useUnifiedTopology": true
        },
        "dbName": "ais_tracker",
        "sender": "hub"
    })

    const httpDispatcherService = new HTTPDispatcherService(database, logger)

    await httpDispatcherService.run(url, {
        "startSecond": 0,
        "startMinute": 1,
        "timeout": 61
    })
}

try {
    main()
} catch (err) {
    console.error(err)
}

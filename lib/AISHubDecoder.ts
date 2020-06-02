import { default as moment } from 'moment'
import { IDatabase, MessageLogger, NmeaPositionCollection, NmeaPosition,
    NmeaShipdataCollection, NmeaShipdata } from 'ais-tools'

export class AISHubDecoder {
    positionCollection: NmeaPositionCollection
    shipdataCollection: NmeaShipdataCollection
    logger: MessageLogger
    loglevel: number = 0

    constructor(db: IDatabase, logger: MessageLogger) {
        this.logger = logger
        this.positionCollection = new NmeaPositionCollection(db, logger)
        this.shipdataCollection = new NmeaShipdataCollection(db, logger)
    }

    public async decode(data: any): Promise<void> {
        const ship = await this.decodeShipdata(data)
        await ship.create()

        const position = await this.decodePosition(data)
        await position.create()
    }

    public async decodeShipdata(data: any): Promise<NmeaShipdata> {
        const now = moment()
        const nowDate = now.toDate()
        const eta = moment(data.ETA, 'MM-DD hh:mm')

        let etaf = ''
        if (eta.isValid()) {
            if (eta.isBefore(now)) {
                eta.add(1, 'year')
            }
            etaf = eta.format()
        }

        const ship = new NmeaShipdata(this.shipdataCollection)

        ship._id = this.shipdataCollection.database.createObjectID()
        ship.AIS = 5
        ship.Channel = 'A'
        ship.MMSI = data.MMSI
        ship.TimeStamp = nowDate

        ship.Data = {
            AISversion: 0,
            PositionType: 0,
            IMOnumber: data.IMO,
            CallSign: data.CALLSIGN,
            Name: data.NAME && data.NAME.trim(),
            ShipType: data.TYPE,
            DimA: data.A,
            DimB: data.B,
            DimC: data.C,
            DimD: data.D,
            Draught: data.DRAUGHT,
            ETA: etaf,
            Destination: data.DEST
        }

        ship.Sender = [{
            Name: this.shipdataCollection.Sender,
            TimeStamp: nowDate
        }]

        ship.CreatedAt = nowDate
        ship.CreatedBy = this.shipdataCollection.Sender
        ship.UpdatedAt = nowDate
        ship.UpdatedBy = this.shipdataCollection.Sender

        return ship
    }

    public async decodePosition(data: any): Promise<NmeaPosition> {
        const now = moment().utc()
        const nowDate = now.toDate()
        const date = moment.utc(data.TIME, 'YYYY-MM-DD hh:mm:ss GMT')

        const position = new NmeaPosition(this.positionCollection)

        position.chkDistance = [2, 2]

        position._id = this.positionCollection.database.createObjectID()
        position.AIS = 3
        position.Channel = 'A'
        position.MMSI = data.MMSI
        position.TimeStamp = date.toDate()

        position.Location = {
            type: "Point",
            coordinates: [ Number(data.LONGITUDE.toFixed(5)), Number(data.LATITUDE.toFixed(5)) ]
        }
        position.Data = {
            Longitude: Number(data.LONGITUDE.toFixed(5)),
            Latitude: Number(data.LATITUDE.toFixed(5)),
            ROT: data.ROT === 128 ? -128 : data.ROT,
            SOG: Number(data.SOG.toFixed(1)),
            COG: Number(data.COG.toFixed(1)),
            TrueHeading:  data.HEADING,
            NavigationStatus: data.NAVSTAT,
            PositionAccuracy: 1,
            TimeStampStatus: date.seconds()
        }

        position.Sender = [{
            Name: this.shipdataCollection.Sender,
            TimeStamp: nowDate
        }]

        position.CreatedAt = nowDate
        position.CreatedBy = this.shipdataCollection.Sender
        position.UpdatedAt = nowDate
        position.UpdatedBy = this.shipdataCollection.Sender

        return position
    }

}

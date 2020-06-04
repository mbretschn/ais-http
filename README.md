# AIS HTTP

A demon service to poll Position Reports and Static and Voyage Related Data via HTTP and store into MongoDB. Details about this project can be found [here](https://blog.3epnm.de/2020/05/15/AIS-Services/).

## Installation
The installation is done by cloning the project and installing the dependencies.
```
git clone https://github.com/3epnm/ais-http
cd ais-http
npm install
```
Before the project can be started, the configuration must first be adjusted.

## Configuration
The configuration is carried out with [node-config-ts](https://www.npmjs.com/package/node-config-ts). A simple but effective configuration manager for typescript based projects. The easiest way to adapt the configuration is to adapt the file default.json from the config directory of the project folder. In practice, it has proven useful to use a new configuration file depending on the NODE_ENV variable. How this works is explained in the documentation of node-config-ts. Refer to the npm page [node-config-ts](https://www.npmjs.com/package/node-config-ts) to learn all features it offers. 

The configuration file has the following content, which is explained below.
```javascript
{
    "database": {
        "url": "mongodb://127.0.0.1:27017",
        "options": {
            "useNewUrlParser": true,
            "useUnifiedTopology": true
        },
        "dbName": "ais-tracker",
        "sender": "***"
    },
    "dispatcher": {
        "second": 0,
        "timeout": 61,
        "rest": {
            "username": "***",
            "latmin": 53.36837696691308,
            "latmax": 53.60574780621288,
            "lonmin": 9.652862548828127,
            "lonmax": 10.244407653808596
        }
    },
    "logger": {
        "level": "info",
        "filter": 0,
        "filename": ""
    },
    "ssh": {
        "enabled": false,
        "forward": "27017:127.0.0.1:27017",
        "host": "***"
    }
}
```
### Database section
The configuration of the database is as follows:

|Parameter|Description|
|--|--|
|url|The connection url to the MongoDB instance.|
|options<br><br>|Options to setup the Database Connection.<br>All options of the [native MongoDB Driver](https://mongodb.github.io/node-mongodb-native/3.5/api/) are possible.|
|dbName|The name of the database where to store report data.|
|sender<br><br>|The name of the sender. Makes it possible to distinguish between<br>those who have created or updated a report in the case of several transmitters.|

AIS Tools initializes the database with the necessary collections and more important creates the necessary indexes. Default documents and position documents expire after one day and position documents are set with a geospatial index. Shipdata documents do not expire and will be updated if a new report is received.

### Dispatcher section
In the dispatcher section, the configuration the AIShub service is done:

|Parameter|Description|
|--|--|
|second<br><br>|The Second of the Minute, when the API is called. Useful, if more then one UDP stream is offered to AISHub and the API can be called more often than once per minute.|
|timeout<br><br>|The timeout between two API calls. In the example above, 61s is configured which is suitable for AIShub|
|rest<br><br>|In this subsection, the username for the api request as well as the desired geographic boundery box is configured for which vessels and positions are requested. Refer [API Documentation](http://www.aishub.net/api) page at AIShub. for more details about this service|

### Logger section
Logging is done with Winston universal logging library. 

|Parameter|Description|
|--|--|
|level<br><br>|The logging levels are named after npm logging levels and allows<br>to configure how verbose the messages are written to a logfile or to stdout.|
|filter<br><br><br>|The filter is a MMSI Number - an identifier every AIS Report has<br>and which is unique to the vessel.<br>Used to log the processing of Reports for a specific vessel.|
|filename<br><br>|The filename where the log file is written to.<br>If empty, the messages are written to stdout.|

The logger uses the winston-daily-rotate-file to archive log files if used in a debug level for a longer period of time. In addition, the logger can also be controlled via the NODE_ENV environment variable. If set to "debug", the log messages also written to stdout, regardless of whether the filename parameter is set or not.

### SSH section
The following configuration enables an SSH tunnel to be created if required, which is started as a child process.

|Parameter|Description|
|--|--|
|enabled|Whether the function is used or not|
|forward|Which port from the source is forwarded to a port at the destination|
|host|The host of the source|

## Start the Service
Once the configuration is done, the service can be started with `npm start` 
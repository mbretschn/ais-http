/* tslint:disable */
/* eslint-disable */
interface Config {
  database: Database;
  dispatcher: Dispatcher;
  logger: Logger;
  ssh: Ssh;
}
interface Ssh {
  enabled: boolean;
  forward: string;
  host: string;
}
interface Logger {
  level: string;
  filter: number;
  filename: string;
}
interface Dispatcher {
  startSecond: number;
  startMinute: number;
  timeout: number;
  rest: Rest;
}
interface Rest {
  username: string;
  latmin: number;
  latmax: number;
  lonmin: number;
  lonmax: number;
}
interface Database {
  url: string;
  options: Options;
  dbName: string;
  sender: string;
}
interface Options {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
}
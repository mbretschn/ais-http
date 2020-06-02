/* tslint:disable */
/* eslint-disable */
interface Config2 {
  dbConfig: DbConfig;
  config: Config;
  logger: Logger;
  ssh: Ssh;
  loggy: Loggy;
}
interface Loggy {
  token: string;
  subdomain: string;
}
interface Ssh {
  forward: string;
  host: string;
}
interface Logger {
  level: string;
  filter: number;
  filename: string;
}
interface Config {
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
interface DbConfig {
  url: string;
  options: Options;
  dbName: string;
  sender: string;
}
interface Options {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
}
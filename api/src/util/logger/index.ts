import { dateTime } from "@/util/date-time/formats";

interface LogLevel {
  key: string,
  priority: number,
}

const LogLevels = {
  NONE: { key: "NONE", priority: -1 },
  ERROR: { key: "ERROR", priority: 0 },
  WARN: { key: "WARN", priority: 1 },
  INFO: { key: "INFO", priority: 2 },
  VERBOSE: { key: "VERBOSE", priority: 3 },
  DEBUG: { key: "DEBUG", priority: 4 },
  SILLY: { key: "SILLY", priority: 5 },
};

const envLogLevelDefaults: { [id: string]: LogLevel } = {
  development: LogLevels.DEBUG,
  test: LogLevels.ERROR,
};

const envDefaultLogLevel = envLogLevelDefaults[String(process.env.NODE_ENV)] || LogLevels.INFO;
const envLogLevel = Object.values(LogLevels).find(({ key }) => process.env.LOG_LEVEL?.toLowerCase() === key.toLowerCase());


class Logger {
  public static globalLogLevel: LogLevel = envLogLevel || envDefaultLogLevel;

  private label: string | undefined;

  constructor(label?: string) {
    this.label = label;
  }

  public error(message: any) {
    this.log(LogLevels.ERROR, message);
  }

  public warn(message: any) {
    this.log(LogLevels.WARN, message);
  }

  public info(message: any) {
    this.log(LogLevels.INFO, message);
  }

  public verbose(message: any) {
    this.log(LogLevels.VERBOSE, message);
  }

  public debug(message: any) {
    this.log(LogLevels.DEBUG, message);
  }

  public silly(message: any) {
    this.log(LogLevels.SILLY, message);
  }

  private log(level: LogLevel, message: any) {
    if (level.priority <= Logger.globalLogLevel.priority) {
      let logFunc;
      if (level === LogLevels.ERROR) {
        // eslint-disable-next-line no-console
        logFunc = console.error;
      } else if (level === LogLevels.WARN) {
        // eslint-disable-next-line no-console
        logFunc = console.warn;
      } else {
        // eslint-disable-next-line no-console
        logFunc = console.log;
      }
      const timestamp = dateTime(new Date());
      const prefixParts = [];
      if (this.label) {
        prefixParts.push(`[${this.label}]`);
      }
      if (level !== LogLevels.NONE && level !== LogLevels.SILLY) {
        prefixParts.push(`[${level.key}]`);
      }
      prefixParts.push(`<${timestamp}>`);
      const prefix = prefixParts.join(" ");
      if (typeof message === "string") {
        logFunc(`${prefix} ${message}`);
      } else {
        logFunc(prefix);
        logFunc(message);
      }
    }
  }
}

export function createLogger(label?: string) {
  return new Logger(label);
}

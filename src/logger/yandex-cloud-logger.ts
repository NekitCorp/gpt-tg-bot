import { ILogger } from "./types";

const enum YandexCloudLoggingLevel {
    TRACE = "TRACE",
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL",
}

/**
 * @link https://cloud.yandex.com/en/docs/functions/concepts/logs
 */
interface YandexCloudLog {
    message: string;
    level: YandexCloudLoggingLevel;
    /** All fields, except `message/msg` and `level`, are automatically logged to `json-payload`. */
    data?: any;
}

export class YandexCloudLogger implements ILogger {
    public info(message: string, data?: unknown) {
        this.log({ message, level: YandexCloudLoggingLevel.INFO, data });
    }

    public warn(message: string, data?: unknown) {
        this.log({ message, level: YandexCloudLoggingLevel.WARN, data });
    }

    public error(message: string, data?: unknown) {
        this.log({ message, level: YandexCloudLoggingLevel.ERROR, data });
    }

    private log(log: YandexCloudLog) {
        try {
            console.log(JSON.stringify(log));
        } catch (error) {
            console.log(JSON.stringify({ message: log.message, level: YandexCloudLoggingLevel.ERROR, data: error }));
        }
    }
}

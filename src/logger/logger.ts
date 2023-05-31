import { Logger as TSLogger } from "tslog";

export class Logger {
    private readonly logger: Console | TSLogger<unknown>;

    constructor(isYandexCloud: boolean) {
        this.logger = isYandexCloud ? console : new TSLogger();
    }

    public info(message: string, data?: unknown) {
        try {
            this.logger.info(JSON.stringify({ message, level: "INFO", data }));
        } catch (error) {
            this.logger.info(JSON.stringify({ message, level: "ERROR", data: `${error}` }));
        }
    }
}

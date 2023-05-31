import { Context, NextFunction } from "grammy";
import { Logger } from "../../logger";

export function loggerMiddleware<T extends Context>(logger: Logger) {
    return async (ctx: T, next: NextFunction) => {
        logger.info("Telegram update", ctx.update);

        return next();
    };
}

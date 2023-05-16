import { Context, NextFunction } from "grammy";
import { Logger } from "tslog";

export function loggerMiddleware<T extends Context>(logger: Logger<unknown>) {
    return async (ctx: T, next: NextFunction) => {
        logger.info(ctx.update);
        return next();
    };
}

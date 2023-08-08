import { Context, NextFunction } from "grammy";

export function loggerMiddleware<T extends Context>(logger: ILogger) {
    return async (ctx: T, next: NextFunction) => {
        logger.info(`Telegram update. User: @${ctx.from?.username}, ${ctx.chat?.id}.`, ctx.update);

        return next();
    };
}

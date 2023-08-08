import { Context, NextFunction } from "grammy";

const STICKER_FILE_ID_ACCESS_DENIED = "CAACAgIAAxkBAANSZGOgyP8Q5ELcCqBp4SHddNmp7kwAAkUTAAJpr8lLqaVJkKIF8sMvBA";

export function onlySupportedChatsMiddleware<T extends Context>(chatIds: number[], logger: ILogger) {
    return async (ctx: T, next: NextFunction) => {
        // No chat = no service
        if (!ctx.chat) {
            return;
        }

        if (chatIds.includes(ctx.chat.id)) {
            return next();
        } else {
            logger.warn(`Chat id ${ctx.chat.id} not supported.`, ctx.update);
        }

        if (ctx.chat.type === "private") {
            return ctx.replyWithSticker(STICKER_FILE_ID_ACCESS_DENIED);
        }
    };
}

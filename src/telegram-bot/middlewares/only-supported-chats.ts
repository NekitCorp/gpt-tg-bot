import { Context, NextFunction } from "grammy";

const STICKER_FILE_ID_ACCESS_DENIED = "CAACAgIAAxkBAANSZGOgyP8Q5ELcCqBp4SHddNmp7kwAAkUTAAJpr8lLqaVJkKIF8sMvBA";

export function onlySupportedChatsMiddleware<T extends Context>(chatIds: number[]) {
    return async (ctx: T, next: NextFunction) => {
        // No chat = no service
        if (!ctx.chat) {
            return;
        }

        if (chatIds.includes(ctx.chat.id)) {
            return next();
        }

        if (ctx.chat.type === "private") {
            return ctx.replyWithSticker(STICKER_FILE_ID_ACCESS_DENIED);
        }
    };
}

export function convertChatIdsString(value: string): number[] {
    return value.split(",").map((i) => Number(i));
}

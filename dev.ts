import { config } from "dotenv";
import { Logger } from "tslog";
import { OpenAI } from "./src/openai";
import { TelegramBot, convertChatIdsString } from "./src/telegram-bot";

config();

async function main() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error();
    }

    if (!process.env.TELEGRAM_BOT_SUPPORTED_CHAT_IDS) {
        throw new Error();
    }

    if (!process.env.OPEN_AI_API_KEY) {
        throw new Error();
    }

    if (!process.env.OPEN_AI_SYSTEM_MESSAGE) {
        throw new Error();
    }

    const logger = new Logger();
    const openAI = new OpenAI(
        process.env.OPEN_AI_API_KEY,
        { systemMessage: process.env.OPEN_AI_SYSTEM_MESSAGE },
        logger
    );
    const telegramBot = new TelegramBot(
        process.env.TELEGRAM_BOT_TOKEN,
        {
            supportedChatIds: convertChatIdsString(process.env.TELEGRAM_BOT_SUPPORTED_CHAT_IDS),
        },
        logger,
        openAI
    );

    process.once("SIGINT", () => telegramBot.stop());
    process.once("SIGTERM", () => telegramBot.stop());

    return telegramBot.start();
}

main();

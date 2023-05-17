import { config } from "dotenv";
import { Logger } from "tslog";
import { OpenAI } from "./src/openai";
import { TelegramBot, convertChatIdsString } from "./src/telegram-bot";
import { getEnv } from "./src/helpers";

config();

const TELEGRAM_BOT_TOKEN = getEnv("TELEGRAM_BOT_TOKEN");
const TELEGRAM_BOT_SUPPORTED_CHAT_IDS = getEnv("TELEGRAM_BOT_SUPPORTED_CHAT_IDS");
const OPEN_AI_API_KEY = getEnv("OPEN_AI_API_KEY");
const OPEN_AI_SYSTEM_MESSAGE = getEnv("OPEN_AI_SYSTEM_MESSAGE");

async function main() {
    const logger = new Logger();
    const openAI = new OpenAI(OPEN_AI_API_KEY, { systemMessage: OPEN_AI_SYSTEM_MESSAGE }, logger);
    const telegramBot = new TelegramBot(
        TELEGRAM_BOT_TOKEN,
        { supportedChatIds: convertChatIdsString(TELEGRAM_BOT_SUPPORTED_CHAT_IDS) },
        logger,
        openAI
    );

    // Enable graceful stop
    process.once("SIGINT", () => telegramBot.stop());
    process.once("SIGTERM", () => telegramBot.stop());
    process.once("SIGHUP", () => telegramBot.stop());

    return telegramBot.start();
}

main();

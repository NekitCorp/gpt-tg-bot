import { getEnv } from "./src/helpers";
import { Logger } from "./src/logger";
import { OpenAI } from "./src/openai";
import { TelegramBot, convertChatIdsString } from "./src/telegram-bot";

const TELEGRAM_BOT_TOKEN = getEnv("TELEGRAM_BOT_TOKEN");
const TELEGRAM_BOT_SUPPORTED_CHAT_IDS = getEnv("TELEGRAM_BOT_SUPPORTED_CHAT_IDS");
const OPEN_AI_API_KEY = getEnv("OPEN_AI_API_KEY");
const OPEN_AI_SYSTEM_MESSAGE = getEnv("OPEN_AI_SYSTEM_MESSAGE");

const logger = new Logger(true);
const openAI = new OpenAI(OPEN_AI_API_KEY, { systemMessage: OPEN_AI_SYSTEM_MESSAGE }, logger);
const telegramBot = new TelegramBot(
    TELEGRAM_BOT_TOKEN,
    { supportedChatIds: convertChatIdsString(TELEGRAM_BOT_SUPPORTED_CHAT_IDS) },
    logger,
    openAI
);

/**
 * Handler for Yandex Cloud Function
 */
module.exports.handler = async function (event: ICloudEvent, context: ICloudServiceData): Promise<ICloudResponse> {
    const message = event.body && JSON.parse(event.body);

    await telegramBot.update(message);

    return {
        statusCode: 200,
        body: "",
    };
};

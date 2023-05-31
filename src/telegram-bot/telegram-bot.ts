import { Bot } from "grammy";
import { Update } from "grammy/types";
import { Logger } from "tslog";
import { OpenAI } from "../openai";
import { loggerMiddleware, onlySupportedChatsMiddleware } from "./middlewares";

interface TelegramBotOptions {
    supportedChatIds: number[];
}

export class TelegramBot {
    private readonly bot: Bot;

    constructor(
        token: string,
        private options: TelegramBotOptions,
        private logger: Logger<unknown>,
        private openAI: OpenAI
    ) {
        this.bot = new Bot(token);
        this.registerMiddlewares();
        this.registerPicCommand();
        this.registerMessageHandler();
    }

    public start() {
        this.logger.info("Bot is starting...");

        this.bot.start({
            onStart: (botInfo) => {
                this.logger.info(`Bot @${botInfo.username} [${botInfo.id}] is running.`);
                this.logger.info(`Supported chat ids: ${this.options.supportedChatIds.join(", ")}.`);
            },
        });
    }

    public stop() {
        this.logger.info("Bot is stopping...");

        return this.bot.stop().then(() => {
            this.logger.info("Bot stopped.");
        });
    }

    public async update(update: Update) {
        await this.bot.init();
        return this.bot.handleUpdate(update);
    }

    private registerMiddlewares() {
        this.bot.use(onlySupportedChatsMiddleware(this.options.supportedChatIds));
        this.bot.use(loggerMiddleware(this.logger));
    }

    private registerMessageHandler() {
        this.bot.on("message:text", async (ctx) => {
            const { message, chat } = ctx;

            const isGroup = chat.type !== "private";
            const isPrivate = chat.type === "private";
            const isReply = Boolean(message.reply_to_message?.text);
            const isReplyBotMessage = message.reply_to_message?.from?.id === ctx.me.id;
            const isMentionBot = ctx.message.entities?.some(
                (entity) =>
                    entity.type === "mention" &&
                    ctx.message.text.slice(entity.offset, entity.offset + entity.length) === `@${ctx.me.username}`
            );
            const text = isMentionBot ? message.text.replace(`@${ctx.me.username}`, "").trim() : message.text;
            const prevMessage = isReply
                ? isReplyBotMessage
                    ? { role: "assistant" as const, content: message.reply_to_message!.text! }
                    : { role: "user" as const, content: message.reply_to_message!.text! }
                : undefined;

            if (isPrivate || (isGroup && isMentionBot) || (isGroup && isReplyBotMessage)) {
                ctx.replyWithChatAction("typing");

                const response = await this.openAI.createChatCompletion(text, prevMessage);

                return ctx.reply(response, { reply_to_message_id: isGroup ? message.message_id : undefined });
            }
        });
    }

    private registerPicCommand() {
        this.bot.command("pic", async (ctx) => {
            const prompt = ctx.message?.text?.replace("/pic", "").trim();

            if (prompt) {
                return ctx.reply(`💩 The feature is temporarily unavailable.\n\n🏞️ Picture should be here: ${prompt}`);

                // await ctx.replyWithChatAction("typing");

                // const url = await this.openAI.createImage(prompt);

                // ctx.replyWithPhoto(url, {
                //     reply_to_message_id: ctx.message?.message_id,
                // });
            }
        });
    }
}

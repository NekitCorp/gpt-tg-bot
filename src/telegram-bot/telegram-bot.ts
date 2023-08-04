import axios from "axios";
import { spawn } from "child_process";
import { Bot } from "grammy";
import { Chat, Message, Update, UserFromGetMe } from "grammy/types";
import { Readable } from "stream";
import { Logger } from "../logger";
import { OpenAI } from "../openai";
import { loggerMiddleware, onlySupportedChatsMiddleware } from "./middlewares";

interface TelegramBotOptions {
    supportedChatIds: number[];
}

export class TelegramBot {
    private readonly bot: Bot;

    constructor(
        private token: string,
        private options: TelegramBotOptions,
        private logger: Logger,
        private openAI: OpenAI
    ) {
        this.bot = new Bot(token);

        this.registerMiddlewares();
        this.registerPicCommand();
        this.registerMessageHandler();
        this.registerVoiceMessageHandler();
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
            const { needReaction, prevMessage, text, isGroup } = this.parseMessage(ctx.message, ctx.chat, ctx.me);

            if (needReaction && text) {
                ctx.replyWithChatAction("typing");

                const response = await this.openAI.createChatCompletion(text, prevMessage);

                return ctx.reply(response, { reply_to_message_id: isGroup ? ctx.message.message_id : undefined });
            }
        });
    }

    private registerVoiceMessageHandler() {
        this.bot.on("message:voice", async (ctx) => {
            const { needReaction, isGroup, prevMessage } = this.parseMessage(ctx.message, ctx.chat, ctx.me);

            if (!needReaction) {
                return;
            }

            if (ctx.msg.voice.duration > 30) {
                return ctx.reply(`🚫 Voice message duration limit exceeded. The maximum duration is 30 seconds.`);
            }

            const file = await ctx.getFile();
            const { data: voiceOgg } = await axios.get<Readable>(
                `https://api.telegram.org/file/bot${this.token}/${file.file_path}`,
                { responseType: "stream" }
            );

            // Converting .ogg to .mp3
            const ffmpegProcess = spawn("ffmpeg", ["-f", "ogg", "-i", "-", "-f", "mp3", "-"]);
            voiceOgg.pipe(ffmpegProcess.stdin);

            const text = await this.openAI.createTranscription(ffmpegProcess.stdout);

            await ctx.reply("Request: " + text + "\n\n⌛ Processing a request...");

            ctx.replyWithChatAction("typing");

            const response = await this.openAI.createChatCompletion(text, prevMessage);

            return ctx.reply(response, { reply_to_message_id: isGroup ? ctx.message.message_id : undefined });
        });
    }

    private registerPicCommand() {
        this.bot.command("pic", async (ctx) => {
            const prompt = ctx.message?.text?.replace("/pic", "").trim();

            if (prompt) {
                await ctx.replyWithChatAction("upload_photo");

                const url = await this.openAI.createImage(prompt);

                ctx.replyWithPhoto(url, {
                    reply_to_message_id: ctx.message?.message_id,
                });
            }
        });
    }

    private parseMessage(message: Message, chat: Chat, me: UserFromGetMe) {
        const isGroup = chat.type !== "private";
        const isPrivate = chat.type === "private";
        const isReply = Boolean(message.reply_to_message?.text);
        const isReplyBotMessage = message.reply_to_message?.from?.id === me.id;
        const isMentionBot = message.entities?.some(
            (entity) =>
                entity.type === "mention" &&
                message.text?.slice(entity.offset, entity.offset + entity.length) === `@${me.username}`
        );

        const text = isMentionBot ? message.text?.replace(`@${me.username}`, "").trim() : message.text;
        const prevMessage = isReply
            ? isReplyBotMessage
                ? { role: "assistant" as const, content: message.reply_to_message!.text! }
                : { role: "user" as const, content: message.reply_to_message!.text! }
            : undefined;

        return {
            isGroup,
            needReaction: isPrivate || (isGroup && isMentionBot) || (isGroup && isReplyBotMessage),
            prevMessage,
            text,
        };
    }
}

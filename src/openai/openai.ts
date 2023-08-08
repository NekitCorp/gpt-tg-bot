import { ReadStream } from "fs";
import {
    ChatCompletionRequestMessage,
    Configuration,
    CreateChatCompletionRequest,
    CreateImageRequest,
    CreateImageRequestSizeEnum,
    OpenAIApi,
} from "openai";
import { Readable } from "stream";
import { ILogger } from "../logger";

interface OpenAIOptions {
    systemMessage: string;
}

export class OpenAI {
    private readonly openAIApi: OpenAIApi;

    constructor(apiKey: string, private options: OpenAIOptions, private logger: ILogger) {
        const configuration = new Configuration({ apiKey });

        this.openAIApi = new OpenAIApi(configuration);
    }

    /**
     * Chat Completions.
     * @description Chat models take a list of messages as input and return a model-generated message as output.
     * @link https://platform.openai.com/docs/guides/gpt/chat-completions-api
     * @price https://openai.com/pricing
     */
    public async createChatCompletion(
        userMessage: string,
        prevMessage?: ChatCompletionRequestMessage
    ): Promise<string> {
        const messages: ChatCompletionRequestMessage[] = [];

        if (this.options.systemMessage) {
            messages.push({ role: "system", content: this.options.systemMessage });
        }

        if (prevMessage) {
            messages.push(prevMessage);
        }

        messages.push({ role: "user", content: userMessage });

        const request: CreateChatCompletionRequest = {
            // Unfortunately, there is no access to GPT-4, so use GPT-3.5 for now:
            // https://help.openai.com/en/articles/7102672-how-can-i-access-gpt-4
            model: "gpt-3.5-turbo",
            temperature: 1,
            max_tokens: 512,
            messages,
        };

        this.logger.info("OpenAI.createChatCompletion request", request);
        const response = await this.openAIApi.createChatCompletion(request);
        this.logger.info("OpenAI.createChatCompletion response", response.data);

        const choices = response.data.choices;
        const content = choices[choices.length - 1].message?.content;

        if (!content) {
            throw new Error();
        }

        return content;
    }

    /**
     * Image generation.
     * @description Generate or manipulate images with our DALL·E models.
     * @link https://platform.openai.com/docs/guides/images
     * @price https://openai.com/pricing
     */
    public async createImage(prompt: string, size = CreateImageRequestSizeEnum._512x512): Promise<string> {
        const request: CreateImageRequest = {
            prompt,
            n: 1,
            size,
        };

        this.logger.info("OpenAI.createImage request", request);
        const response = await this.openAIApi.createImage(request);
        this.logger.info("OpenAI.createImage response", response.data);

        const url = response.data.data[0].url;

        if (!url) {
            throw new Error();
        }

        return url;
    }

    /**
     * Speech to text.
     * @description Turn audio into text.
     * @link https://platform.openai.com/docs/guides/speech-to-text
     * @price https://openai.com/pricing
     */
    public async createTranscription(stream: Readable): Promise<string> {
        // HACK: Necessary to quack like a file upload.
        // https://github.com/openai/openai-node/issues/77#issuecomment-1483937913
        (stream as ReadStream).path = "upload.mp3";

        this.logger.info("OpenAI.createTranscription request");
        const response = await this.openAIApi.createTranscription(
            // HACK: https://github.com/openai/openai-node/issues/77#issuecomment-1452801077
            stream as unknown as File,
            "whisper-1"
        );
        this.logger.info("OpenAI.createTranscription response", response.data);

        return response.data.text;
    }
}

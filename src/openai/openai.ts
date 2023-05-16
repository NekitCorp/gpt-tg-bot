import { ChatCompletionRequestMessage, Configuration, CreateImageRequestSizeEnum, OpenAIApi } from "openai";
import { Logger } from "tslog";

interface OpenAIOptions {
    systemMessage: string;
}

export class OpenAI {
    private readonly openAIApi: OpenAIApi;

    constructor(apiKey: string, private options: OpenAIOptions, private logger: Logger<unknown>) {
        const configuration = new Configuration({ apiKey });

        this.openAIApi = new OpenAIApi(configuration);
    }

    public async createChatCompletion(
        userMessage: string,
        prevMessage?: ChatCompletionRequestMessage
    ): Promise<string> {
        const messages: ChatCompletionRequestMessage[] = [{ role: "system", content: this.options.systemMessage }];

        if (prevMessage) {
            messages.push(prevMessage);
        }

        messages.push({ role: "user", content: userMessage });

        this.logger.info(messages);

        const response = await this.openAIApi.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.9,
            max_tokens: 512,
            messages,
        });

        this.logger.info(response.data);

        const choices = response.data.choices;
        const content = choices[choices.length - 1].message?.content;

        if (!content) {
            throw new Error();
        }

        return content;
    }

    public async createImage(prompt: string, size = CreateImageRequestSizeEnum._512x512): Promise<string> {
        this.logger.info(prompt);

        const response = await this.openAIApi.createImage({
            prompt,
            n: 1,
            size,
        });

        this.logger.info(response.data);

        const url = response.data.data[0].url;

        if (!url) {
            throw new Error();
        }

        return url;
    }
}

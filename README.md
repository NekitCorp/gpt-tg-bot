# OpenAI Telegram Bot

## Features

-   Chat with a bot using [Chat Completions](https://platform.openai.com/docs/guides/gpt/chat-completions-api) and `gpt-3.5-turbo` model.
-   Image generation with [Image generation](https://platform.openai.com/docs/guides/images) and `DALL·E` model using the command `/pic {prompt}`.
-   Processing voice messages using [Speech to text](https://platform.openai.com/docs/guides/speech-to-text) and `whisper-1` model.

## Development

```sh
# Copy and fill the file with environment variables
copy .env.example .env

# Install dependencies
npm i

# Start telegram bot
npm run dev

# Run type-checker
npm run check
```

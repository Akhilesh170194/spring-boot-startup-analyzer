// ProviderPresets.js - ESM constant for provider metadata and embedded defaults
// @ts-check

export const ProviderPresets = {
    AI_PROVIDERS: {
        openrouter: {
            name: 'OpenRouter (Default)',
            baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
            model: 'qwen/qwen3-235b-a22b:free',
            docs: 'https://openrouter.ai'
        },
        openai: {
            name: 'OpenAI',
            baseUrl: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4o-mini',
            docs: 'https://platform.openai.com/docs'
        },
        anthropic: {
            name: 'Anthropic',
            baseUrl: 'https://api.anthropic.com/v1/messages',
            model: 'anthropic/claude-sonnet-4.5',
            docs: 'https://docs.anthropic.com'
        },
        deepseek: {
            name: 'DeepSeek',
            baseUrl: 'https://api.deepseek.com/v1/chat/completions',
            model: 'deepseek/deepseek-chat-v3.1:free',
            docs: 'https://platform.deepseek.com'
        }
    },
    DEFAULT_KEYS: {
        // Embedded at user request (client-visible). For production, move server-side.
        openrouter: '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'
    }
};

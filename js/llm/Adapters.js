// Adapters.js (ESM) - Provider adapters for LLM calls (browser fetch)
// @ts-check

export class OpenAIAdapter {
    constructor(baseUrl, apiKey, extra) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.extra = extra || {};
    }

    makeRequest({model, system, user, temperature = 0.2, stream = false, signal}) {
        const headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.apiKey};
        // Friendly headers for OpenRouter only; some custom endpoints reject unknown headers
        if (this.extra && this.extra.provider === 'openrouter') {
            headers['HTTP-Referer'] = location.origin;
            headers['X-Title'] = 'Spring Boot Startup Analyzer';
        }
        const body = {
            model,
            messages: [{role: 'system', content: system}, {role: 'user', content: user}],
            temperature,
            stream
        };
        return fetch(this.baseUrl, {method: 'POST', headers, body: JSON.stringify(body), signal});
    }
}


export class AnthropicAdapter {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    makeRequest({model, system, user, signal}) {
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
        };
        const body = {
            model,
            system,
            max_tokens: 1024,
            messages: [{role: 'user', content: [{type: 'text', text: user}]}]
        };
        return fetch(this.baseUrl, {method: 'POST', headers, body: JSON.stringify(body), signal});
    }
}

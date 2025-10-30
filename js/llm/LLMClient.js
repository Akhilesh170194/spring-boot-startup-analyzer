// LLMClient.js (ESM) — Sends the loaded startup JSON to the selected LLM provider and returns analysis text
// @ts-check

import {build as buildPrompt} from './PromptBuilder.js';
import {AnthropicAdapter, OpenAIAdapter} from './Adapters.js';

export class LLMClient {
    /** @param {{ manager: import('./LLMManager.js').LLMManager }} deps */
    constructor(deps) {
        this.manager = deps.manager;
    }

    /**
     * Analyze startup data with the active LLM profile.
     * @param {any} data - The /actuator/startup JSON object or string.
     * @param {{ onStatus?: (msg: string) => void, signal?: AbortSignal, fullJson?: boolean, attempts?: number, allowFallback?: boolean }=} opts
     */
    async analyze(data, opts) {
        const mgr = this.manager;
        const profile = mgr.getActiveProfile();
        if (!profile) throw new Error('No active LLM profile');

        // Basic validations
        const provider = profile.provider || mgr._inferProvider(profile.baseUrl || '');
        const baseUrl = profile.baseUrl || '';
        const apiKey = profile.apiKey || '';
        let model = profile.model || '';
        if (!baseUrl) throw new Error('Base URL is missing for the active profile');
        if (!apiKey) throw new Error('API Key is missing for the active profile');
        // Model rules:
        // - Known OpenAI-like providers (openrouter/openai/deepseek) default later
        // - OpenAI Compatible (custom) requires explicit model
        if (!model && provider === 'custom') {
            throw new Error('Model is missing for the OpenAI Compatible provider. Please specify a model in LLM Settings.');
        }

        // Build prompt (compact by default, with truncated JSON), unless fullJson is requested
        if (opts && opts.signal && opts.signal.aborted) throw new Error('Canceled');
        let systemPrompt, userPrompt;
        if (opts && opts.fullJson) {
            // Minify JSON to reduce tokens and CPU; avoid pretty printing
            const jsonText = typeof data === 'string' ? data : JSON.stringify(data);
            systemPrompt = 'You are an expert Spring Boot performance engineer. Analyze startup timeline JSON and provide: 1) a brief summary, 2) the top bottlenecks (slow/critical), and 3) actionable optimization suggestions. Keep it concise.';
            userPrompt = 'Here is the /actuator/startup JSON to analyze:\n\n' + jsonText + '\n\nReturn only plain text, no markdown tables.';
        } else {
            const built = buildPrompt(typeof data === 'string' ? this.#tryParse(data) : data, {
                maxJsonBytes: 100 * 1024,
                topN: 10
            });
            systemPrompt = built.system;
            userPrompt = built.user;
        }

        // Dispatch based on provider with retry/backoff
        const attempts = (opts && opts.attempts) || 3;
        const onStatus = (opts && opts.onStatus) || (() => {
        });
        const signal = opts && opts.signal;

        // Use adapters for request dispatch; parse responses per provider family
        const makePayload = (m) => ({
            model: m,
            system: systemPrompt,
            user: userPrompt,
            temperature: 0.2,
            stream: false,
            signal
        });

        if (provider === 'anthropic') {
            const adapter = new AnthropicAdapter(baseUrl, apiKey);
            const res = await this.#fetchWithRetry(() => adapter.makeRequest(makePayload(model || 'anthropic/claude-sonnet-4.5')), {
                attempts,
                onStatus,
                signal,
                provider,
                baseUrl
            });
            const json = await this.#safeJson(res);
            const content = this.#extractAnthropicContent(json);
            if (!content) throw new Error('Unexpected Anthropic response shape');
            return content;
        }
        // Default to OpenAI-compatible (OpenRouter, OpenAI, DeepSeek, custom compatible)
        try {
            const adapter = new OpenAIAdapter(baseUrl, apiKey, {provider});
            const res = await this.#fetchWithRetry(() => adapter.makeRequest(makePayload(model || 'gpt-4o-mini')), {
                attempts,
                onStatus,
                signal,
                provider,
                baseUrl
            });
            const json = await this.#safeJson(res);
            const content = this.#extractOpenAIContent(json);
            if (!content) throw new Error('Unexpected LLM response shape');
            return content;
        } catch (e) {
            // Optional fallback model on repeated 429s
            if (opts && opts.allowFallback && String(e && e.message || '').includes('(429)')) {
                const fallbackModel = this.#pickFallbackModel(provider, model);
                if (fallbackModel && fallbackModel !== model) {
                    onStatus(`Rate limited. Trying fallback model: ${fallbackModel} ...`);
                    const adapter = new OpenAIAdapter(baseUrl, apiKey, {provider});
                    const res = await this.#fetchWithRetry(() => adapter.makeRequest(makePayload(fallbackModel)), {
                        attempts: 2,
                        onStatus,
                        signal,
                        provider,
                        baseUrl
                    });
                    const json = await this.#safeJson(res);
                    const content = this.#extractOpenAIContent(json);
                    if (!content) throw new Error('Unexpected LLM response shape');
                    return content;
                }
            }
            throw e;
        }
    }

    #pickFallbackModel(provider, current) {
        // Simple defaults; can be extended per presets
        if (provider === 'openrouter') return 'gpt-4o-mini';
        if (provider === 'openai') return 'gpt-4o-mini';
        if (provider === 'deepseek') return 'deepseek-chat';
        return current;
    }

    #tryParse(text) {
        try {
            return JSON.parse(text);
        } catch {
            return {};
        }
    }

    #extractOpenAIContent(json) {
        try {
            return json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content ? String(json.choices[0].message.content) : '';
        } catch {
            return '';
        }
    }

    #extractAnthropicContent(json) {
        try {
            return json && json.content && json.content[0] && json.content[0].text ? String(json.content[0].text) : '';
        } catch {
            return '';
        }
    }

    async #safeJson(res) {
        try {
            return await res.json();
        } catch {
            try {
                const t = await res.text();
                return JSON.parse(t);
            } catch {
                return {};
            }
        }
    }

    #friendlyMessage(status, providerMsg, provider, baseUrl) {
        const statusStr = String(status);
        const trimmed = (providerMsg || '').trim();
        // Default wrapper always includes original message
        let base = `LLM request failed (${statusStr}): ${trimmed || 'Unknown error'}`;

        // Network/CORS
        if (statusStr === 'network' || statusStr === '0') {
            return base + '\nHint: This may be a network or CORS issue. If opening index.html from disk, serve via a local server and ensure the provider allows requests from your origin.';
        }
        // 401/403 auth issues
        if (statusStr === '401' || statusStr === '403') {
            return base + '\nHint: Check API key/organization permissions and that the selected model is allowed for your account.';
        }
        // 404 specifics
        if (statusStr === '404') {
            // OpenRouter data policy/free model publication
            if (/openrouter/i.test(baseUrl || '') && /no endpoints found matching your data policy/i.test(trimmed)) {
                return 'LLM request failed (404): OpenRouter blocked this request due to your data policy. Enable “Free model publication” or pick a non-free model.\nAction: Visit https://openrouter.ai/settings/privacy to adjust your Data Policy.\nProvider message: ' + trimmed;
            }
            // Model or path not found
            return base + '\nHint: Verify the Base URL and Model. Some providers use different endpoints or model names.';
        }
        // 429 rate limit
        if (statusStr === '429') {
            return base + '\nHint: You hit a rate limit. Wait and retry, switch to a lighter model, or try again later.';
        }
        // 400 bad request
        if (statusStr === '400') {
            return base + '\nHint: The provider rejected the request. Check your model name, base URL, and request size (try turning off “Send full JSON”).';
        }
        // 5xx server errors
        if (/^5\d\d$/.test(statusStr)) {
            return base + '\nHint: Provider error. Try again later; if it persists, change the model or provider.';
        }
        return base;
    }

    async #fetchWithRetry(doFetch, opts) {
        const attempts = (opts && opts.attempts) || 3;
        const onStatus = (opts && opts.onStatus) || (() => {
        });
        let lastErrText = '';
        for (let attempt = 1; attempt <= attempts; attempt++) {
            if (opts && opts.signal && opts.signal.aborted) throw new Error('Canceled');
            const res = await doFetch().catch(err => {
                lastErrText = String(err && err.message || err);
                return null;
            });
            if (res && res.ok) return res;

            let status = res ? res.status : 0;
            let errText = res ? await this.#safeText(res) : lastErrText || 'Network error';
            let retryAfterSec = 0;
            if (res) {
                const h = res.headers;
                const ra = h.get('retry-after');
                if (ra) retryAfterSec = Number(ra);
            }
            if (status === 429 && attempt < attempts) {
                const backoffMs = this.#computeBackoff(attempt, retryAfterSec);
                const seconds = Math.ceil(backoffMs / 1000);
                onStatus(`Rate limited, retrying in ${seconds}s (attempt ${attempt + 1}/${attempts})...`);
                await this.#wait(backoffMs, opts && opts.signal);
                continue;
            }
            if (status >= 500 && attempt < attempts) {
                const backoffMs = this.#computeBackoff(attempt, 0);
                onStatus(`Server error ${status}, retrying in ${Math.ceil(backoffMs / 1000)}s (attempt ${attempt + 1}/${attempts})...`);
                await this.#wait(backoffMs, opts && opts.signal);
                continue;
            }
            // No retry path
            let providerMsg = errText;
            try {
                const j = JSON.parse(errText);
                providerMsg = j.error?.message || providerMsg;
            } catch {
            }
            const friendly = this.#friendlyMessage(status || 'network', providerMsg, opts && opts.provider, opts && opts.baseUrl);
            throw new Error(friendly);
        }
        throw new Error('LLM request failed: retries exhausted');
    }

    #computeBackoff(attempt, retryAfterSec) {
        if (retryAfterSec && retryAfterSec > 0) return Math.min(30000, retryAfterSec * 1000);
        const base = 600; // ms
        const jitter = Math.floor(Math.random() * 250);
        return Math.min(30000, Math.pow(2, attempt - 1) * base + jitter);
    }

    #wait(ms, signal) {
        return new Promise((resolve, reject) => {
            if (signal && signal.aborted) return reject(new Error('Canceled'));
            const t = setTimeout(() => {
                resolve();
            }, ms);
            if (signal) signal.addEventListener('abort', () => {
                clearTimeout(t);
                reject(new Error('Canceled'));
            }, {once: true});
        });
    }

    async #safeText(res) {
        try {
            return await res.text();
        } catch {
            return '';
        }
    }
}
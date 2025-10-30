// LLMManager.js (ESM) — manages profiles, presets, and active selection
// @ts-check

function _uuid() {
    return 'p-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

export class LLMManager {
    /**
     * @param {{ profileStore: { getProfiles:()=>any[], setProfiles:(list:any[])=>void, getActiveId:()=>string, setActiveId:(id:string)=>void }, providerPresets: { AI_PROVIDERS: any, DEFAULT_KEYS: any } }} deps
     */
    constructor(deps) {
        this.store = deps.profileStore;
        this.presets = deps.providerPresets;
        /** expose for UI convenience */
        this.AI_PROVIDERS = this.presets.AI_PROVIDERS;
        this.DEFAULT_KEYS = this.presets.DEFAULT_KEYS;
    }

    _inferProvider(baseUrl) {
        const u = (baseUrl || '').toLowerCase();
        if (!u) return 'custom';
        if (u.includes('openrouter.ai')) return 'openrouter';
        if (u.includes('api.openai.com')) return 'openai';
        if (u.includes('anthropic.com')) return 'anthropic';
        if (u.includes('deepseek.com')) return 'deepseek';
        return 'custom';
    }

    ensureDefaultProfile() {
        let profiles = this.getProfiles();
        const hasDefault = profiles.some(p => p && p.isDefault);
        if (!hasDefault) {
            const p = this.presets.AI_PROVIDERS.openrouter;
            const def = {
                id: _uuid(),
                name: 'Default (OpenRouter)',
                provider: 'openrouter',
                baseUrl: p.baseUrl,
                apiKey: (this.presets.DEFAULT_KEYS && this.presets.DEFAULT_KEYS.openrouter) || '',
                model: p.model || '',
                isDefault: true,
                isDraft: false
            };
            profiles.unshift(def);
            this.store.setProfiles(profiles);
            if (!this.getActiveProfileId()) this.setActiveProfileId(def.id);
        } else {
            const idx = profiles.findIndex(p => p && p.isDefault);
            if (idx >= 0) {
                const def = profiles[idx];
                if (!def.apiKey && this.presets.DEFAULT_KEYS && this.presets.DEFAULT_KEYS.openrouter) {
                    def.apiKey = this.presets.DEFAULT_KEYS.openrouter;
                    profiles[idx] = def;
                    this.store.setProfiles(profiles);
                }
            }
        }
    }

    getProfiles() {
        const list = this.store.getProfiles();
        return Array.isArray(list) ? list : [];
    }

    setProfiles(list) {
        this.store.setProfiles(list || []);
    }

    getActiveProfileId() {
        return this.store.getActiveId();
    }

    setActiveProfileId(id) {
        if (id) this.store.setActiveId(id);
    }

    getActiveProfile() {
        this.ensureDefaultProfile();
        const id = this.getActiveProfileId();
        const profiles = this.getProfiles();
        let prof = profiles.find(p => p.id === id);
        if (!prof && profiles.length > 0) {
            prof = profiles[0];
            this.setActiveProfileId(prof.id);
        }
        return prof;
    }

    saveProfile(input) {
        const profiles = this.getProfiles();
        let existingIdx = input.id ? profiles.findIndex(p => p.id === input.id) : -1;
        if (existingIdx >= 0 && profiles[existingIdx].isDefault) {
            return profiles[existingIdx];
        }
        const provider = input.provider || this._inferProvider(input.baseUrl || '');
        let baseUrlToSave = input.baseUrl || '';
        if (provider && provider !== 'custom' && this.presets.AI_PROVIDERS[provider]) {
            baseUrlToSave = this.presets.AI_PROVIDERS[provider].baseUrl || '';
        }
        const record = {
            id: input.id || _uuid(),
            name: input.name || 'New Profile',
            provider,
            baseUrl: baseUrlToSave,
            apiKey: input.apiKey || '',
            model: input.model || '',
            isDefault: !!(existingIdx >= 0 ? profiles[existingIdx].isDefault : false),
            isDraft: !!input.isDraft
        };
        if (existingIdx >= 0) {
            profiles[existingIdx] = record;
        } else {
            profiles.push(record);
        }
        this.setProfiles(profiles);
        return record;
    }

    deleteProfile(id) {
        const profiles = this.getProfiles();
        const idx = profiles.findIndex(p => p.id === id);
        if (idx < 0) return;
        if (profiles[idx].isDefault) throw new Error('Cannot delete default profile');
        profiles.splice(idx, 1);
        this.setProfiles(profiles);
        const activeId = this.getActiveProfileId();
        if (activeId === id) {
            const next = profiles[0];
            this.setActiveProfileId(next ? next.id : '');
        }
    }
}

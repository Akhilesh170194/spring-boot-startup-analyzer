// LlmSettingsController.js (ESM) — Encapsulates LLM Settings modal behavior with an injected manager
// @ts-check

export class LlmSettingsController {
    /** @param {{ manager: import('../llm/LLMManager.js').LLMManager }} deps */
    constructor(deps) {
        this.manager = deps.manager;
        this.prevActiveId = '';
    }

    // ---------- Modal controls ----------
    open() {
        const modal = document.getElementById('llmSettingsModal');
        if (!modal) return;
        try {
            this.prevActiveId = this.manager.getActiveProfileId();
        } catch {
            this.prevActiveId = '';
        }
        this.populate();
        modal.classList.remove('hidden');
    }

    close() {
        const modal = document.getElementById('llmSettingsModal');
        if (modal) modal.classList.add('hidden');
    }

    done() {
        const active = this.manager.getActiveProfile();
        const nameEl = /** @type {HTMLInputElement|null} */(document.getElementById('llmProfileName'));
        const base = /** @type {HTMLInputElement|null} */(document.getElementById('llmBaseUrl'));
        const key = /** @type {HTMLInputElement|null} */(document.getElementById('llmApiKey'));
        const model = /** @type {HTMLInputElement|null} */(document.getElementById('llmModel'));
        const preset = /** @type {HTMLSelectElement|null} */(document.getElementById('llmPreset'));

        const providerNow = preset && preset.value ? preset.value : this.manager._inferProvider(base ? base.value : '');
        const hasUnsaved = (
            (nameEl && (nameEl.value || '') !== (active.name || '')) ||
            (base && (base.value || '') !== (active.baseUrl || '')) ||
            (key && (key.value || '') !== (active.apiKey || '')) ||
            (model && (model.value || '') !== (active.model || '')) ||
            (providerNow !== (active.provider || this.manager._inferProvider(active.baseUrl || '')))
        );

        if (active.isDraft || hasUnsaved) {
            const ok = confirm('Unsaved Changes\nDo you want to discard changes and continue?');
            if (!ok) return;
            if (active.isDraft) {
                try {
                    this.manager.deleteProfile(active.id);
                } catch {
                }
                if (this.prevActiveId) {
                    this.manager.setActiveProfileId(this.prevActiveId);
                } else {
                    const fallback = this.manager.getProfiles()[0];
                    if (fallback) this.manager.setActiveProfileId(fallback.id);
                }
            }
        }
        try {
            this.populate();
        } catch {
        }
        this.close();
    }

    // ---------- UI population and events ----------
    populate() {
        const select = /** @type {HTMLSelectElement|null} */(document.getElementById('llmProfileSelect'));
        const nameEl = /** @type {HTMLInputElement|null} */(document.getElementById('llmProfileName'));
        const base = /** @type {HTMLInputElement|null} */(document.getElementById('llmBaseUrl'));
        const key = /** @type {HTMLInputElement|null} */(document.getElementById('llmApiKey'));
        const model = /** @type {HTMLInputElement|null} */(document.getElementById('llmModel'));
        const preset = /** @type {HTMLSelectElement|null} */(document.getElementById('llmPreset'));

        const profiles = this.manager.getProfiles();
        const active = this.manager.getActiveProfile();

        if (select) {
            select.innerHTML = '';
            profiles.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                let label = p.name || '(unnamed)';
                if (p.isDefault) label += ' 🔒';
                if (p.isDraft) label += ' (unsaved)';
                if (p.id === active.id) label += ' •';
                opt.textContent = label;
                select.appendChild(opt);
            });
            select.value = active.id;
        }

        if (nameEl) nameEl.value = active.name || '';
        if (base) base.value = active.baseUrl || '';
        if (key) key.value = active.apiKey || '';
        if (model) model.value = active.model || '';

        if (preset) {
            const provider = active.provider || this.manager._inferProvider(active.baseUrl || '');
            preset.value = this.manager.AI_PROVIDERS[provider] ? provider : 'custom';
            this._setBaseUrlRowVisible(preset.value === 'custom');
        }

        const isLocked = !!active.isDefault;
        const saveBtn = /** @type {HTMLButtonElement|null} */(document.getElementById('llmSaveBtn'));
        const delBtn = /** @type {HTMLButtonElement|null} */(document.getElementById('llmDeleteBtn'));
        if (nameEl) nameEl.disabled = isLocked;
        if (preset) preset.disabled = isLocked;
        if (base) base.disabled = isLocked;
        if (key) key.disabled = isLocked;
        if (model) model.disabled = isLocked;
        if (saveBtn) saveBtn.disabled = isLocked;
        if (delBtn) {
            delBtn.disabled = isLocked;
            delBtn.style.display = isLocked ? 'none' : '';
        }
    }

    onSelect(profileId) {
        const profiles = this.manager.getProfiles();
        const p = profiles.find(x => x.id === profileId);
        if (!p) return;

        try {
            const drafts = profiles.filter(x => x && x.isDraft && x.id !== p.id);
            drafts.forEach(d => this.manager.deleteProfile(d.id));
        } catch {
        }

        this.manager.setActiveProfileId(p.id);

        const nameEl = /** @type {HTMLInputElement|null} */(document.getElementById('llmProfileName'));
        const base = /** @type {HTMLInputElement|null} */(document.getElementById('llmBaseUrl'));
        const key = /** @type {HTMLInputElement|null} */(document.getElementById('llmApiKey'));
        const model = /** @type {HTMLInputElement|null} */(document.getElementById('llmModel'));
        const preset = /** @type {HTMLSelectElement|null} */(document.getElementById('llmPreset'));
        if (nameEl) nameEl.value = p.name || '';
        if (base) base.value = p.baseUrl || '';
        if (key) key.value = p.apiKey || '';
        if (model) model.value = p.model || '';
        if (preset) {
            const provider = p.provider || this.manager._inferProvider(p.baseUrl || '');
            preset.value = this.manager.AI_PROVIDERS[provider] ? provider : 'custom';
            this._setBaseUrlRowVisible(preset.value === 'custom');
        }

        const isLocked = !!p.isDefault;
        const saveBtn = /** @type {HTMLButtonElement|null} */(document.getElementById('llmSaveBtn'));
        const delBtn = /** @type {HTMLButtonElement|null} */(document.getElementById('llmDeleteBtn'));
        if (nameEl) nameEl.disabled = isLocked;
        if (preset) preset.disabled = isLocked;
        if (base) base.disabled = isLocked;
        if (key) key.disabled = isLocked;
        if (model) model.disabled = isLocked;
        if (saveBtn) saveBtn.disabled = isLocked;
        if (delBtn) {
            delBtn.disabled = isLocked;
            delBtn.style.display = isLocked ? 'none' : '';
        }

        this.populate();
    }

    newProfile() {
        const preset = this.manager.AI_PROVIDERS.openrouter;
        const created = this.manager.saveProfile({
            name: 'New Profile',
            provider: 'openrouter',
            baseUrl: preset.baseUrl,
            apiKey: '',
            model: preset.model,
            isDraft: true
        });
        this.manager.setActiveProfileId(created.id);
        this.populate();
    }

    deleteProfile() {
        const select = /** @type {HTMLSelectElement|null} */(document.getElementById('llmProfileSelect'));
        if (!select || !select.value) return;
        const id = select.value;
        const prof = this.manager.getProfiles().find(p => p.id === id);
        if (prof && prof.isDefault) {
            alert('The default OpenRouter profile is read-only and cannot be deleted. Create another profile instead.');
            return;
        }
        if (!confirm('Delete this profile?')) return;
        this.manager.deleteProfile(id);
        this.populate();
    }

    applyPreset(value) {
        const base = /** @type {HTMLInputElement|null} */(document.getElementById('llmBaseUrl'));
        const model = /** @type {HTMLInputElement|null} */(document.getElementById('llmModel'));
        if (!base || !model) return;
        if (value && value !== 'custom') {
            const p = this.manager.AI_PROVIDERS[value];
            if (p) {
                base.value = p.baseUrl || '';
                if (p.model !== undefined) model.value = p.model || '';
            }
            this._setBaseUrlRowVisible(false);
        } else {
            this._setBaseUrlRowVisible(true);
        }
    }

    save() {
        const select = /** @type {HTMLSelectElement|null} */(document.getElementById('llmProfileSelect'));
        const nameEl = /** @type {HTMLInputElement|null} */(document.getElementById('llmProfileName'));
        const base = /** @type {HTMLInputElement|null} */(document.getElementById('llmBaseUrl'));
        const key = /** @type {HTMLInputElement|null} */(document.getElementById('llmApiKey'));
        const model = /** @type {HTMLInputElement|null} */(document.getElementById('llmModel'));
        const preset = /** @type {HTMLSelectElement|null} */(document.getElementById('llmPreset'));

        const current = select && select.value ? (this.manager.getProfiles().find(p => p.id === select.value) || this.manager.getActiveProfile()) : this.manager.getActiveProfile();

        if (current && current.isDefault) {
            alert('Default profile is read-only. Create a new profile to customize settings.');
            this.populate();
            return;
        }

        // Respect explicit provider selection; do not auto-infer when user chose 'custom' (OpenAI Compatible)
        const provider = preset && preset.value ? preset.value : this.manager._inferProvider(base ? base.value : '');

        if ((!provider || provider === 'custom') && (!base || !base.value.trim())) {
            alert('Please provide a Base URL for the OpenAI Compatible provider.');
            return;
        }
        if (provider === 'custom') {
            if (!model || !model.value.trim()) {
                alert('Please provide a Model for the OpenAI Compatible provider (OpenAI-compatible endpoint requires an explicit model).');
                return;
            }
        }

        let baseUrlToSave = base ? base.value : '';
        if (provider && provider !== 'custom' && this.manager.AI_PROVIDERS[provider]) {
            baseUrlToSave = this.manager.AI_PROVIDERS[provider].baseUrl || '';
        }

        const saved = this.manager.saveProfile({
            id: current.id,
            name: nameEl ? nameEl.value : current.name,
            provider,
            baseUrl: baseUrlToSave,
            apiKey: key ? key.value : current.apiKey,
            model: model ? model.value : current.model,
            isDraft: false
        });

        this.manager.setActiveProfileId(saved.id);
        this.populate();
        alert('Profile saved.');
    }

    // ---------- helpers ----------
    _setBaseUrlRowVisible(visible) {
        const row = document.getElementById('llmBaseUrlRow');
        if (row) row.style.display = visible ? 'grid' : 'none';
    }
}

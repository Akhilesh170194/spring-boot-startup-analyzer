// ProfileStore.js (ESM) — encapsulates localStorage operations for LLM profiles
// @ts-check

export class ProfileStore {
    /** @param {Storage} storage */
    constructor(storage) {
        if (!storage) throw new Error('ProfileStore requires a Storage instance');
        this.storage = storage;
        this.KEYS = {profiles: 'llm.profiles', activeId: 'llm.activeProfileId'};
    }

    getProfiles() {
        const raw = this.storage.getItem(this.KEYS.profiles);
        if (!raw) return [];
        try {
            return JSON.parse(raw) || [];
        } catch {
            return [];
        }
    }

    setProfiles(list) {
        this.storage.setItem(this.KEYS.profiles, JSON.stringify(list || []));
    }

    getActiveId() {
        return this.storage.getItem(this.KEYS.activeId) || '';
    }

    setActiveId(id) {
        if (id) this.storage.setItem(this.KEYS.activeId, id);
    }
}

// AppController.js - Composition root for the dashboard (ES modules)
// @ts-check

import {AppStateStore} from './state/AppStateStore.js';
import {FilterManager} from './ui/FilterManager.js';
import {FileAndEventService} from './services/FileAndEventService.js';
import {ThemeService} from './services/ThemeService.js';
import {ProviderPresets} from '../llm/ProviderPresets.js';
import {ProfileStore} from '../llm/ProfileStore.js';
import {LLMManager} from '../llm/LLMManager.js';
import {LLMClient} from '../llm/LLMClient.js';
import {LlmSettingsController} from '../ui/LlmSettingsController.js';

class AppController {
    constructor() {
        this.state = new AppStateStore();
        this.filter = new FilterManager();
        this.theme = new ThemeService();
        this.io = new FileAndEventService(this.state, this.filter);

        // LLM singletons (wired in bootstrap)
        /** @type {{ presets:any, store: any, manager: any, client: any, settings: any }|null} */
        this.llm = null;

        /** @type {number|null} */ this._timelineClickTimer = null;
        /** @type {EventTarget|null} */ this._lastClickTarget = null;
    }

    bootstrap() {
        // Cache DOM
        this.state.initDom();

        // Init theme
        this.theme.init();

        // Wire LLM modules
        const presets = ProviderPresets;
        const store = new ProfileStore(localStorage);
        const manager = new LLMManager({profileStore: store, providerPresets: presets});
        const client = new LLMClient({manager});
        const settings = new LlmSettingsController({manager});
        this.llm = {presets, store, manager, client, settings};

        // Ensure default profile exists
        try {
            manager.ensureDefaultProfile();
        } catch {
        }

        // Show empty by default
        this.io.showEmpty();

        // Bind UI events
        this.bindControls();
    }

    bindControls() {
        // Theme toggle
        const themeBtn = document.getElementById('themeToggleBtn');
        themeBtn?.addEventListener('click', () => this.theme.toggle());

        // Analyze, Load JSON, Clear
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn?.addEventListener('click', () => this.io.analyzeByUrl());

        const loadJsonBtn = document.getElementById('loadJsonBtn');
        loadJsonBtn?.addEventListener('click', () => this.io.parsePasted());

        const clearBtn = document.getElementById('clearBtn');
        clearBtn?.addEventListener('click', () => this.io.clearAll());

        // File input
        const fileInput = /** @type {HTMLInputElement|null} */ (this.state.elements.jsonFile);
        fileInput?.addEventListener('change', (e) => this.io.handleFileSelected(e));

        // Expand All
        const expandAll = /** @type {HTMLInputElement|null} */ (this.state.elements.expandAll);
        expandAll?.addEventListener('change', (e) => {
            const checked = /** @type {HTMLInputElement} */(e.target).checked;
            document.querySelectorAll('.timeline-item').forEach(item => item.classList.toggle('expanded', checked));
            // If checking, also show children containers
            if (checked) {
                document.querySelectorAll('.timeline-children').forEach(c => c.classList.add('show'));
                document.querySelectorAll('.collapse-icon').forEach(ci => {
                    /** @type {HTMLElement} */(ci).style.transform = 'rotate(90deg)';
                });
            } else {
                document.querySelectorAll('.timeline-children').forEach(c => c.classList.remove('show'));
                document.querySelectorAll('.collapse-icon').forEach(ci => {
                    /** @type {HTMLElement} */(ci).style.transform = '';
                });
            }
        });

        // Stats grid delegation for filters
        const statsGrid = document.querySelector('.stats-grid');
        statsGrid?.addEventListener('click', (e) => {
            const card = /** @type {HTMLElement|null} */ ((e.target instanceof HTMLElement) ? e.target.closest('.stat-card') : null);
            const filter = card?.getAttribute('data-filter');
            if (filter === 'all' || filter === 'slow' || filter === 'critical') {
                this.filter.apply(filter);
            }
        });

        // Timeline delegation for expand/collapse
        const timeline = /** @type {HTMLElement|null} */ (this.state.elements.timelineContent);
        timeline?.addEventListener('click', (e) => this.handleTimelineClick(e));

        // LLM Settings bindings
        const menuLlm = document.getElementById('menuLlmSettings');
        menuLlm?.addEventListener('click', () => this.llm?.settings.open());

        const modalCloseBtn = document.getElementById('llmCloseBtn');
        modalCloseBtn?.addEventListener('click', () => this.llm?.settings.done());

        const doneBtn = document.getElementById('llmDoneBtn');
        doneBtn?.addEventListener('click', () => this.llm?.settings.done());

        const saveBtn = document.getElementById('llmSaveBtn');
        saveBtn?.addEventListener('click', () => this.llm?.settings.save());

        const newBtn = document.getElementById('llmNewBtn');
        newBtn?.addEventListener('click', () => this.llm?.settings.newProfile());

        const deleteBtn = document.getElementById('llmDeleteBtn');
        deleteBtn?.addEventListener('click', () => this.llm?.settings.deleteProfile());

        const presetSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('llmPreset'));
        presetSelect?.addEventListener('change', (e) => this.llm?.settings.applyPreset((/** @type {HTMLSelectElement} */(e.target)).value));

        const profileSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('llmProfileSelect'));
        profileSelect?.addEventListener('change', (e) => this.llm?.settings.onSelect((/** @type {HTMLSelectElement} */(e.target)).value));

        // Analyze with LLM (ESM client)
        const llmBtn = document.getElementById('analyzeWithLlmBtn');
        llmBtn?.addEventListener('click', () => this.analyzeWithLLM());

        // Keyboard shortcuts for LLM Settings
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            const ctrlComma = e.ctrlKey && key === ',';
            const altS = e.altKey && (key === 's' || key === 'S');
            if (ctrlComma || altS) {
                e.preventDefault();
                this.llm?.settings.open();
            }
        });
    }

    handleTimelineClick(e) {
        if (!(e.target instanceof HTMLElement)) return;
        const item = e.target.closest('.timeline-item');
        if (!item) return;

        // Single vs double click via timer
        if (this._timelineClickTimer === null) {
            this._timelineClickTimer = setTimeout(() => {
                // Single click: toggle expanded class
                item.classList.toggle('expanded');
                this._timelineClickTimer = null;
                this._lastClickTarget = null;
            }, 250);
            this._lastClickTarget = e.target;
        } else {
            clearTimeout(this._timelineClickTimer);
            this._timelineClickTimer = null;
            // Double-click: toggle children container visibility and caret rotation
            const children = /** @type {HTMLElement|null} */ (item.nextElementSibling instanceof HTMLElement && item.nextElementSibling.classList.contains('timeline-children') ? item.nextElementSibling : null);
            if (children) {
                const isExpanded = children.classList.contains('show');
                const caret = item.querySelector('.collapse-icon');
                if (caret) /** @type {HTMLElement} */(caret).style.transform = isExpanded ? '' : 'rotate(90deg)';
                children.classList.toggle('show');
            }
        }
    }

    async analyzeWithLLM() {
        const resultsSection = document.getElementById('llmResultsSection');
        const resultsContent = document.getElementById('llmResultsContent');
        if (!resultsSection || !resultsContent) {
            alert('LLM UI elements are missing from the page.');
            return;
        }
        try {
            if (!this.state.startupData) {
                const ta = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('pasteJson'));
                const text = (ta && ta.value) || '';
                if (text.trim()) {
                    try {
                        this.state.startupData = JSON.parse(text);
                    } catch {
                        alert('Please load valid /actuator/startup JSON first.');
                        return;
                    }
                } else {
                    alert('Please load /actuator/startup JSON first (Analyze, Load JSON, or paste).');
                    return;
                }
            }
            resultsSection.classList.remove('hidden');
            resultsContent.textContent = 'Sending data to LLM...';

            // Add cancel control
            let cancelBtn = document.getElementById('llmCancelBtn');
            if (!cancelBtn) {
                cancelBtn = document.createElement('button');
                cancelBtn.id = 'llmCancelBtn';
                cancelBtn.className = 'btn btn-secondary';
                cancelBtn.style.marginTop = '8px';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.title = 'Cancel the current LLM request';
                resultsContent.insertAdjacentElement('afterend', cancelBtn);
            }
            cancelBtn.disabled = false;

            const ac = new AbortController();
            const toggleDisabled = (v) => {
                const b = document.getElementById('llmCancelBtn');
                if (b) b.disabled = v;
            };
            cancelBtn.onclick = () => {
                ac.abort();
                toggleDisabled(true);
            };

            const fullJsonToggle = /** @type {HTMLInputElement|null} */ (document.getElementById('llmFullJsonToggle'));
            const fullJson = !!(fullJsonToggle && fullJsonToggle.checked);

            const content = await this.llm.client.analyze(this.state.startupData, {
                signal: ac.signal,
                allowFallback: true,
                attempts: 3,
                fullJson,
                onStatus: (msg) => {
                    const current = resultsContent.textContent || '';
                    resultsContent.textContent = current + (current.endsWith('\n') ? '' : '\n') + msg;
                }
            });
            toggleDisabled(true);
            resultsContent.textContent = content;
        } catch (err) {
            const msg = (err && err.message) ? err.message : String(err);
            resultsSection.classList.remove('hidden');
            resultsContent.textContent = 'Error: ' + msg + '\n' +
                'Tip: If you see CORS errors, use a server-side proxy or run this file via a local server.';
        }
    }
}

// Auto-bootstrap after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.bootstrap();

    // Header menu wiring (delegated, accessible)
    const menu = document.getElementById('headerMenu');
    const btn = document.getElementById('headerMenuBtn');
    /** @type {any} */ let outsideHandler = null;
    /** @type {any} */ let escHandler = null;

    function openHeaderMenu() {
        if (!menu) return;
        menu.classList.remove('hidden');
        if (!outsideHandler) {
            outsideHandler = (e) => {
                if (!(e.target instanceof Node)) return;
                const clickedBtn = btn && (e.target === btn || (btn.contains && btn.contains(e.target)));
                const clickedMenu = menu && (e.target === menu || (menu.contains && menu.contains(e.target)));
                if (!clickedBtn && !clickedMenu) closeHeaderMenu();
            };
            document.addEventListener('click', outsideHandler, {capture: true});
        }
        if (!escHandler) {
            escHandler = (e) => {
                if (e.key === 'Escape') closeHeaderMenu();
            };
            document.addEventListener('keydown', escHandler);
        }
    }

    function closeHeaderMenu() {
        if (menu) menu.classList.add('hidden');
        if (outsideHandler) {
            document.removeEventListener('click', outsideHandler, {capture: true});
            outsideHandler = null;
        }
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
            escHandler = null;
        }
        if (btn && typeof btn.focus === 'function') btn.focus();
    }

    function toggleHeaderMenu() {
        if (!menu) return;
        if (menu.classList.contains('hidden')) openHeaderMenu(); else closeHeaderMenu();
    }

    btn?.addEventListener('click', toggleHeaderMenu);

    // Bind LLM Settings menu item (ESM controller)
    const menuLlm = document.getElementById('menuLlmSettings');
    menuLlm?.addEventListener('click', () => {
        try {
            app.llm?.settings.open();
        } catch {
            // ignore exception
        }
        closeHeaderMenu();
    });
});

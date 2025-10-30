// FileAndEventService.js - Analyze URL, parse pasted JSON, handle file input, and clear
// @ts-check

import {StartupDataProcessor} from '../data/StartupDataProcessor.js';
import {TimelineRenderer} from '../ui/TimelineRenderer.js';
import {StartupStepUtils} from '../Utils.js';

export class FileAndEventService {
    /**
     * @param {import('../state/AppStateStore.js').AppStateStore} state
     * @param {{ apply: (f: 'all'|'slow'|'critical') => void }} filterManager
     */
    constructor(state, filterManager) {
        this.state = state;
        this.filterManager = filterManager;
    }

    showLoading() {
        this._hide(this.state.elements.emptyState);
        this._show(this.state.elements.loadingState);
        this._hide(this.state.elements.summarySection);
        this._hide(this.state.elements.timelineSection);
    }

    showResults() {
        this._hide(this.state.elements.loadingState);
        this._show(this.state.elements.summarySection);
        this._show(this.state.elements.timelineSection);
    }

    showError(msg) {
        this._hide(this.state.elements.loadingState);
        this._show(this.state.elements.emptyState);
        const empty = this.state.elements.emptyState;
        if (empty) empty.innerHTML = `<h3>Error Loading Data</h3><p>${msg}</p>`;
    }

    showEmpty() {
        this._hide(this.state.elements.loadingState);
        this._hide(this.state.elements.summarySection);
        this._hide(this.state.elements.timelineSection);
        this._show(this.state.elements.emptyState);
        const empty = this.state.elements.emptyState;
        if (empty) empty.innerHTML = `<h3>No Data Available</h3><p>Enter your /actuator/startup endpoint URL and click Load from URL, then click Summarize JSON to view detailed startup metrics</p>`;
    }

    /** Load JSON text from URL into the editor (no processing) */
    async analyzeByUrl() {
        const input = /** @type {HTMLInputElement|null} */ (this.state.elements.endpointUrl);
        const url = input?.value?.trim() || '';
        if (!url) {
            alert('Please enter an endpoint URL');
            return;
        }
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch startup data');
            const text = await res.text();
            const cont = this.state.elements.pasteContainer;
            cont?.classList.remove('hidden');
            const ta = /** @type {HTMLTextAreaElement|null} */ (this.state.elements.pasteJson);
            if (ta) ta.value = text;
            // Do not process automatically; user will click "Summarize JSON" to parse and render
        } catch (e) {
            alert((/** @type {Error} */(e)).message || 'Request failed');
        }
    }

    /** Parse JSON from textarea */
    parsePasted() {
        try {
            const ta = /** @type {HTMLTextAreaElement|null} */ (this.state.elements.pasteJson);
            const text = (ta && ta.value) || '';
            if (!text.trim()) {
                alert('Please paste JSON into the editor or choose a file first.');
                return;
            }
            this.showLoading();
            const data = JSON.parse(text);
            if (!data || typeof data !== 'object') throw new Error('Invalid JSON structure');
            this.state.startupData = data;
            this.processAndDisplay(data);
        } catch (err) {
            this.showError('Invalid JSON. Please provide the exact output of /actuator/startup.');
        }
    }

    /** Handle <input type=file> selection: preview content in textarea */
    handleFileSelected(ev) {
        const input = /** @type {HTMLInputElement} */ (ev.target);
        if (!input || !input.files || input.files.length === 0) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const txt = String(reader.result || '');
            const cont = this.state.elements.pasteContainer;
            cont?.classList.remove('hidden');
            const ta = /** @type {HTMLTextAreaElement|null} */ (this.state.elements.pasteJson);
            if (ta) ta.value = txt;
        };
        reader.onerror = () => alert('Failed to read the selected file.');
        reader.readAsText(file);
    }

    clearAll() {
        this.state.clear();
        this.filterManager.apply('all');
        this.showEmpty();
    }

    /**
     * @param {any} data
     */
    processAndDisplay(data) {
        this.showResults();
        const timeline = data?.timeline || {};
        const events = Array.isArray(timeline?.events) ? timeline.events : [];
        const metrics = StartupDataProcessor.calculateMetrics(events);

        // Update summary
        const el = this.state.elements;
        if (el.totalDuration) el.totalDuration.textContent = StartupStepUtils.formatDuration(metrics.totalDuration);
        if (el.totalSteps) el.totalSteps.textContent = String(metrics.totalSteps);
        if (el.slowSteps) el.slowSteps.textContent = String(metrics.slowSteps);
        if (el.criticalIssues) el.criticalIssues.textContent = String(metrics.criticalIssues);

        // Render timeline
        const container = /** @type {HTMLElement|null} */ (el.timelineContent);
        if (container) TimelineRenderer.render(container, events, metrics.totalDuration, metrics.avgDuration);
    }

    _show(n) {
        if (n) n.classList.remove('hidden');
    }

    _hide(n) {
        if (n) n.classList.add('hidden');
    }
}

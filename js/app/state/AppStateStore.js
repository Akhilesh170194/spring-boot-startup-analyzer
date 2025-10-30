// AppStateStore.js - Central state and DOM references
// @ts-check

export class AppStateStore {
    constructor() {
        /** @type {any} */ this.startupData = null;
        /** @type {Record<string, HTMLElement|null>} */ this.elements = {};
    }

    initDom() {
        this.elements = {
            endpointUrl: document.getElementById('endpointUrl'),
            expandAll: document.getElementById('expandAll'),
            emptyState: document.getElementById('emptyState'),
            loadingState: document.getElementById('loadingState'),
            summarySection: document.getElementById('summarySection'),
            timelineSection: document.getElementById('timelineSection'),
            totalDuration: document.getElementById('totalDuration'),
            totalSteps: document.getElementById('totalSteps'),
            slowSteps: document.getElementById('slowSteps'),
            criticalIssues: document.getElementById('criticalIssues'),
            timelineContent: document.getElementById('timelineContent'),
            jsonFile: document.getElementById('jsonFile'),
            pasteContainer: document.getElementById('pasteContainer'),
            pasteJson: document.getElementById('pasteJson')
        };
    }

    clear() {
        this.startupData = null;
        const el = this.elements;
        const setVal = (k, v) => {
            const n = /** @type {HTMLInputElement|null} */ (el[k]);
            if (n) n.value = String(v);
        };
        setVal('endpointUrl', '');
        setVal('pasteJson', '');
        setVal('jsonFile', '');
        const expand = /** @type {HTMLInputElement|null} */ (el['expandAll']);
        if (expand) expand.checked = false;
        ['totalDuration', 'totalSteps', 'slowSteps', 'criticalIssues'].forEach(k => {
            const n = el[k];
            if (n) n.textContent = (k === 'totalDuration' ? '0s' : '0');
        });
        const t = el.timelineContent;
        if (t) t.innerHTML = '';
    }
}

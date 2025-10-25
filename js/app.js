/**
 * Spring Boot Startup Analyzer
 * Main Application JavaScript
 */

// ============================================
// APPLICATION STATE
// ============================================
const AppState = {
    startupData: null,
    elements: {},
    allSteps: [],

    init() {
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

        this.bindEvents();
    },

    bindEvents() {
        this.elements.expandAll.addEventListener('change', UIManager.handleExpandAllChange);
        if (this.elements.jsonFile) {
            this.elements.jsonFile.addEventListener('change', FileAndPasteManager.handleFileSelected);
        }
    }
};

// ============================================
// STEP UTILITIES
// ============================================
const StepUtils = {
    descriptions: {
        'spring.boot.application.starting': 'The Spring Boot application is starting. This includes initial launch code.',
        'spring.boot.application.environment-prepared': 'The application environment is prepared. Configuration from application.properties, environment variables, etc. is loaded.',
        'spring.boot.application.context-prepared': 'The application context (Spring container) is created but not yet loaded with beans.',
        'spring.boot.application.context-loaded': 'The application context is loaded. All beans and configuration classes are registered.',
        'spring.boot.application.started': 'The context has been refreshed and startup sequence completed.',
        'spring.boot.application.ready': 'Spring application is fully started and ready for requests. Application runners execute now.',
        'spring.beans.instantiate': 'Creating an individual Bean instance as part of dependency injection.',
        'spring.beans.smart-initialize': 'Running special initialization for beans with SmartInitializingSingleton interface.',
        'spring.beans.post-process': 'Running BeanPostProcessors to customize beans after initialization.',
        'spring.context.base-packages.scan': 'Scanning packages for annotated components (@Component, @Service, etc.).',
        'spring.context.refresh': 'The ApplicationContext is fully initialized and refreshed.',
        'spring.boot.web-application-type-detect': 'Detecting application type (servlet, reactive, or non-web).',
        'spring.boot.web.server.start': 'Starting embedded web server (Tomcat, Jetty, etc.).'
    },

    getDescription(stepName) {
        return this.descriptions[stepName] || 'Internal Spring Boot startup phase.';
    },

    parseDuration(durationStr) {
        if (!durationStr) return 0;
        if (typeof durationStr === 'number') return durationStr;

        const match = durationStr.match(/PT([\d.]+)S/);
        if (match) {
            return parseFloat(match[1]) * 1000;
        }
        return 0;
    },

    formatDuration(ms) {
        if (ms < 1000) return ms.toFixed(0) + 'ms';
        return (ms / 1000).toFixed(2) + 's';
    },

    getSeverity(duration, avgDuration) {
        if (duration > avgDuration * 3) return 'critical';
        if (duration > avgDuration * 2) return 'slow';
        if (duration > 1000) return 'normal';
        return 'fast';
    },

    getSeverityColor(severity) {
        const colors = {
            fast: 'var(--color-success)',
            normal: 'var(--color-primary)',
            slow: 'var(--color-warning)',
            critical: 'var(--color-danger)'
        };
        return colors[severity] || 'var(--color-primary)';
    }
};

// ============================================
// UI MANAGEMENT
// ============================================
const UIManager = {
    handleExpandAllChange(event) {
        const items = document.querySelectorAll('.timeline-item');
        items.forEach(item => {
            if (event.target.checked) {
                item.classList.add('expanded');
            } else {
                item.classList.remove('expanded');
            }
        });
    },

    showLoading() {
        AppState.elements.emptyState.classList.add('hidden');
        AppState.elements.loadingState.classList.remove('hidden');
        AppState.elements.summarySection.classList.add('hidden');
        AppState.elements.timelineSection.classList.add('hidden');
    },

    showResults() {
        AppState.elements.loadingState.classList.add('hidden');
        AppState.elements.summarySection.classList.remove('hidden');
        AppState.elements.timelineSection.classList.remove('hidden');
    },

    showError(message) {
        AppState.elements.loadingState.classList.add('hidden');
        AppState.elements.emptyState.classList.remove('hidden');
        AppState.elements.emptyState.innerHTML = `
            <h3>Error Loading Data</h3>
            <p>${message}</p>
        `;
    }
};

// ============================================
// FILTER MANAGEMENT
// ============================================
const FilterManager = {
    currentFilter: 'all',

    applyFilter(filterValue) {
        this.currentFilter = filterValue;
        const items = document.querySelectorAll('.timeline-item');

        items.forEach(item => {
            const isCritical = item.querySelector('.badge[data-severity="critical"]') !== null;
            const isSlow = item.querySelector('.badge[data-severity="slow"]') !== null;

            let shouldShow = false;

            switch(filterValue) {
                case 'all':
                    shouldShow = true;
                    break;
                case 'critical':
                    shouldShow = isCritical;
                    break;
                case 'slow':
                    shouldShow = isSlow;
                    break;
            }

            // Use CSS visibility class instead of inline styles for consistency
            if (shouldShow) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });

        // Update active state on cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.remove('active');
        });
        const activeCard = document.querySelector(`.stat-card[data-filter="${filterValue}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
    }
};

// ============================================
// DATA PROCESSING
// ============================================
const DataProcessor = {
    calculateMetrics(events) {
        let totalDuration = 0;
        if (events.length > 0) {
            const firstStart = new Date(events[0].startTime).getTime();
            const lastEnd = new Date(events[events.length - 1].endTime).getTime();
            totalDuration = lastEnd - firstStart;
        }

        const totalSteps = events.length;
        let slowSteps = 0;
        let criticalIssues = 0;

        let totalMs = 0;
        const durations = events.map(e => {
            const ms = StepUtils.parseDuration(e.duration);
            totalMs += ms;
            return ms;
        });
        const avgDuration = totalMs / totalSteps;

        events.forEach((event, idx) => {
            const duration = durations[idx];
            if (duration > avgDuration * 2) slowSteps++;
            if (duration > avgDuration * 3) criticalIssues++;
        });

        return {
            totalDuration,
            totalSteps,
            slowSteps,
            criticalIssues,
            avgDuration
        };
    },

    updateSummary(metrics) {
        AppState.elements.totalDuration.textContent = StepUtils.formatDuration(metrics.totalDuration);
        AppState.elements.totalSteps.textContent = metrics.totalSteps;
        AppState.elements.slowSteps.textContent = metrics.slowSteps;
        AppState.elements.criticalIssues.textContent = metrics.criticalIssues;
    }
};

// ============================================
// TIMELINE RENDERING
// ============================================
const TimelineRenderer = {
    render(events, totalDuration, avgDuration) {
        const container = AppState.elements.timelineContent;
        container.innerHTML = '';

        // Build helper structures once
        const parentMap = this.buildParentMap(events);
        const rootEvents = this.getRootEvents(events);

        // Batch DOM operations to minimize reflows
        const frag = document.createDocumentFragment();
        rootEvents.forEach((event, index) => {
            this.renderEvent(event, index, totalDuration, avgDuration, 0, parentMap, frag);
        });
        container.appendChild(frag);
    },

    buildParentMap(events) {
        const parentMap = {};
        events.forEach(event => {
            const parentId = event.startupStep?.parentId;
            if (parentId !== undefined) {
                if (!parentMap[parentId]) parentMap[parentId] = [];
                parentMap[parentId].push(event);
            }
        });
        return parentMap;
    },

    getRootEvents(events) {
        // Optimize by avoiding O(n^2) scanning; build a set of all IDs
        const idSet = new Set();
        events.forEach(e => {
            const id = e.startupStep?.id;
            if (id !== undefined && id !== null) idSet.add(id);
        });
        return events.filter(e => {
            const pid = e.startupStep?.parentId;
            return pid === undefined || pid === null || !idSet.has(pid);
        });
    },

    renderEvent(event, index, totalDuration, avgDuration, level, parentMap, parentContainer) {
        const duration = StepUtils.parseDuration(event.duration);
        const severity = StepUtils.getSeverity(duration, avgDuration);
        const badge = this.createSeverityBadge(severity);

        const step = event.startupStep || {};
        const children = parentMap[step.id] || [];
        const hasChildren = children.length > 0;

        const item = this.createTimelineItem(event, step, duration, severity, badge, hasChildren, level, totalDuration);
        parentContainer.appendChild(item);

        if (hasChildren) {
            this.handleParentItem(item, children, index, totalDuration, avgDuration, level, parentMap, parentContainer);
        } else {
            this.handleLeafItem(item);
        }
    },

    createSeverityBadge(severity) {
        const badges = {
            critical: '<span class="badge badge-danger" data-severity="critical">CRITICAL</span>',
            slow: '<span class="badge badge-warning" data-severity="slow">SLOW</span>'
        };
        return badges[severity] || '';
    },

    createTimelineItem(event, step, duration, severity, badge, hasChildren, level, totalDuration) {
        const percentage = (duration / totalDuration) * 100;
        const tags = this.formatTags(step.tags || {});
        const stepDesc = StepUtils.getDescription(step.name);

        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.style.marginLeft = (level * 20) + 'px';

        item.innerHTML = `
            <div class="timeline-bar ${severity}"></div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <div class="timeline-name">
                        ${hasChildren ? '<span class="collapse-icon">▶</span>' : ''}
                        ${severity === 'critical' ? '<span class="issue-icon critical"></span>' : ''}
                        ${severity === 'slow' ? '<span class="issue-icon warning"></span>' : ''}
                        <span>${step.name || 'Step ' + (step.id !== undefined ? step.id : 'N/A')}</span>
                        ${badge}
                        <span class="timeline-duration" style="margin-left: 10px;">${StepUtils.formatDuration(duration)}</span>
                    </div>
                    <div class="expand-toggle">Details ▼</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${severity}" style="width: ${Math.min(percentage * 2, 100)}%; background: ${StepUtils.getSeverityColor(severity)}"></div>
                </div>
                <div class="timeline-details">
                    <strong>Description:</strong><br>
                    <div class="timeline-desc">${stepDesc}</div>
                    <strong>Details:</strong><br>
                    Step ID: ${step.id !== undefined ? step.id : 'N/A'}<br>
                    ${step.parentId !== undefined ? `Parent ID: ${step.parentId}<br>` : ''}
                    Start Time: ${event.startTime ? new Date(event.startTime).toLocaleTimeString() : 'N/A'}<br>
                    End Time: ${event.endTime ? new Date(event.endTime).toLocaleTimeString() : 'N/A'}<br>
                    ${tags ? `<br><strong>Tags:</strong><br>${tags}` : ''}
                    ${this.getSeverityWarning(severity)}
                </div>
            </div>
        `;

        return item;
    },

    formatTags(tags) {
        return Object.entries(tags)
            .map(([k,v]) => `<span class="tag">${k}: ${v}</span>`)
            .join(' ');
    },

    getSeverityWarning(severity) {
        const warnings = {
            critical: '<br><br><strong style="color: var(--color-danger);">⚠ This step took significantly longer than average and may need optimization</strong>',
            slow: '<br><br><strong style="color: var(--color-warning);">⚠ This step is slower than expected</strong>'
        };
        return warnings[severity] || '';
    },

    handleParentItem(item, children, index, totalDuration, avgDuration, level, parentMap, parentContainer) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'timeline-children';

        children.forEach((child, idx) => {
            this.renderEvent(child, idx, totalDuration, avgDuration, level + 1, parentMap, childrenContainer);
        });

        parentContainer.appendChild(childrenContainer);
        this.addParentClickHandlers(item, childrenContainer);
    },

    handleLeafItem(item) {
        item.addEventListener('click', function(e) {
            item.classList.toggle('expanded');
        });
    },

    addParentClickHandlers(item, childrenContainer) {
        let clickTimer = null;
        item.addEventListener('click', function(e) {
            if (clickTimer === null) {
                clickTimer = setTimeout(() => {
                    // Single click - toggle details
                    item.classList.toggle('expanded');
                    clickTimer = null;
                }, 250);
            } else {
                // Double click - toggle children
                clearTimeout(clickTimer);
                clickTimer = null;
                const isExpanded = childrenContainer.classList.contains('show');
                const collapseIcon = item.querySelector('.collapse-icon');
                if (collapseIcon) {
                    collapseIcon.style.transform = isExpanded ? '' : 'rotate(90deg)';
                }
                childrenContainer.classList.toggle('show');
            }
        });
    }
};

// ============================================
// FILE AND PASTE MANAGEMENT (unified editor)
// ============================================
const FileAndPasteManager = {
    handleFileSelected(event) {
        const fileInput = event.target;
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = reader.result || '';
                // Show editor and populate with file content (preview/edit before loading)
                if (AppState.elements.pasteContainer) {
                    AppState.elements.pasteContainer.classList.remove('hidden');
                }
                if (AppState.elements.pasteJson) {
                    AppState.elements.pasteJson.value = text;
                }
                // Do not auto-parse; user confirms via Load JSON button
            } catch (err) {
                console.error('[handleFileSelected] Failed to read file', err);
                alert('Failed to read the selected file.');
            }
        };
        reader.onerror = () => {
            alert('Failed to read the selected file.');
        };
        reader.readAsText(file);
    }
};

function parsePastedJson() {
    try {
        const text = (AppState.elements.pasteJson && AppState.elements.pasteJson.value) || '';
        if (!text.trim()) {
            alert('Please paste JSON into the editor or choose a file first.');
            return;
        }
        // Show loading for consistency
        UIManager.showLoading();
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') throw new Error('Invalid JSON structure');
        AppState.startupData = data;
        processAndDisplay(data);
    } catch (err) {
        console.error('[parsePastedJson] Invalid JSON', err);
        UIManager.showError('Invalid JSON. Please provide the exact output of /actuator/startup.');
    }
}

// ============================================
// MAIN FUNCTIONS
// ============================================
async function analyzeStartup() {
    const url = AppState.elements.endpointUrl.value;

    if (!url) {
        alert('Please enter an endpoint URL');
        return;
    }

    UIManager.showLoading();

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch startup data');

        const data = await response.json();
        AppState.startupData = data;
        processAndDisplay(data);
    } catch (error) {
        UIManager.showError(error.message);
    }
}

function processAndDisplay(data) {
    UIManager.showResults();

    const timeline = data.timeline || {};
    const events = timeline.events || [];

    const metrics = DataProcessor.calculateMetrics(events);
    DataProcessor.updateSummary(metrics);
    TimelineRenderer.render(events, metrics.totalDuration, metrics.avgDuration);
}


function filterByCard(filterType) {
    FilterManager.applyFilter(filterType);
}

// ============================================
// CLEAR / RESET ALL
// ============================================
function clearAll() {
    // Reset data
    AppState.startupData = null;

    // Reset inputs
    if (AppState.elements.endpointUrl) AppState.elements.endpointUrl.value = '';
    if (AppState.elements.pasteJson) AppState.elements.pasteJson.value = '';
    if (AppState.elements.jsonFile) AppState.elements.jsonFile.value = '';
    if (AppState.elements.expandAll) AppState.elements.expandAll.checked = false;

    // Reset filter to all
    FilterManager.applyFilter('all');

    // Reset metrics display
    if (AppState.elements.totalDuration) AppState.elements.totalDuration.textContent = '0s';
    if (AppState.elements.totalSteps) AppState.elements.totalSteps.textContent = '0';
    if (AppState.elements.slowSteps) AppState.elements.slowSteps.textContent = '0';
    if (AppState.elements.criticalIssues) AppState.elements.criticalIssues.textContent = '0';

    // Clear timeline content
    if (AppState.elements.timelineContent) AppState.elements.timelineContent.innerHTML = '';

    // Hide result sections and loading, show empty state
    if (AppState.elements.loadingState) AppState.elements.loadingState.classList.add('hidden');
    if (AppState.elements.summarySection) AppState.elements.summarySection.classList.add('hidden');
    if (AppState.elements.timelineSection) AppState.elements.timelineSection.classList.add('hidden');

    if (AppState.elements.emptyState) {
        AppState.elements.emptyState.classList.remove('hidden');
        AppState.elements.emptyState.innerHTML = `
            <h3>No Data Available</h3>
            <p>Enter your /actuator/startup endpoint URL and click Analyze to view detailed startup metrics</p>
        `;
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const btn = document.querySelector('.theme-toggle');
    btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);

    const btn = document.querySelector('.theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
    initTheme();
});

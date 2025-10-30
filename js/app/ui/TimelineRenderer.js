// TimelineRenderer.js - Rendering of the startup timeline
// @ts-check

import {StartupStepUtils} from '../Utils.js';

export class TimelineRenderer {
    /**
     * Render the timeline into the container referenced by state.elements.timelineContent
     * @param {HTMLElement} container
     * @param {Array<any>} events
     * @param {number} totalDuration
     * @param {number} avgDuration
     */
    static render(container, events, totalDuration, avgDuration) {
        if (!container) return;
        container.innerHTML = '';
        const parentMap = this.buildParentMap(events);
        const roots = this.getRootEvents(events);
        const frag = document.createDocumentFragment();
        roots.forEach((e, i) => this.renderEvent(e, i, totalDuration, avgDuration, 0, parentMap, frag));
        container.appendChild(frag);
    }

    /** @param {Array<any>} events */
    static buildParentMap(events) {
        const map = /** @type {Record<string, any[]>} */ ({});
        (events || []).forEach(ev => {
            const pid = ev?.startupStep?.parentId;
            if (pid !== undefined && pid !== null) {
                if (!map[pid]) map[pid] = [];
                map[pid].push(ev);
            }
        });
        return map;
    }

    /** @param {Array<any>} events */
    static getRootEvents(events) {
        const set = new Set();
        (events || []).forEach(e => {
            const id = e?.startupStep?.id;
            if (id !== undefined && id !== null) set.add(id);
        });
        return (events || []).filter(e => {
            const pid = e?.startupStep?.parentId;
            return pid === undefined || pid === null || !set.has(pid);
        });
    }

    static renderEvent(event, index, totalDuration, avgDuration, level, parentMap, parentContainer) {
        const duration = StartupStepUtils.parseDuration(event?.duration);
        const severity = StartupStepUtils.getSeverity(duration, avgDuration);
        const step = event?.startupStep || {};
        const children = parentMap[step.id] || [];
        const hasChildren = children.length > 0;

        const item = this.createTimelineItem(event, step, duration, severity, hasChildren, level, totalDuration);
        parentContainer.appendChild(item);

        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'timeline-children';
            children.forEach((child, idx) => {
                this.renderEvent(child, idx, totalDuration, avgDuration, level + 1, parentMap, childrenContainer);
            });
            parentContainer.appendChild(childrenContainer);
        }
    }

    static createTimelineItem(event, step, duration, severity, hasChildren, level, totalDuration) {
        const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
        const tags = this.formatTags(step?.tags || {});
        const stepDesc = StartupStepUtils.getDescription(step?.name);

        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.style.marginLeft = (level * 20) + 'px';
        item.setAttribute('data-has-children', String(hasChildren));

        const caret = hasChildren ? '<span class="collapse-icon">▶</span>' : '';
        const issueCritical = severity === 'critical' ? '<span class="issue-icon critical"></span>' : '';
        const issueSlow = severity === 'slow' ? '<span class="issue-icon warning"></span>' : '';
        const badge = severity === 'critical' ? '<span class="badge badge-danger" data-severity="critical">CRITICAL</span>'
            : severity === 'slow' ? '<span class="badge badge-warning" data-severity="slow">SLOW</span>'
                : '';

        item.innerHTML = `
      <div class="timeline-bar ${severity}"></div>
      <div class="timeline-content">
        <div class="timeline-header">
          <div class="timeline-name">
            ${caret}
            ${issueCritical}
            ${issueSlow}
            <span>${step?.name || ('Step ' + (step?.id ?? 'N/A'))}</span>
            ${badge}
            <span class="timeline-duration" style="margin-left: 10px;">${StartupStepUtils.formatDuration(duration)}</span>
          </div>
          <div class="expand-toggle">Details ▼</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${severity}" style="width: ${Math.min(percentage * 2, 100)}%; background: ${StartupStepUtils.getSeverityColor(severity)}"></div>
        </div>
        <div class="timeline-details">
          <strong>Description:</strong><br>
          <div class="timeline-desc">${stepDesc}</div>
          <strong>Details:</strong><br>
          Step ID: ${step?.id ?? 'N/A'}<br>
          ${step?.parentId !== undefined ? `Parent ID: ${step.parentId}<br>` : ''}
          Start Time: ${event?.startTime ? new Date(event.startTime).toLocaleTimeString() : 'N/A'}<br>
          End Time: ${event?.endTime ? new Date(event.endTime).toLocaleTimeString() : 'N/A'}<br>
          ${tags ? `<br><strong>Tags:</strong><br>${tags}` : ''}
          ${this.getSeverityWarning(severity)}
        </div>
      </div>
    `;
        return item;
    }

    static formatTags(tags) {
        return Object.entries(tags).map(([k, v]) => `<span class="tag">${k}: ${v}</span>`).join(' ');
    }

    static getSeverityWarning(severity) {
        if (severity === 'critical') {
            return '<br><br><strong style="color: var(--color-danger);">⚠ This step took significantly longer than average and may need optimization</strong>';
        }
        if (severity === 'slow') {
            return '<br><br><strong style="color: var(--color-warning);">⚠ This step is slower than expected</strong>';
        }
        return '';
    }
}

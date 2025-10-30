// FilterManager.js - Manage filter state and update UI
// @ts-check

export class FilterManager {
    constructor() {
        /** @type {'all'|'slow'|'critical'} */ this.current = 'all';
    }

    /**
     * @param {'all'|'slow'|'critical'} filterValue
     */
    apply(filterValue) {
        this.current = filterValue;
        document.querySelectorAll('.timeline-item').forEach(item => {
            const sev = item.querySelector('.badge[data-severity]');
            const s = sev ? /** @type {HTMLElement} */ (sev).getAttribute('data-severity') : '';
            const hide = (filterValue === 'critical' && s !== 'critical') || (filterValue === 'slow' && s !== 'slow');
            item.classList.toggle('hidden', !!hide && filterValue !== 'all');
        });
        document.querySelectorAll('.stat-card').forEach(card => card.classList.remove('active'));
        const active = document.querySelector(`.stat-card[data-filter="${filterValue}"]`);
        if (active) active.classList.add('active');
    }
}

// Utils.js - Stateless helpers for startup events
// @ts-check

/**
 * StartupStepUtils: parse/format helpers and severity classification.
 */
export const StartupStepUtils = {
    /** @type {Record<string,string>} */
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

    /**
     * @param {string} stepName
     * @returns {string}
     */
    getDescription(stepName) {
        return this.descriptions[stepName] || 'Internal Spring Boot startup phase.';
    },

    /**
     * Accepts ISO-8601 duration like PT0.123S or a number (ms).
     * @param {string|number|undefined|null} duration
     * @returns {number} milliseconds
     */
    parseDuration(duration) {
        if (!duration && duration !== 0) return 0;
        if (typeof duration === 'number') return duration;
        const match = String(duration).match(/PT([\d.]+)S/i);
        return match ? parseFloat(match[1]) * 1000 : 0;
    },

    /**
     * @param {number} ms
     * @returns {string}
     */
    formatDuration(ms) {
        if (ms < 1000) return ms.toFixed(0) + 'ms';
        return (ms / 1000).toFixed(2) + 's';
    },

    /**
     * @param {number} duration
     * @param {number} avgDuration
     * @returns {'fast'|'normal'|'slow'|'critical'}
     */
    getSeverity(duration, avgDuration) {
        if (duration > avgDuration * 3) return 'critical';
        if (duration > avgDuration * 2) return 'slow';
        if (duration > 1000) return 'normal';
        return 'fast';
    },

    /**
     * @param {'fast'|'normal'|'slow'|'critical'} severity
     * @returns {string}
     */
    getSeverityColor(severity) {
        const colors = {
            fast: 'var(--color-success)',
            normal: 'var(--color-primary)',
            slow: 'var(--color-warning)',
            critical: 'var(--color-danger)'
        };
        return colors[severity] || 'var(--color-primary)';
    },
};

// StartupDataProcessor.js - Transform raw /actuator/startup events into metrics
// @ts-check

import {StartupStepUtils} from '../Utils.js';

/**
 * @typedef {Object} Metrics
 * @property {number} totalDuration
 * @property {number} totalSteps
 * @property {number} slowSteps
 * @property {number} criticalIssues
 * @property {number} avgDuration
 */

export class StartupDataProcessor {
    /**
     * @param {Array<any>} events
     * @returns {Metrics}
     */
    static calculateMetrics(events) {
        const list = Array.isArray(events) ? events : [];
        let totalDuration = 0;
        if (list.length > 0) {
            const firstStart = new Date(list[0].startTime).getTime();
            const lastEnd = new Date(list[list.length - 1].endTime).getTime();
            totalDuration = Math.max(0, lastEnd - firstStart);
        }
        const totalSteps = list.length;
        let slowSteps = 0;
        let criticalIssues = 0;
        let totalMs = 0;
        const durations = list.map(e => {
            const ms = StartupStepUtils.parseDuration(e?.duration);
            totalMs += ms;
            return ms;
        });
        const avgDuration = totalMs / Math.max(1, totalSteps);
        list.forEach((_, idx) => {
            const duration = durations[idx];
            if (duration > avgDuration * 2) slowSteps++;
            if (duration > avgDuration * 3) criticalIssues++;
        });
        return {totalDuration, totalSteps, slowSteps, criticalIssues, avgDuration};
    }
}

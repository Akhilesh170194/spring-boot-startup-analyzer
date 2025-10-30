// PromptBuilder.js (ESM) - Builds compact prompts for LLM analysis to reduce rate-limit/token pressure
// @ts-check

function safeStringify(obj) {
    try {
        return JSON.stringify(obj, null, 2);
    } catch {
        return '';
    }
}

function truncateBytes(str, maxBytes) {
    if (!str || !maxBytes || maxBytes <= 0) return '';
    if (new Blob([str]).size <= maxBytes) return str;
    let low = 0, high = str.length, ans = 0;
    while (low <= high) {
        const mid = (low + high) >> 1;
        const size = new Blob([str.slice(0, mid)]).size;
        if (size <= maxBytes) {
            ans = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return str.slice(0, ans) + "\n... [truncated]";
}

function parseDuration(d) {
    if (!d && d !== 0) return 0;
    if (typeof d === 'number') return d;
    const m = String(d).match(/PT([\d.]+)S/i);
    return m ? parseFloat(m[1]) * 1000 : 0;
}

function getTopSteps(data, topN) {
    try {
        const events = Array.isArray(data?.timeline?.events) ? data.timeline.events : [];
        const list = events.map(ev => ({
            id: ev?.startupStep?.id,
            name: ev?.startupStep?.name || ('Step ' + (ev?.startupStep?.id ?? 'N/A')),
            durationMs: parseDuration(ev?.duration)
        }));
        list.sort((a, b) => b.durationMs - a.durationMs);
        return list.slice(0, Math.max(1, topN || 10));
    } catch {
        return [];
    }
}

export function build(data, options) {
    const maxJsonBytes = options && options.maxJsonBytes != null ? options.maxJsonBytes : 100 * 1024; // 100 KB default
    const topN = options && options.topN != null ? options.topN : 10;

    const events = Array.isArray(data?.timeline?.events) ? data.timeline.events : [];
    const firstStart = events[0]?.startTime ? new Date(events[0].startTime).getTime() : 0;
    const lastEnd = events.length ? (events[events.length - 1]?.endTime ? new Date(events[events.length - 1].endTime).getTime() : 0) : 0;
    const totalDuration = Math.max(0, lastEnd - firstStart);

    const durations = events.map(e => parseDuration(e?.duration));
    const totalMs = durations.reduce((a, b) => a + b, 0);
    const avg = events.length ? totalMs / events.length : 0;
    const slowCnt = durations.filter(ms => ms > avg * 2).length;
    const critCnt = durations.filter(ms => ms > avg * 3).length;

    const top = getTopSteps(data, topN);

    const summary = [
        `Total steps: ${events.length}`,
        `Total duration: ${totalDuration} ms`,
        `Average step duration: ${avg.toFixed(2)} ms`,
        `Slow steps (>2x avg): ${slowCnt}`,
        `Critical steps (>3x avg): ${critCnt}`
    ].join('\n');

    const topLines = top.map((t, i) => `${i + 1}. ${t.name} — ${t.durationMs.toFixed(0)} ms`).join('\n');

    const compact = `Summary:\n${summary}\n\nTop ${top.length} slowest/critical steps:\n${topLines}`;

    const jsonFull = safeStringify(data);
    const jsonTrunc = truncateBytes(jsonFull, maxJsonBytes);

    const system = 'You are an expert Spring Boot performance engineer. Provide a concise analysis with'
        + ' a brief summary, the top bottlenecks, and actionable optimization steps.';
    const user = compact + '\n\nTruncated JSON (optional, may omit some details):\n' + jsonTrunc
        + '\n\nReturn only plain text, no markdown tables.';

    return {system, user};
}

// ThemeService.js - Manage dark/light theme
// @ts-check

export class ThemeService {
    init() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        const btn = /** @type {HTMLElement|null} */ (document.getElementById('themeToggleBtn'));
        if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    toggle() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const next = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        const btn = /** @type {HTMLElement|null} */ (document.getElementById('themeToggleBtn'));
        if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
    }
}

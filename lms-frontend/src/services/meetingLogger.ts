const STORAGE_KEY = 'meeting_debug_log';

export const mlog = (level: 'INFO' | 'ERROR' | 'WARN', ...args: any[]) => {
    const ts = new Date().toISOString();
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    const line = `[${ts}] [${level}] ${msg}`;
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](line);
    try {
        const existing = localStorage.getItem(STORAGE_KEY) || '';
        localStorage.setItem(STORAGE_KEY, existing + line + '\n');
    } catch (_) {}
};

export const clearMeetingLog = () => localStorage.removeItem(STORAGE_KEY);

export const downloadMeetingLog = () => {
    const content = localStorage.getItem(STORAGE_KEY) || '(vide)';
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `meeting-debug-${Date.now()}.txt`;
    a.click();
};

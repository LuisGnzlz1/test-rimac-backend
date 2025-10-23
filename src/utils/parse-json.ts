export const parseJson = <T=unknown>(raw?: string|null) => {
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
};
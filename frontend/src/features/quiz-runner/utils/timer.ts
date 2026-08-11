/**
 * Calculates the remaining time in seconds between now and the expiration date.
 * Server-authoritative approach: derived from the absolute deadline.
 */
export function calculateRemainingSeconds(expiresAt: string): number {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Formats seconds into HH:MM:SS or MM:SS
 */
export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [
        m.toString().padStart(2, '0'),
        s.toString().padStart(2, '0')
    ];

    if (h > 0) {
        parts.unshift(h.toString().padStart(2, '0'));
    }

    return parts.join(':');
}

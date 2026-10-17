/** Suppress repeated automatic completion; explicit refresh remains available. */
export class NavigationQueryCache {
  private attempts = new Map<number, { key: string; expires: number }>();

  has(id: number, key: string, now = Date.now()): boolean {
    const entry = this.attempts.get(id);
    return Boolean(entry && entry.key === key && entry.expires > now);
  }

  remember(id: number, key: string, failed = false, now = Date.now()): void {
    this.attempts.delete(id);
    this.attempts.set(id, { key, expires: now + (failed ? 30_000 : 300_000) });
    if (this.attempts.size > 128)
      this.attempts.delete(this.attempts.keys().next().value!);
  }

  clear(): void {
    this.attempts.clear();
  }
}

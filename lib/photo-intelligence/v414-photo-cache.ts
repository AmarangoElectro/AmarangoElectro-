export interface V414CacheEntry<T> {
  readonly fingerprint: string;
  readonly value: T;
  readonly createdAt: string;
  readonly analyzerVersion: string;
  readonly valid: boolean;
}

export class V414PhotoAnalysisCache<T> {
  readonly #entries = new Map<string, V414CacheEntry<T>>();

  get(fingerprint: string, analyzerVersion: string) {
    const entry = this.#entries.get(fingerprint);
    if (!entry?.valid || entry.analyzerVersion !== analyzerVersion) return null;
    return entry;
  }

  set(entry: V414CacheEntry<T>) {
    this.#entries.set(entry.fingerprint, Object.freeze({ ...entry }));
    return this.#entries.get(entry.fingerprint)!;
  }

  invalidate(fingerprint: string) {
    const existing = this.#entries.get(fingerprint);
    if (!existing) return false;
    this.#entries.set(fingerprint, Object.freeze({ ...existing, valid: false }));
    return true;
  }

  get size() {
    return this.#entries.size;
  }
}

export const V414_ANALYZER_VERSION = "v4.14-photo-intelligence-lab-v1";

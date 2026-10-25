/**
 * ApiCacheManager - Un gestionnaire de cache en mémoire haute performance pour le frontend.
 * Permet d'éviter les requêtes HTTP répétitives tout en offrant une invalidation active.
 */
class ApiCacheManager {
  private cache = new Map<string, { data: any; expiry: number }>();
  private defaultTtl: number;

  constructor(defaultTtlSeconds = 120) {
    this.defaultTtl = defaultTtlSeconds * 1000;
  }

  /**
   * Récupère une valeur du cache si elle existe et n'a pas expiré.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Enregistre une valeur dans le cache avec un TTL spécifique.
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTtl;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Invalide sélectivement des entrées du cache correspondant à des motifs de clés.
   * Par exemple, appeler invalidate(['/announcement/for']) effacera tous les caches d'annonces.
   */
  invalidate(patterns: string[]): void {
    if (!patterns || patterns.length === 0) return;

    this.cache.forEach((value, key) => {
      const match = patterns.some(pattern => key.includes(pattern));
      if (match) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Efface l'intégralité du cache (ex. lors d'une déconnexion).
   */
  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new ApiCacheManager(120); // Cache par défaut de 2 minutes

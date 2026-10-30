/** Small, dependency-free helpers for nested content objects (used by the site and the panel). */

export function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Overlay values on a base object, keeping base keys the overlay doesn't set. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base;
    return base.map((b, i) => (i < over.length && over[i] != null ? deepMerge(b, over[i]) : b)).concat(over.slice(base.length)) as T;
  }
  if (isObj(base)) {
    if (!isObj(over)) return base;
    const out: Record<string, unknown> = { ...base };
    for (const k of Object.keys(over)) out[k] = k in base ? deepMerge((base as Record<string, unknown>)[k], over[k]) : over[k];
    return out as T;
  }
  return (typeof over === typeof base && over !== '' ? over : base) as T;
}

export type Leaf = { path: (string | number)[]; value: string };

/** Every string inside an object/array, with its path. */
export function leaves(v: unknown, path: (string | number)[] = []): Leaf[] {
  if (typeof v === 'string') return [{ path, value: v }];
  if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, [...path, i]));
  if (isObj(v)) return Object.entries(v).flatMap(([k, x]) => leaves(x, [...path, k]));
  return [];
}

export function getAt(v: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string | number, unknown>)[k]), v);
}

/** Immutable set, creating objects/arrays along the way. */
export function setAt<T>(v: T, path: (string | number)[], value: unknown): T {
  if (!path.length) return value as T;
  const [k, ...rest] = path;
  const container = (v ?? (typeof k === 'number' ? [] : {})) as Record<string | number, unknown>;
  const copy = (Array.isArray(container) ? [...container] : { ...container }) as Record<string | number, unknown>;
  copy[k] = setAt(copy[k], rest, value);
  return copy as T;
}

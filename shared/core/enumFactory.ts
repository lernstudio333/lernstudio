// ============================================================
// Enum Factory — generic, fully typed, DB-friendly
// ============================================================

export type EnumEntry<K extends string, M extends object> = Readonly<
  M & {
    key: K;
    toString(): K;
    toJSON(): K;
  }
>;

export type Enum<D extends Record<string, object>> = Readonly<
  { [K in keyof D & string]: EnumEntry<K, D[K]> } & {
    values(): ReadonlyArray<EnumEntry<keyof D & string, D[keyof D]>>;
    from(key: string): EnumEntry<keyof D & string, D[keyof D]>;
    [Symbol.iterator](): IterableIterator<EnumEntry<keyof D & string, D[keyof D]>>;
  }
>;

export function createEnum<D extends Record<string, object>>(definition: D): Enum<D> {
  const result = {} as Record<string, unknown>;

  const entries = (Object.entries(definition) as Array<[keyof D & string, object]>)
    .map(([key, data]) =>
      Object.freeze({
        key,
        ...data,
        toString() { return key; },
        toJSON()   { return key; },
      })
    )
    .sort((a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0));

  entries.forEach(entry => { result[(entry as any).key] = entry; });

  Object.defineProperties(result, {
    values:            { value: () => entries },
    from:              { value: (key: string) => result[key] ?? result['NONE'] ?? entries[0] },
    [Symbol.iterator]: { value: function* () { yield* entries; } },
  });

  return Object.freeze(result) as Enum<D>;
}

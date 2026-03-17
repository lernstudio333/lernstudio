import { describe, it, expect } from 'vitest';
import { createEnum } from './enumFactory';

// ── Fixture ───────────────────────────────────────────────────

const Color = createEnum({
  RED:   { order: 2, hex: '#ff0000', primary: true },
  BLUE:  { order: 1, hex: '#0000ff', primary: true },
  GREEN: { order: 3, hex: '#00ff00', primary: true },
  WHITE: { order: 4, hex: '#ffffff', primary: false },
});

// A second fixture with a NONE entry (for .from() fallback tests)
const Status = createEnum({
  NONE:    { order: 0, label: 'None' },
  ACTIVE:  { order: 1, label: 'Active' },
  EXPIRED: { order: 2, label: 'Expired' },
});

// ── Metadata access ───────────────────────────────────────────

describe('metadata access', () => {
  it('exposes metadata fields directly on the entry', () => {
    expect(Color.RED.hex).toBe('#ff0000');
    expect(Color.RED.primary).toBe(true);
    expect(Color.WHITE.primary).toBe(false);
  });

  it('exposes the key field on every entry', () => {
    expect(Color.RED.key).toBe('RED');
    expect(Color.BLUE.key).toBe('BLUE');
  });
});

// ── Serialization ─────────────────────────────────────────────

describe('serialization', () => {
  it('toString() returns the string key', () => {
    expect(String(Color.RED)).toBe('RED');
    expect(`${Color.BLUE}`).toBe('BLUE');
  });

  it('JSON.stringify() outputs the string key, not an object', () => {
    expect(JSON.stringify(Color.RED)).toBe('"RED"');
  });

  it('serializes correctly inside a larger object', () => {
    const payload = { color: Color.GREEN, count: 3 };
    expect(JSON.stringify(payload)).toBe('{"color":"GREEN","count":3}');
  });
});

// ── Ordering ──────────────────────────────────────────────────

describe('ordering', () => {
  it('values() returns entries sorted by order', () => {
    const keys = Color.values().map(e => e.key);
    expect(keys).toEqual(['BLUE', 'RED', 'GREEN', 'WHITE']);
  });

  it('for...of iterates in order', () => {
    const keys: string[] = [];
    for (const entry of Color) keys.push(entry.key);
    expect(keys).toEqual(['BLUE', 'RED', 'GREEN', 'WHITE']);
  });
});

// ── Lookup ────────────────────────────────────────────────────

describe('.from()', () => {
  it('returns the correct entry for a valid key', () => {
    expect(Color.from('RED')).toBe(Color.RED);
    expect(Color.from('WHITE')).toBe(Color.WHITE);
  });

  it('falls back to NONE entry when key is unknown and NONE exists', () => {
    expect(Status.from('UNKNOWN')).toBe(Status.NONE);
  });

  it('falls back to first entry when key is unknown and no NONE exists', () => {
    // Color has no NONE entry; fallback is the first entry (lowest order = BLUE)
    expect(Color.from('UNKNOWN')).toBe(Color.BLUE);
  });

  it('supports round-trip: serialize then deserialize', () => {
    const serialized = JSON.stringify(Color.GREEN);   // → "GREEN"
    const parsed     = JSON.parse(serialized);         // → "GREEN"
    expect(Color.from(parsed)).toBe(Color.GREEN);
  });
});

// ── Reference equality ────────────────────────────────────────

describe('reference equality', () => {
  it('direct access and .from() return the same object reference', () => {
    expect(Color.from('RED') === Color.RED).toBe(true);
  });

  it('two .from() calls with the same key return the same reference', () => {
    expect(Color.from('BLUE') === Color.from('BLUE')).toBe(true);
  });
});

// ── Immutability ──────────────────────────────────────────────

describe('immutability', () => {
  it('entries are frozen — direct mutation is silently ignored in non-strict mode', () => {
    const entry = Color.RED as any;
    const originalHex = entry.hex;
    try { entry.hex = 'mutated'; } catch { /* strict mode throws */ }
    expect(Color.RED.hex).toBe(originalHex);
  });

  it('the enum object itself is frozen — adding new keys is silently ignored', () => {
    const c = Color as any;
    try { c.PURPLE = {}; } catch { /* strict mode throws */ }
    expect((Color as any).PURPLE).toBeUndefined();
  });
});

// ── values() ─────────────────────────────────────────────────

describe('values()', () => {
  it('returns all entries', () => {
    expect(Color.values()).toHaveLength(4);
  });

  it('each entry in values() matches direct key access', () => {
    Color.values().forEach(entry => {
      expect((Color as any)[entry.key]).toBe(entry);
    });
  });
});

import { en } from '../locales/en';
import { tr } from '../locales/tr';

// Collect every leaf key path (e.g. "profile.stats.hairpins") from a nested resource object.
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null
      ? keyPaths(v as Record<string, unknown>, path)
      : [path];
  });
}

describe('i18n resource parity', () => {
  const enKeys = keyPaths(en).sort();
  const trKeys = keyPaths(tr).sort();

  it('English and Turkish expose the exact same key paths', () => {
    expect(trKeys).toEqual(enKeys);
  });

  it('no Turkish value is empty', () => {
    for (const path of trKeys) {
      const value = path
        .split('.')
        .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], tr);
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    }
  });

  it('interpolation placeholders match between locales', () => {
    // road.roadId uses {{id}} — both locales must keep it or the value breaks at runtime.
    expect(en.road.roadId).toContain('{{id}}');
    expect(tr.road.roadId).toContain('{{id}}');
  });
});

import { describe, it, expect } from 'vitest';
import { makeSeed } from '../../src/data/seed.js';
import { statusAt, ageAt, residenceAt, matchBranch } from '../../src/utils/people.js';
import { normalize } from '../../src/lib/storage.js';

describe('historical family data', () => {
  const yosef = makeSeed().people.find(p => p.id === 'yosef');
  it('distinguishes unborn, living and deceased years', () => {
    expect(statusAt(yosef, 1895)).toBe('unborn');
    expect(statusAt(yosef, 1938)).toBe('alive');
    expect(statusAt(yosef, 1972)).toBe('deceased');
    expect(ageAt(yosef, 1895)).toBeNull();
    expect(ageAt(yosef, 2026)).toBe(75);
  });
  it('selects historical residences and retains the final residence after death', () => {
    expect(residenceAt(yosef, 1895)).toBeNull();
    expect(residenceAt(yosef, 1932)).toBe('warsaw');
    expect(residenceAt(yosef, 1938)).toBe('brooklyn');
    expect(residenceAt(yosef, 2026)).toBe('brooklyn');
  });
  it('supports multiple branches and an unfiltered selection', () => {
    expect(matchBranch({ branches: ['a', 'b'] }, ['b'])).toBe(true);
    expect(matchBranch({ branches: ['a'] }, ['b'])).toBe(false);
    expect(matchBranch({ branches: [] }, [])).toBe(true);
  });
  it('preserves empty imported collections and migrates legacy branch assignments', () => {
    const imported = normalize({ people: [{ id: 'p', branch: 'legacy' }], events: [], documents: [], locations: [], branches: [] });
    expect(imported.people[0].branches).toEqual(['legacy']);
    expect(imported.people[0]).not.toHaveProperty('branch');
    expect(imported.events).toEqual([]);
    expect(imported.locations).toEqual([]);
  });
});

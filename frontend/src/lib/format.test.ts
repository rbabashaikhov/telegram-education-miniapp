import { describe, expect, it } from 'vitest';
import { money, personName } from './format';

describe('format', () => {
  it('formats money and names', () => {
    expect(money(7900)).toMatch(/7.900/);
    expect(personName({ firstName: 'София', lastName: 'Смирнова' })).toBe('София Смирнова');
  });
});

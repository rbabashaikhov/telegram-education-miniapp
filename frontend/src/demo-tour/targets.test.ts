import { describe, expect, it } from 'vitest';
import { findTourTarget, tourTargetSelector } from './targets';

describe('tour targets', () => {
  it('builds a data-demo-tour selector', () => {
    expect(tourTargetSelector('program-matching')).toBe('[data-demo-tour="program-matching"]');
  });

  it('returns null without a document', () => {
    expect(findTourTarget('x', null)).toBeNull();
  });
});

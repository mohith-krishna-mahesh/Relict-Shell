import { describe, expect, it } from 'vitest';
import { colors, getEdgeStyle } from './theme';

describe('theme', () => {
  describe('getEdgeStyle', () => {
    it('returns solid opacity 1 for evidence edges', () => {
      expect(getEdgeStyle('evidence')).toEqual({ lineStyle: 'solid', opacity: 1 });
    });

    it('returns dashed line for model_estimated edges', () => {
      expect(getEdgeStyle('model_estimated')).toEqual({ lineStyle: 'dashed', opacity: 0.55 });
    });

    it('returns dashed low-opacity line for unknown confidence', () => {
      expect(getEdgeStyle('unknown')).toEqual({ lineStyle: 'dashed', opacity: 0.25 });
    });
  });

  describe('colors palette tokens', () => {
    it('defines brand colors conforming to the approved palette', () => {
      expect(colors.amber).toBe('#FCBA48');
      expect(colors.amberDeep).toBe('#EE8E28');
      expect(colors.amberPale).toBe('#FFE49E');
      expect(colors.amberRust).toBe('#B25A12');
      expect(colors.ink).toBe('#140D07');
      expect(colors.bgLight).toBe('#FBF6EE');
      expect(colors.bgDark).toBe('#100C08');
    });
  });
});

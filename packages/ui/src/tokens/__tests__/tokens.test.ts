import { describe, it, expect } from 'vitest';
import { colors, typography, spacing, radius, motion } from '../tokens.js';

describe('Design Tokens', () => {
  it('defines light and dark color palettes with all required tokens', () => {
    expect(colors.light.bgCanvas).toBe('#FAF7F2');
    expect(colors.dark.bgCanvas).toBe('#141210');

    // Directional tokens
    expect(colors.light.trendUp).toBe('#B91C1C'); // Brick red
    expect(colors.light.trendDown).toBe('#15803D'); // Leaf green
    expect(colors.light.trendSame).toBe('#57534E'); // Warm stone

    expect(colors.dark.trendUp).toBe('#F87171');
    expect(colors.dark.trendDown).toBe('#4ADE80');
    expect(colors.dark.trendSame).toBe('#D6D3D1');

    // Saffron brand accent
    expect(colors.light.brandPrimary).toBe('#D97706');
    expect(colors.dark.brandPrimary).toBe('#F59E0B');
  });

  it('specifies Bangla-safe typography scale and line height >= 1.6', () => {
    expect(typography.fontHeading).toContain('Anek Bangla');
    expect(typography.fontBody).toContain('Hind Siliguri');
    expect(typography.lineHeight.normal).toBeGreaterThanOrEqual(1.6);
  });

  it('provides comprehensive spacing, radius and motion constants', () => {
    expect(spacing['4']).toBe('1rem');
    expect(radius.md).toBe('10px');
    expect(radius.full).toBe('9999px');
    expect(motion.durationNormal).toBe('250ms');
  });
});

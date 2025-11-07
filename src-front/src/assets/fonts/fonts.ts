/**
 * Font utilities for IranSansX variable font
 */

export const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

export type FontWeight = typeof fontWeights[keyof typeof fontWeights];

/**
 * Get CSS font-weight value for variable font
 */
export function getFontWeight(weight: keyof typeof fontWeights | number): number {
  if (typeof weight === 'number') {
    return weight;
  }
  return fontWeights[weight];
}

/**
 * CSS variable for font family
 */
export const fontFamily = 'var(--font-iransansx)';


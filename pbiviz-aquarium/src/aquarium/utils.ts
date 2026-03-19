/** Shared math and color utilities for the aquarium visual */

/** Linearly interpolate between a and b by factor t (0..1) */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/** Random number between min and max */
export function rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/** Random integer between min and max (inclusive) */
export function randInt(min: number, max: number): number {
    return Math.floor(rand(min, max + 1));
}

/** Parse hex color to RGB components */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
}

/** Create rgba string from hex and alpha */
export function hexToRgba(hex: string, alpha: number): string {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
}

/** Lighten a hex color by a factor (0..1) */
export function lighten(hex: string, factor: number): string {
    const { r, g, b } = hexToRgb(hex);
    const lr = Math.round(r + (255 - r) * factor);
    const lg = Math.round(g + (255 - g) * factor);
    const lb = Math.round(b + (255 - b) * factor);
    return `rgb(${lr},${lg},${lb})`;
}

/** Darken a hex color by a factor (0..1) */
export function darken(hex: string, factor: number): string {
    const { r, g, b } = hexToRgb(hex);
    const dr = Math.round(r * (1 - factor));
    const dg = Math.round(g * (1 - factor));
    const db = Math.round(b * (1 - factor));
    return `rgb(${dr},${dg},${db})`;
}

/** Color palettes for fish */
export const COLOR_PALETTES: Record<string, string[]> = {
    tropical: ["#FF6B35", "#F7C948", "#E84393", "#00B894", "#6C5CE7", "#FD79A8", "#00CEC9", "#E17055"],
    ocean: ["#0984E3", "#74B9FF", "#00CEC9", "#55EFC4", "#6C5CE7", "#A29BFE", "#DFE6E9", "#81ECEC"],
    warm: ["#E17055", "#FDCB6E", "#E84393", "#F39C12", "#D63031", "#FF7675", "#FAB1A0", "#FFEAA7"],
    cool: ["#0984E3", "#74B9FF", "#A29BFE", "#6C5CE7", "#00B894", "#55EFC4", "#81ECEC", "#DFE6E9"],
};

/** Theme color definitions */
export interface ThemeColors {
    waterTop: string;
    waterBottom: string;
    sandLight: string;
    sandDark: string;
    lightRayAlpha: number;
    lightRayCount: number;
    ambientLight: number;
}

export const THEMES: Record<string, ThemeColors> = {
    coralReef: {
        waterTop: "#1a8fc4",
        waterBottom: "#0e4d6e",
        sandLight: "#d4a574",
        sandDark: "#8b6914",
        lightRayAlpha: 0.06,
        lightRayCount: 5,
        ambientLight: 0.15,
    },
    deepOcean: {
        waterTop: "#0a3d5c",
        waterBottom: "#040e18",
        sandLight: "#6b5a3e",
        sandDark: "#3d2e14",
        lightRayAlpha: 0.03,
        lightRayCount: 3,
        ambientLight: 0.05,
    },
    clearWater: {
        waterTop: "#3dc1d3",
        waterBottom: "#1a8fc4",
        sandLight: "#f0d9b5",
        sandDark: "#c4a265",
        lightRayAlpha: 0.09,
        lightRayCount: 6,
        ambientLight: 0.25,
    },
};

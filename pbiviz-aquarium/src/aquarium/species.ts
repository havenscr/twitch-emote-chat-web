/**
 * Fish species drawing functions.
 * Each species is drawn procedurally using Canvas2D paths.
 * All draw functions use a local coordinate system centered at (0,0)
 * with size=1 being the base unit. The caller handles scaling and translation.
 */

import { lighten, darken } from "./utils";

export interface SpeciesDrawOptions {
    ctx: CanvasRenderingContext2D;
    size: number;
    color: string;
    direction: number; // 1 = right, -1 = left
    animPhase: number; // 0..2PI animation cycle
    showOutline: boolean;
}

export type SpeciesDrawFn = (opts: SpeciesDrawOptions) => void;

/** Tropical Fish — oval body, tall dorsal/ventral fins, striped pattern */
function drawTropicalFish(opts: SpeciesDrawOptions): void {
    const { ctx, size, color, direction, animPhase, showOutline } = opts;
    const s = size;
    const tailWag = Math.sin(animPhase * 3) * 0.15;

    ctx.save();
    ctx.scale(direction, 1);

    // Tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, 0);
    ctx.lineTo(-s * 0.75, -s * 0.3 + tailWag * s);
    ctx.lineTo(-s * 0.65, 0);
    ctx.lineTo(-s * 0.75, s * 0.3 + tailWag * s);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.15);
    ctx.fill();

    // Body (oval)
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Belly highlight
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.35, s * 0.15, 0, 0, Math.PI);
    ctx.fillStyle = lighten(color, 0.3);
    ctx.fill();

    // Stripes
    ctx.strokeStyle = lighten(color, 0.4);
    ctx.lineWidth = s * 0.04;
    for (let i = -1; i <= 1; i++) {
        const x = i * s * 0.15;
        ctx.beginPath();
        ctx.moveTo(x, -s * 0.25);
        ctx.lineTo(x, s * 0.25);
        ctx.stroke();
    }

    // Dorsal fin
    const finWave = Math.sin(animPhase * 2) * 0.05 * s;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.28);
    ctx.quadraticCurveTo(s * 0.05, -s * 0.55 + finWave, s * 0.2, -s * 0.25);
    ctx.fillStyle = darken(color, 0.1);
    ctx.fill();

    // Ventral fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, s * 0.28);
    ctx.quadraticCurveTo(s * 0.05, s * 0.45 - finWave, s * 0.15, s * 0.25);
    ctx.fillStyle = darken(color, 0.1);
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.05, s * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.27, -s * 0.05, s * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();

    ctx.restore();
}

/** Clownfish — round body, white band markings */
function drawClownfish(opts: SpeciesDrawOptions): void {
    const { ctx, size, color, direction, animPhase, showOutline } = opts;
    const s = size;
    const tailWag = Math.sin(animPhase * 3) * 0.12;

    ctx.save();
    ctx.scale(direction, 1);

    // Tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, 0);
    ctx.lineTo(-s * 0.6, -s * 0.2 + tailWag * s);
    ctx.lineTo(-s * 0.5, 0);
    ctx.lineTo(-s * 0.6, s * 0.2 + tailWag * s);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.2);
    ctx.fill();

    // Body (rounder)
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.4, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // White bands
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = s * 0.06;
    for (const x of [s * 0.1, -s * 0.15]) {
        ctx.beginPath();
        ctx.moveTo(x, -s * 0.3);
        ctx.lineTo(x, s * 0.3);
        ctx.stroke();
    }

    // Black edge on bands
    ctx.strokeStyle = "#222";
    ctx.lineWidth = s * 0.015;
    for (const x of [s * 0.1, -s * 0.15]) {
        ctx.beginPath();
        ctx.moveTo(x - s * 0.03, -s * 0.28);
        ctx.lineTo(x - s * 0.03, s * 0.28);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + s * 0.03, -s * 0.28);
        ctx.lineTo(x + s * 0.03, s * 0.28);
        ctx.stroke();
    }

    // Small fins
    const finWave = Math.sin(animPhase * 2.5) * 0.03 * s;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.quadraticCurveTo(s * 0.1, -s * 0.42 + finWave, s * 0.2, -s * 0.28);
    ctx.fillStyle = darken(color, 0.1);
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(s * 0.2, -s * 0.05, s * 0.055, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.22, -s * 0.05, s * 0.028, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();

    ctx.restore();
}

/** Angelfish — tall diamond body, elongated fins */
function drawAngelfish(opts: SpeciesDrawOptions): void {
    const { ctx, size, color, direction, animPhase, showOutline } = opts;
    const s = size;
    const tailWag = Math.sin(animPhase * 2.5) * 0.1;

    ctx.save();
    ctx.scale(direction, 1);

    // Tail (small forked)
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.lineTo(-s * 0.5, -s * 0.15 + tailWag * s);
    ctx.lineTo(-s * 0.4, 0);
    ctx.lineTo(-s * 0.5, s * 0.15 + tailWag * s);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.15);
    ctx.fill();

    // Body (diamond-ish, taller than wide)
    ctx.beginPath();
    ctx.moveTo(s * 0.35, 0);
    ctx.quadraticCurveTo(s * 0.1, -s * 0.35, -s * 0.15, -s * 0.15);
    ctx.lineTo(-s * 0.3, 0);
    ctx.lineTo(-s * 0.15, s * 0.15);
    ctx.quadraticCurveTo(s * 0.1, s * 0.35, s * 0.35, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Long dorsal fin
    const finWave = Math.sin(animPhase * 1.8) * 0.06 * s;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.2);
    ctx.quadraticCurveTo(0, -s * 0.65 + finWave, s * 0.15, -s * 0.3);
    ctx.lineTo(s * 0.1, -s * 0.2);
    ctx.fillStyle = lighten(color, 0.15);
    ctx.fill();

    // Long anal fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, s * 0.2);
    ctx.quadraticCurveTo(0, s * 0.6 - finWave, s * 0.15, s * 0.3);
    ctx.lineTo(s * 0.1, s * 0.2);
    ctx.fillStyle = lighten(color, 0.15);
    ctx.fill();

    // Gradient stripes
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = lighten(color, 0.5);
    ctx.lineWidth = s * 0.03;
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.08, -s * 0.25);
        ctx.lineTo(i * s * 0.08, s * 0.25);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Eye
    ctx.beginPath();
    ctx.arc(s * 0.18, -s * 0.03, s * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.2, -s * 0.03, s * 0.022, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();

    ctx.restore();
}

/** Pufferfish — nearly circular, small fins, dotted pattern */
function drawPufferfish(opts: SpeciesDrawOptions): void {
    const { ctx, size, color, direction, animPhase, showOutline } = opts;
    const s = size;
    const puff = 1 + Math.sin(animPhase * 1.5) * 0.05;

    ctx.save();
    ctx.scale(direction, 1);

    // Small tail
    const tailWag = Math.sin(animPhase * 3) * 0.08;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.lineTo(-s * 0.5, -s * 0.12 + tailWag * s);
    ctx.lineTo(-s * 0.42, 0);
    ctx.lineTo(-s * 0.5, s * 0.12 + tailWag * s);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.15);
    ctx.fill();

    // Round body
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.35 * puff, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Lighter belly
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.25 * puff, s * 0.18 * puff, 0, 0, Math.PI);
    ctx.fillStyle = lighten(color, 0.35);
    ctx.fill();

    // Dots/speckles
    ctx.fillStyle = darken(color, 0.2);
    const dotCount = 8;
    for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * Math.PI * 2 + animPhase * 0.1;
        const r = s * 0.2;
        const dx = Math.cos(angle) * r;
        const dy = Math.sin(angle) * r * 0.8;
        ctx.beginPath();
        ctx.arc(dx, dy, s * 0.025, 0, Math.PI * 2);
        ctx.fill();
    }

    // Tiny pectoral fin
    const finAngle = Math.sin(animPhase * 4) * 0.2;
    ctx.save();
    ctx.translate(s * 0.15, s * 0.15);
    ctx.rotate(finAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.08, s * 0.04, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = darken(color, 0.1);
    ctx.fill();
    ctx.restore();

    // Eye (bigger for pufferfish)
    ctx.beginPath();
    ctx.arc(s * 0.15, -s * 0.08, s * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.17, -s * 0.08, s * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
    // Eye highlight
    ctx.beginPath();
    ctx.arc(s * 0.14, -s * 0.1, s * 0.015, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    ctx.restore();
}

/** Seahorse — unique curved body, snout, curled tail */
function drawSeahorse(opts: SpeciesDrawOptions): void {
    const { ctx, size, color, direction, animPhase, showOutline } = opts;
    const s = size;
    const sway = Math.sin(animPhase * 2) * 0.05 * s;

    ctx.save();
    ctx.scale(direction, 1);

    // Body - series of curves forming seahorse shape
    ctx.beginPath();
    // Head/snout
    ctx.moveTo(s * 0.2, -s * 0.3);
    ctx.quadraticCurveTo(s * 0.35, -s * 0.35, s * 0.38, -s * 0.25);
    // Back of head to body
    ctx.quadraticCurveTo(s * 0.3, -s * 0.15, s * 0.2, -s * 0.05);
    // Body curve (belly)
    ctx.quadraticCurveTo(s * 0.25, s * 0.15, s * 0.15, s * 0.25);
    // Curled tail
    ctx.quadraticCurveTo(s * 0.05, s * 0.4 + sway, -s * 0.1, s * 0.35 + sway);
    ctx.quadraticCurveTo(-s * 0.15, s * 0.25 + sway, -s * 0.05, s * 0.2);
    // Back up the back
    ctx.quadraticCurveTo(-s * 0.1, s * 0.05, -s * 0.05, -s * 0.1);
    ctx.quadraticCurveTo(0, -s * 0.25, s * 0.1, -s * 0.35);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Belly ridges
    ctx.strokeStyle = lighten(color, 0.25);
    ctx.lineWidth = s * 0.02;
    for (let i = 0; i < 5; i++) {
        const y = -s * 0.1 + i * s * 0.07;
        ctx.beginPath();
        ctx.moveTo(s * 0.0, y);
        ctx.lineTo(s * 0.15, y);
        ctx.stroke();
    }

    // Crown/crest on head
    const crownWave = Math.sin(animPhase * 2) * 0.02 * s;
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.35);
    ctx.lineTo(s * 0.0, -s * 0.5 + crownWave);
    ctx.lineTo(s * 0.1, -s * 0.42 + crownWave);
    ctx.lineTo(s * 0.08, -s * 0.52 + crownWave);
    ctx.lineTo(s * 0.18, -s * 0.38);
    ctx.fillStyle = darken(color, 0.1);
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(s * 0.22, -s * 0.25, s * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.24, -s * 0.25, s * 0.02, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();

    // Small dorsal fin
    const finWave = Math.sin(animPhase * 3) * 0.03 * s;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.05);
    ctx.quadraticCurveTo(-s * 0.15, -s * 0.1 + finWave, -s * 0.05, s * 0.05);
    ctx.fillStyle = lighten(color, 0.2);
    ctx.fill();

    ctx.restore();
}

/** Swordfish — sleek elongated body, pointed bill, crescent tail */
function drawSwordfish(opts: SpeciesDrawOptions): void {
    const { ctx, size, color, direction, animPhase, showOutline } = opts;
    const s = size;
    const tailWag = Math.sin(animPhase * 3.5) * 0.12;

    ctx.save();
    ctx.scale(direction, 1);

    // Crescent tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, 0);
    ctx.quadraticCurveTo(-s * 0.6, -s * 0.05, -s * 0.75, -s * 0.3 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.1, -s * 0.5, 0);
    ctx.quadraticCurveTo(-s * 0.55, s * 0.1, -s * 0.75, s * 0.3 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.6, s * 0.05, -s * 0.45, 0);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.2);
    ctx.fill();

    // Sleek body
    ctx.beginPath();
    ctx.moveTo(s * 0.4, 0); // nose
    ctx.quadraticCurveTo(s * 0.2, -s * 0.18, -s * 0.1, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.35, -s * 0.15, -s * 0.45, 0);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.15, -s * 0.1, s * 0.2);
    ctx.quadraticCurveTo(s * 0.2, s * 0.18, s * 0.4, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Sword/bill
    ctx.beginPath();
    ctx.moveTo(s * 0.4, 0);
    ctx.lineTo(s * 0.7, -s * 0.02);
    ctx.lineTo(s * 0.7, s * 0.02);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.3);
    ctx.fill();

    // Belly gradient
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.3, s * 0.1, 0, 0, Math.PI);
    ctx.fillStyle = lighten(color, 0.3);
    ctx.fill();

    // Dorsal fin (tall, swept back)
    const finWave = Math.sin(animPhase * 2) * 0.04 * s;
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.18);
    ctx.quadraticCurveTo(-s * 0.05, -s * 0.45 + finWave, -s * 0.2, -s * 0.22);
    ctx.lineTo(-s * 0.05, -s * 0.18);
    ctx.fillStyle = darken(color, 0.05);
    ctx.fill();

    // Pectoral fin
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.05);
    ctx.quadraticCurveTo(s * 0.15, s * 0.2, s * 0.0, s * 0.18);
    ctx.lineTo(s * 0.05, s * 0.08);
    ctx.fillStyle = darken(color, 0.1);
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.04, s * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.27, -s * 0.04, s * 0.02, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();

    ctx.restore();
}

/** All available species drawing functions */
export const SPECIES: SpeciesDrawFn[] = [
    drawTropicalFish,
    drawClownfish,
    drawAngelfish,
    drawPufferfish,
    drawSeahorse,
    drawSwordfish,
];

export const SPECIES_NAMES: string[] = [
    "Tropical Fish",
    "Clownfish",
    "Angelfish",
    "Pufferfish",
    "Seahorse",
    "Swordfish",
];

/**
 * Fish species drawing functions — beautiful, detailed procedural fish
 * with gradient fills, specular highlights, smooth fins, and animated details.
 */

import { lighten, darken, hexToRgba } from "./utils";

export interface SpeciesDrawOptions {
    ctx: CanvasRenderingContext2D;
    size: number;
    color: string;
    direction: number;
    animPhase: number;
    showOutline: boolean;
}

export type SpeciesDrawFn = (opts: SpeciesDrawOptions) => void;

/** Helper: create a body gradient for a fish */
function bodyGradient(ctx: CanvasRenderingContext2D, color: string, x: number, yTop: number, yBot: number): CanvasGradient {
    const grad = ctx.createLinearGradient(0, yTop, 0, yBot);
    grad.addColorStop(0, lighten(color, 0.15));
    grad.addColorStop(0.35, color);
    grad.addColorStop(0.7, darken(color, 0.08));
    grad.addColorStop(1, lighten(color, 0.25));
    return grad;
}

/** Helper: draw a fish eye with detailed iris and specular highlight */
function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, lookDir: number): void {
    const r = size;
    // Eye white with subtle gradient
    const eyeGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    eyeGrad.addColorStop(0, "#ffffff");
    eyeGrad.addColorStop(0.7, "#f0f0f0");
    eyeGrad.addColorStop(1, "#ddd");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = eyeGrad;
    ctx.fill();

    // Iris
    const irisX = x + lookDir * r * 0.15;
    const irisR = r * 0.6;
    const irisGrad = ctx.createRadialGradient(irisX, y, 0, irisX, y, irisR);
    irisGrad.addColorStop(0, "#222");
    irisGrad.addColorStop(0.6, "#111");
    irisGrad.addColorStop(1, "#333");
    ctx.beginPath();
    ctx.arc(irisX, y, irisR, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();

    // Secondary smaller highlight
    ctx.beginPath();
    ctx.arc(x + r * 0.15, y + r * 0.1, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fill();
}

/** Helper: draw underwater shadow beneath fish */
function drawFishShadow(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.35, s * 0.4, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();
}

// ─── SPECIES ───────────────────────────────────────────────

/** Tropical Fish — vibrant oval body with flowing fins and stripes */
function drawTropicalFish(opts: SpeciesDrawOptions): void {
    const { ctx, size: s, color, direction, animPhase, showOutline } = opts;
    const tailWag = Math.sin(animPhase * 3) * 0.15;

    ctx.save();
    ctx.scale(direction, 1);
    drawFishShadow(ctx, s);

    // Tail with gradient
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, 0);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.15, -s * 0.78, -s * 0.32 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.6, -s * 0.05, -s * 0.65, 0);
    ctx.quadraticCurveTo(-s * 0.6, s * 0.05, -s * 0.78, s * 0.32 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.55, s * 0.15, -s * 0.4, 0);
    ctx.closePath();
    const tailGrad = ctx.createLinearGradient(-s * 0.8, 0, -s * 0.4, 0);
    tailGrad.addColorStop(0, darken(color, 0.2));
    tailGrad.addColorStop(1, color);
    ctx.fillStyle = tailGrad;
    ctx.fill();

    // Dorsal fin
    const finWave = Math.sin(animPhase * 2) * 0.06 * s;
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, -s * 0.28);
    ctx.quadraticCurveTo(s * 0.0, -s * 0.55 + finWave, s * 0.2, -s * 0.26);
    ctx.fillStyle = hexToRgba(darken(color, 0.05), 0.85);
    ctx.fill();

    // Ventral fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, s * 0.28);
    ctx.quadraticCurveTo(s * 0.05, s * 0.48 - finWave, s * 0.18, s * 0.26);
    ctx.fillStyle = hexToRgba(darken(color, 0.05), 0.85);
    ctx.fill();

    // Body (oval) with gradient
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGradient(ctx, color, 0, -s * 0.3, s * 0.3);
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.25);
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    // Belly highlight (soft glow)
    ctx.beginPath();
    ctx.ellipse(s * 0.02, s * 0.08, s * 0.32, s * 0.12, 0, 0, Math.PI);
    ctx.fillStyle = hexToRgba(lighten(color, 0.45), 0.4);
    ctx.fill();

    // Stripes with transparency
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = lighten(color, 0.5);
    ctx.lineWidth = s * 0.04;
    for (let i = -1; i <= 1; i++) {
        const x = i * s * 0.14;
        ctx.beginPath();
        ctx.moveTo(x, -s * 0.22);
        ctx.lineTo(x, s * 0.22);
        ctx.stroke();
    }
    ctx.restore();

    // Pectoral fin (small, animated)
    const pectAngle = Math.sin(animPhase * 4) * 0.25;
    ctx.save();
    ctx.translate(s * 0.1, s * 0.1);
    ctx.rotate(pectAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.1, s * 0.04, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(color, 0.6);
    ctx.fill();
    ctx.restore();

    // Specular body highlight
    ctx.beginPath();
    ctx.ellipse(-s * 0.05, -s * 0.12, s * 0.2, s * 0.06, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();

    drawEye(ctx, s * 0.26, -s * 0.04, s * 0.06, 1);
    ctx.restore();
}

/** Clownfish — iconic round body with white band markings */
function drawClownfish(opts: SpeciesDrawOptions): void {
    const { ctx, size: s, color, direction, animPhase, showOutline } = opts;
    const tailWag = Math.sin(animPhase * 3) * 0.12;

    ctx.save();
    ctx.scale(direction, 1);
    drawFishShadow(ctx, s);

    // Rounded tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, 0);
    ctx.quadraticCurveTo(-s * 0.45, -s * 0.1, -s * 0.6, -s * 0.22 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.48, 0, -s * 0.6, s * 0.22 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.45, s * 0.1, -s * 0.35, 0);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.15);
    ctx.fill();

    // Dorsal fin
    const finWave = Math.sin(animPhase * 2.5) * 0.03 * s;
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, -s * 0.3);
    ctx.quadraticCurveTo(s * 0.08, -s * 0.44 + finWave, s * 0.2, -s * 0.29);
    ctx.fillStyle = darken(color, 0.08);
    ctx.fill();

    // Body with gradient
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.4, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGradient(ctx, color, 0, -s * 0.32, s * 0.32);
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.25);
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    // White bands with black edges (signature clownfish look)
    for (const bx of [s * 0.1, -s * 0.15]) {
        // Black edge
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = s * 0.08;
        ctx.beginPath();
        ctx.moveTo(bx, -s * 0.29);
        ctx.lineTo(bx, s * 0.29);
        ctx.stroke();

        // White band
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = s * 0.055;
        ctx.beginPath();
        ctx.moveTo(bx, -s * 0.28);
        ctx.lineTo(bx, s * 0.28);
        ctx.stroke();
    }

    // Belly glow
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.28, s * 0.12, 0, 0, Math.PI);
    ctx.fillStyle = hexToRgba(lighten(color, 0.35), 0.3);
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.ellipse(-s * 0.05, -s * 0.12, s * 0.18, s * 0.06, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    drawEye(ctx, s * 0.2, -s * 0.04, s * 0.055, 1);
    ctx.restore();
}

/** Angelfish — elegant tall diamond body with flowing fins */
function drawAngelfish(opts: SpeciesDrawOptions): void {
    const { ctx, size: s, color, direction, animPhase, showOutline } = opts;
    const tailWag = Math.sin(animPhase * 2.5) * 0.1;

    ctx.save();
    ctx.scale(direction, 1);
    drawFishShadow(ctx, s);

    // Small forked tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.quadraticCurveTo(-s * 0.4, -s * 0.08, -s * 0.52, -s * 0.18 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.38, 0, -s * 0.52, s * 0.18 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.08, -s * 0.3, 0);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.15);
    ctx.fill();

    // Long dorsal fin (the defining feature)
    const finWave = Math.sin(animPhase * 1.8) * 0.07 * s;
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.05, -s * 0.55, s * 0.0, -s * 0.7 + finWave);
    ctx.quadraticCurveTo(s * 0.1, -s * 0.45, s * 0.15, -s * 0.25);
    const finGrad = ctx.createLinearGradient(0, -s * 0.7, 0, -s * 0.2);
    finGrad.addColorStop(0, hexToRgba(lighten(color, 0.25), 0.7));
    finGrad.addColorStop(1, color);
    ctx.fillStyle = finGrad;
    ctx.fill();

    // Long anal fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, s * 0.2);
    ctx.quadraticCurveTo(-s * 0.05, s * 0.5, s * 0.0, s * 0.65 - finWave);
    ctx.quadraticCurveTo(s * 0.1, s * 0.4, s * 0.15, s * 0.25);
    ctx.fillStyle = finGrad;
    ctx.fill();

    // Diamond body
    ctx.beginPath();
    ctx.moveTo(s * 0.35, 0);
    ctx.quadraticCurveTo(s * 0.15, -s * 0.3, -s * 0.1, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.25, -s * 0.1, -s * 0.3, 0);
    ctx.quadraticCurveTo(-s * 0.25, s * 0.1, -s * 0.1, s * 0.2);
    ctx.quadraticCurveTo(s * 0.15, s * 0.3, s * 0.35, 0);
    ctx.closePath();
    ctx.fillStyle = bodyGradient(ctx, color, 0, -s * 0.3, s * 0.3);
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Subtle diagonal stripes
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = lighten(color, 0.5);
    ctx.lineWidth = s * 0.025;
    for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.07 - s * 0.05, -s * 0.25);
        ctx.lineTo(i * s * 0.07 + s * 0.05, s * 0.25);
        ctx.stroke();
    }
    ctx.restore();

    // Body highlight
    ctx.beginPath();
    ctx.ellipse(s * 0.0, -s * 0.08, s * 0.15, s * 0.06, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    drawEye(ctx, s * 0.2, -s * 0.03, s * 0.045, 1);
    ctx.restore();
}

/** Pufferfish — adorable nearly-circular body with speckles */
function drawPufferfish(opts: SpeciesDrawOptions): void {
    const { ctx, size: s, color, direction, animPhase, showOutline } = opts;
    const puff = 1 + Math.sin(animPhase * 1.5) * 0.04;

    ctx.save();
    ctx.scale(direction, 1);
    drawFishShadow(ctx, s);

    // Small cute tail
    const tailWag = Math.sin(animPhase * 3) * 0.08;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3 * puff, 0);
    ctx.quadraticCurveTo(-s * 0.38, -s * 0.06, -s * 0.48, -s * 0.13 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.4, 0, -s * 0.48, s * 0.13 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.38, s * 0.06, -s * 0.3 * puff, 0);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.15);
    ctx.fill();

    // Round body with radial gradient
    const bodyR = s * 0.36 * puff;
    const puffGrad = ctx.createRadialGradient(-s * 0.05, -s * 0.08, 0, 0, 0, bodyR);
    puffGrad.addColorStop(0, lighten(color, 0.2));
    puffGrad.addColorStop(0.5, color);
    puffGrad.addColorStop(1, darken(color, 0.12));
    ctx.beginPath();
    ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
    ctx.fillStyle = puffGrad;
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Lighter belly
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.26 * puff, s * 0.18 * puff, 0, 0.1, Math.PI - 0.1);
    ctx.fillStyle = hexToRgba(lighten(color, 0.4), 0.4);
    ctx.fill();

    // Cute speckles
    ctx.fillStyle = hexToRgba(darken(color, 0.18), 0.5);
    const dotCount = 10;
    for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * Math.PI * 2 + animPhase * 0.05;
        const r = s * 0.2;
        const dx = Math.cos(angle) * r;
        const dy = Math.sin(angle) * r * 0.85;
        ctx.beginPath();
        ctx.arc(dx, dy, s * 0.02, 0, Math.PI * 2);
        ctx.fill();
    }

    // Animated pectoral fin
    const finAngle = Math.sin(animPhase * 4) * 0.3;
    ctx.save();
    ctx.translate(s * 0.18, s * 0.12);
    ctx.rotate(finAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.09, s * 0.04, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(color, 0.6);
    ctx.fill();
    ctx.restore();

    // Small dorsal fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, -s * 0.32 * puff);
    ctx.quadraticCurveTo(0, -s * 0.42, s * 0.05, -s * 0.32 * puff);
    ctx.fillStyle = darken(color, 0.08);
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.ellipse(-s * 0.08, -s * 0.14, s * 0.12, s * 0.06, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();

    // Big cute eyes
    drawEye(ctx, s * 0.15, -s * 0.08, s * 0.07, 1);

    // Mouth (small smile)
    ctx.beginPath();
    ctx.arc(s * 0.28, s * 0.03, s * 0.04, 0, Math.PI);
    ctx.strokeStyle = darken(color, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}

/** Seahorse — unique curved body with textured ridges */
function drawSeahorse(opts: SpeciesDrawOptions): void {
    const { ctx, size: s, color, direction, animPhase, showOutline } = opts;
    const sway = Math.sin(animPhase * 2) * 0.04 * s;

    ctx.save();
    ctx.scale(direction, 1);

    // Body path
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s * 0.3);
    ctx.quadraticCurveTo(s * 0.36, -s * 0.36, s * 0.4, -s * 0.25);
    ctx.quadraticCurveTo(s * 0.32, -s * 0.14, s * 0.22, -s * 0.04);
    ctx.quadraticCurveTo(s * 0.27, s * 0.15, s * 0.17, s * 0.26);
    ctx.quadraticCurveTo(s * 0.07, s * 0.42 + sway, -s * 0.1, s * 0.36 + sway);
    ctx.quadraticCurveTo(-s * 0.16, s * 0.26 + sway, -s * 0.06, s * 0.2);
    ctx.quadraticCurveTo(-s * 0.12, s * 0.05, -s * 0.06, -s * 0.1);
    ctx.quadraticCurveTo(0, -s * 0.26, s * 0.1, -s * 0.36);
    ctx.closePath();

    // Body gradient
    const shGrad = ctx.createLinearGradient(-s * 0.1, -s * 0.35, s * 0.3, s * 0.3);
    shGrad.addColorStop(0, lighten(color, 0.15));
    shGrad.addColorStop(0.5, color);
    shGrad.addColorStop(1, darken(color, 0.15));
    ctx.fillStyle = shGrad;
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Belly ridges
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = lighten(color, 0.3);
    ctx.lineWidth = s * 0.018;
    for (let i = 0; i < 6; i++) {
        const y = -s * 0.1 + i * s * 0.065;
        ctx.beginPath();
        ctx.moveTo(s * 0.02, y);
        ctx.lineTo(s * 0.16, y);
        ctx.stroke();
    }
    ctx.restore();

    // Crown/crest with gradient
    const crownWave = Math.sin(animPhase * 2) * 0.015 * s;
    ctx.beginPath();
    ctx.moveTo(s * 0.06, -s * 0.36);
    ctx.lineTo(s * 0.0, -s * 0.5 + crownWave);
    ctx.lineTo(s * 0.09, -s * 0.43 + crownWave);
    ctx.lineTo(s * 0.07, -s * 0.53 + crownWave);
    ctx.lineTo(s * 0.16, -s * 0.39);
    ctx.fillStyle = darken(color, 0.08);
    ctx.fill();

    // Small dorsal fin
    const finWave = Math.sin(animPhase * 3) * 0.025 * s;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.04);
    ctx.quadraticCurveTo(-s * 0.16, -s * 0.08 + finWave, -s * 0.06, s * 0.06);
    ctx.fillStyle = hexToRgba(lighten(color, 0.2), 0.7);
    ctx.fill();

    // Body highlight
    ctx.beginPath();
    ctx.ellipse(s * 0.12, -s * 0.15, s * 0.08, s * 0.04, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    drawEye(ctx, s * 0.24, -s * 0.25, s * 0.035, 1);
    ctx.restore();
}

/** Swordfish — sleek, streamlined body with pointed bill */
function drawSwordfish(opts: SpeciesDrawOptions): void {
    const { ctx, size: s, color, direction, animPhase, showOutline } = opts;
    const tailWag = Math.sin(animPhase * 3.5) * 0.12;

    ctx.save();
    ctx.scale(direction, 1);
    drawFishShadow(ctx, s);

    // Crescent tail with gradient
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, 0);
    ctx.quadraticCurveTo(-s * 0.6, -s * 0.06, -s * 0.78, -s * 0.32 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.58, -s * 0.1, -s * 0.52, 0);
    ctx.quadraticCurveTo(-s * 0.58, s * 0.1, -s * 0.78, s * 0.32 + tailWag * s);
    ctx.quadraticCurveTo(-s * 0.6, s * 0.06, -s * 0.45, 0);
    ctx.closePath();
    const tailGrad = ctx.createLinearGradient(-s * 0.8, 0, -s * 0.45, 0);
    tailGrad.addColorStop(0, darken(color, 0.25));
    tailGrad.addColorStop(1, darken(color, 0.1));
    ctx.fillStyle = tailGrad;
    ctx.fill();

    // Tall dorsal fin
    const finWave = Math.sin(animPhase * 2) * 0.04 * s;
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.18);
    ctx.quadraticCurveTo(-s * 0.05, -s * 0.48 + finWave, -s * 0.22, -s * 0.22);
    ctx.lineTo(-s * 0.05, -s * 0.17);
    const dfGrad = ctx.createLinearGradient(0, -s * 0.48, 0, -s * 0.17);
    dfGrad.addColorStop(0, hexToRgba(darken(color, 0.1), 0.7));
    dfGrad.addColorStop(1, color);
    ctx.fillStyle = dfGrad;
    ctx.fill();

    // Sleek body
    ctx.beginPath();
    ctx.moveTo(s * 0.42, 0);
    ctx.quadraticCurveTo(s * 0.25, -s * 0.18, -s * 0.08, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.35, -s * 0.15, -s * 0.48, 0);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.15, -s * 0.08, s * 0.2);
    ctx.quadraticCurveTo(s * 0.25, s * 0.18, s * 0.42, 0);
    ctx.closePath();
    ctx.fillStyle = bodyGradient(ctx, color, 0, -s * 0.2, s * 0.2);
    ctx.fill();
    if (showOutline) {
        ctx.strokeStyle = darken(color, 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Sword/bill with metallic gradient
    ctx.beginPath();
    ctx.moveTo(s * 0.42, -s * 0.02);
    ctx.lineTo(s * 0.75, 0);
    ctx.lineTo(s * 0.42, s * 0.02);
    ctx.closePath();
    const swordGrad = ctx.createLinearGradient(s * 0.42, 0, s * 0.75, 0);
    swordGrad.addColorStop(0, darken(color, 0.2));
    swordGrad.addColorStop(0.5, darken(color, 0.35));
    swordGrad.addColorStop(1, darken(color, 0.5));
    ctx.fillStyle = swordGrad;
    ctx.fill();

    // Belly highlight
    ctx.beginPath();
    ctx.ellipse(0, s * 0.06, s * 0.28, s * 0.08, 0, 0, Math.PI);
    ctx.fillStyle = hexToRgba(lighten(color, 0.35), 0.35);
    ctx.fill();

    // Lateral line
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = darken(color, 0.3);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(s * 0.35, 0);
    ctx.quadraticCurveTo(s * 0.1, -s * 0.02, -s * 0.4, 0);
    ctx.stroke();
    ctx.restore();

    // Pectoral fin
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.06);
    ctx.quadraticCurveTo(s * 0.18, s * 0.22, s * 0.0, s * 0.2);
    ctx.lineTo(s * 0.05, s * 0.08);
    ctx.fillStyle = hexToRgba(darken(color, 0.08), 0.7);
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.ellipse(s * 0.05, -s * 0.08, s * 0.18, s * 0.04, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    drawEye(ctx, s * 0.27, -s * 0.04, s * 0.04, 1);
    ctx.restore();
}

/** All available species */
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

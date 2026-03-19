/**
 * Fish class — manages individual fish state, movement, and rendering.
 */

import { SPECIES } from "./species";
import { clamp, rand, lerp } from "./utils";

export interface FishData {
    label: string;
    value: number;
    value2?: number;
    color: string;
    species: number;
    size: number;       // mapped pixel size
    selectionId?: unknown;
}

export class Fish {
    // Position and velocity
    x: number;
    y: number;
    vx: number;
    vy: number;

    // Movement targets
    private targetX: number;
    private targetY: number;
    private retargetTimer: number;

    // Visual properties
    size: number;
    species: number;
    color: string;
    direction: number; // 1=right, -1=left
    private scaleX: number; // smooth flip transition

    // Animation
    animPhase: number;

    // Data binding
    label: string;
    value: number;
    value2: number;
    selectionId: unknown;

    // State
    selected: boolean;
    hovered: boolean;

    // Bounds
    private boundsW: number;
    private boundsH: number;

    constructor(data: FishData, boundsW: number, boundsH: number) {
        this.label = data.label;
        this.value = data.value;
        this.value2 = data.value2 ?? 1;
        this.color = data.color;
        this.species = data.species;
        this.size = data.size;
        this.selectionId = data.selectionId;

        this.boundsW = boundsW;
        this.boundsH = boundsH;

        // Random initial position (avoid edges and sand)
        const margin = data.size;
        this.x = rand(margin, boundsW - margin);
        this.y = rand(margin, boundsH * 0.8 - margin);

        // Random initial velocity
        this.vx = rand(-1, 1);
        this.vy = rand(-0.3, 0.3);
        this.direction = this.vx >= 0 ? 1 : -1;
        this.scaleX = this.direction;

        // Pick initial target
        this.targetX = rand(margin, boundsW - margin);
        this.targetY = rand(margin, boundsH * 0.75 - margin);
        this.retargetTimer = rand(2000, 6000);

        this.animPhase = rand(0, Math.PI * 2);
        this.selected = false;
        this.hovered = false;
    }

    /** Update data without resetting position */
    updateData(data: FishData): void {
        this.label = data.label;
        this.value = data.value;
        this.value2 = data.value2 ?? 1;
        this.color = data.color;
        this.species = data.species;
        this.size = data.size;
        this.selectionId = data.selectionId;
    }

    /** Update position and animation state */
    update(dt: number, time: number, speedMultiplier: number): void {
        const speed = 0.5 * speedMultiplier * (0.5 + this.value2 * 0.5);

        // Update retarget timer
        this.retargetTimer -= dt;
        if (this.retargetTimer <= 0) {
            this.pickNewTarget();
            this.retargetTimer = rand(3000, 8000);
        }

        // Steer toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.vx = lerp(this.vx, (dx / dist) * speed, 0.02);
            this.vy = lerp(this.vy, (dy / dist) * speed, 0.02);
        } else {
            this.pickNewTarget();
        }

        // Add gentle sine bobbing
        this.vy += Math.sin(time * 0.001 + this.animPhase) * 0.005;

        // Boundary repulsion (soft)
        const margin = this.size * 1.5;
        const maxY = this.boundsH * 0.82;
        if (this.x < margin) this.vx += 0.05;
        if (this.x > this.boundsW - margin) this.vx -= 0.05;
        if (this.y < margin) this.vy += 0.03;
        if (this.y > maxY) this.vy -= 0.05;

        // Apply velocity
        this.x += this.vx * dt * 0.06;
        this.y += this.vy * dt * 0.06;

        // Clamp position
        this.x = clamp(this.x, this.size, this.boundsW - this.size);
        this.y = clamp(this.y, this.size, maxY);

        // Update direction
        if (Math.abs(this.vx) > 0.1) {
            this.direction = this.vx > 0 ? 1 : -1;
        }

        // Smooth flip transition
        this.scaleX = lerp(this.scaleX, this.direction, 0.08);

        // Advance animation phase (speed affects tail wag rate)
        this.animPhase += dt * 0.004 * (1 + speed);
    }

    /** Update canvas bounds */
    setBounds(w: number, h: number): void {
        this.boundsW = w;
        this.boundsH = h;
    }

    /** Pick a new random target to swim toward */
    private pickNewTarget(): void {
        const margin = this.size * 2;
        this.targetX = rand(margin, this.boundsW - margin);
        this.targetY = rand(margin, this.boundsH * 0.75);
    }

    /** Render this fish */
    render(ctx: CanvasRenderingContext2D, showOutline: boolean): void {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Selection glow
        if (this.selected || this.hovered) {
            ctx.shadowColor = this.selected ? "#FFD700" : "rgba(255,255,255,0.6)";
            ctx.shadowBlur = this.selected ? 15 : 8;
        }

        // Draw the fish species
        const drawFn = SPECIES[this.species % SPECIES.length];
        drawFn({
            ctx,
            size: this.size,
            color: this.color,
            direction: this.scaleX > 0 ? 1 : -1,
            animPhase: this.animPhase,
            showOutline,
        });

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /** Render label above/below the fish */
    renderLabel(ctx: CanvasRenderingContext2D, fontSize: number, fontColor: string): void {
        ctx.save();
        ctx.font = `${fontSize}px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        const text = this.label;
        const valueText = this.formatValue(this.value);
        const labelY = this.y - this.size * 0.5 - 6;

        // Background for readability
        const metrics = ctx.measureText(text);
        const valueMetrics = ctx.measureText(valueText);
        const maxW = Math.max(metrics.width, valueMetrics.width);
        const bgPad = 3;

        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        const rx = this.x - maxW / 2 - bgPad;
        const ry = labelY - fontSize * 2 - bgPad;
        const rw = maxW + bgPad * 2;
        const rh = fontSize * 2 + bgPad * 2;
        ctx.roundRect(rx, ry, rw, rh, 3);
        ctx.fill();

        // Category name
        ctx.fillStyle = fontColor;
        ctx.fillText(text, this.x, labelY - fontSize);

        // Value
        ctx.globalAlpha = 0.8;
        ctx.font = `${fontSize - 1}px 'Segoe UI', Arial, sans-serif`;
        ctx.fillText(valueText, this.x, labelY);

        ctx.restore();
    }

    /** Hit test — is point (px,py) on this fish? */
    hitTest(px: number, py: number): boolean {
        const dx = px - this.x;
        const dy = py - this.y;
        const r = this.size * 0.6;
        return dx * dx + dy * dy < r * r;
    }

    private formatValue(v: number): string {
        if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
        if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + "K";
        return v.toFixed(v % 1 === 0 ? 0 : 1);
    }
}

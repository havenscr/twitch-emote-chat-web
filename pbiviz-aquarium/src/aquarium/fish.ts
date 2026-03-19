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
        const safeW = Math.max(boundsW, margin * 4);
        const safeH = Math.max(boundsH, margin * 4);
        this.x = rand(margin, safeW - margin);
        this.y = rand(margin, safeH * 0.75);

        // Random initial velocity
        this.vx = rand(-1.5, 1.5);
        this.vy = rand(-0.5, 0.5);
        this.direction = this.vx >= 0 ? 1 : -1;
        this.scaleX = this.direction;

        // Pick initial target
        this.targetX = rand(margin, safeW - margin);
        this.targetY = rand(margin, safeH * 0.75);
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

    /** Reposition fish randomly within given bounds (used after resize from bad state) */
    scatter(boundsW: number, boundsH: number): void {
        this.boundsW = boundsW;
        this.boundsH = boundsH;
        const margin = this.size * 2;
        this.x = rand(margin, Math.max(margin + 1, boundsW - margin));
        this.y = rand(margin, Math.max(margin + 1, boundsH * 0.75));
        this.targetX = rand(margin, Math.max(margin + 1, boundsW - margin));
        this.targetY = rand(margin, Math.max(margin + 1, boundsH * 0.75));
        this.vx = rand(-1.5, 1.5);
        this.vy = rand(-0.5, 0.5);
        this.direction = this.vx >= 0 ? 1 : -1;
        this.scaleX = this.direction;
    }

    /** Update position and animation state */
    update(dt: number, time: number, speedMultiplier: number): void {
        // Skip movement if we don't have valid bounds yet — just animate fins/tail
        if (this.boundsW < 10 || this.boundsH < 10) {
            this.animPhase += dt * 0.005;
            return;
        }

        const speed = 1.5 * speedMultiplier * (0.5 + this.value2 * 0.5);

        // Update retarget timer
        this.retargetTimer -= dt;
        if (this.retargetTimer <= 0) {
            this.pickNewTarget();
            this.retargetTimer = rand(2000, 5000);
        }

        // Steer toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.vx = lerp(this.vx, (dx / dist) * speed, 0.05);
            this.vy = lerp(this.vy, (dy / dist) * speed, 0.05);
        } else {
            this.pickNewTarget();
        }

        // Add gentle sine bobbing
        this.vy += Math.sin(time * 0.001 + this.animPhase) * 0.008;

        // Boundary repulsion (soft)
        const margin = this.size * 1.5;
        const maxY = this.boundsH * 0.82;
        if (this.x < margin) this.vx += 0.15;
        if (this.x > this.boundsW - margin) this.vx -= 0.15;
        if (this.y < margin) this.vy += 0.1;
        if (this.y > maxY) this.vy -= 0.15;

        // Apply velocity (dt in ms, scale to ~pixels/frame at 60fps)
        this.x += this.vx * dt * 0.12;
        this.y += this.vy * dt * 0.12;

        // Clamp position — only if bounds are valid
        const minClamp = this.size;
        const maxClampX = Math.max(this.boundsW - this.size, minClamp + 1);
        const maxClampY = Math.max(maxY, minClamp + 1);
        this.x = clamp(this.x, minClamp, maxClampX);
        this.y = clamp(this.y, minClamp, maxClampY);

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
        ctx.font = `600 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        const text = this.label;
        const valueText = this.formatValue(this.value);
        const labelY = this.y - this.size * 0.5 - 8;

        // Measure for background
        const metrics = ctx.measureText(text);
        ctx.font = `${fontSize - 1}px 'Segoe UI', Arial, sans-serif`;
        const valueMetrics = ctx.measureText(valueText);
        const maxW = Math.max(metrics.width, valueMetrics.width);
        const bgPad = 5;

        const rx = this.x - maxW / 2 - bgPad;
        const ry = labelY - fontSize * 2 - bgPad;
        const rw = maxW + bgPad * 2;
        const rh = fontSize * 2 + bgPad * 2 + 2;

        // Frosted glass background
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, 5);
        ctx.fill();

        // Subtle border
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Category name with text shadow
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        ctx.font = `600 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = fontColor;
        ctx.fillText(text, this.x, labelY - fontSize + 1);

        // Value
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 0.75;
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

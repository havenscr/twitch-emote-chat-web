/**
 * Seaweed/kelp — swaying plants at the bottom of the aquarium.
 */

import { rand } from "./utils";

interface Stalk {
    x: number;        // 0..1 relative X position
    height: number;    // 0..1 relative height (of canvas)
    segments: number;
    width: number;
    color: string;
    swayOffset: number;
    swaySpeed: number;
}

export class Seaweed {
    private stalks: Stalk[] = [];

    /** Initialize seaweed stalks */
    init(): void {
        this.stalks = [];
        const count = 5 + Math.floor(Math.random() * 3);
        const greens = ["#2d5a27", "#3a7a30", "#4a8c3f", "#1e6b2a", "#358a3f", "#2e7d32"];

        for (let i = 0; i < count; i++) {
            this.stalks.push({
                x: rand(0.03, 0.97),
                height: rand(0.15, 0.35),
                segments: 5 + Math.floor(Math.random() * 4),
                width: rand(3, 7),
                color: greens[Math.floor(Math.random() * greens.length)],
                swayOffset: rand(0, Math.PI * 2),
                swaySpeed: rand(0.8, 1.8),
            });
        }
    }

    /** Render all seaweed stalks */
    render(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        if (this.stalks.length === 0) this.init();

        const sandTop = h * 0.85;

        for (const stalk of this.stalks) {
            this.drawStalk(ctx, w, h, sandTop, stalk, time);
        }
    }

    private drawStalk(
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        sandTop: number,
        stalk: Stalk,
        time: number
    ): void {
        const baseX = stalk.x * w;
        const baseY = sandTop;
        const totalHeight = stalk.height * h;
        const segHeight = totalHeight / stalk.segments;

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw each segment as a quadratic curve
        let prevX = baseX;
        let prevY = baseY;

        for (let i = 0; i < stalk.segments; i++) {
            const progress = (i + 1) / stalk.segments; // 0..1 from base to tip
            const swayAmount = progress * progress * 15; // Sway increases toward tip
            const sway = Math.sin(time * 0.001 * stalk.swaySpeed + stalk.swayOffset + i * 0.5) * swayAmount;

            const nextX = baseX + sway;
            const nextY = baseY - segHeight * (i + 1);

            // Thickness decreases toward tip
            const thickness = stalk.width * (1 - progress * 0.7);

            // Draw segment as filled shape for natural look
            const cpX = (prevX + nextX) / 2 + sway * 0.3;
            const cpY = (prevY + nextY) / 2;

            ctx.beginPath();
            ctx.moveTo(prevX - thickness / 2, prevY);
            ctx.quadraticCurveTo(cpX - thickness / 3, cpY, nextX - thickness / 4, nextY);
            ctx.lineTo(nextX + thickness / 4, nextY);
            ctx.quadraticCurveTo(cpX + thickness / 3, cpY, prevX + thickness / 2, prevY);
            ctx.closePath();

            // Gradient: darker at base, lighter at tip
            const alpha = 0.8 - progress * 0.2;
            ctx.fillStyle = stalk.color;
            ctx.globalAlpha = alpha;
            ctx.fill();

            // Optional: leaf-like nubs on alternating sides
            if (i > 0 && i < stalk.segments - 1 && i % 2 === 0) {
                const leafSide = (i % 4 === 0) ? 1 : -1;
                const leafX = (prevX + nextX) / 2;
                const leafY = (prevY + nextY) / 2;
                const leafLen = thickness * 2.5;

                ctx.beginPath();
                ctx.moveTo(leafX, leafY);
                ctx.quadraticCurveTo(
                    leafX + leafSide * leafLen,
                    leafY - leafLen * 0.3,
                    leafX + leafSide * leafLen * 0.6,
                    leafY - leafLen * 0.8
                );
                ctx.quadraticCurveTo(
                    leafX + leafSide * leafLen * 0.3,
                    leafY - leafLen * 0.2,
                    leafX,
                    leafY
                );
                ctx.fillStyle = stalk.color;
                ctx.globalAlpha = alpha * 0.7;
                ctx.fill();
            }

            prevX = nextX;
            prevY = nextY;
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

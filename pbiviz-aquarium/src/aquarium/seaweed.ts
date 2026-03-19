/**
 * Seaweed/kelp — lush, beautifully swaying plants with gradient coloring
 * and leaf details at the bottom of the aquarium.
 */

import { rand, hexToRgba, lighten, darken } from "./utils";

interface Stalk {
    x: number;
    height: number;
    segments: number;
    width: number;
    color: string;
    tipColor: string;
    swayOffset: number;
    swaySpeed: number;
    swayAmount: number;
}

export class Seaweed {
    private stalks: Stalk[] = [];

    /** Initialize seaweed stalks with varied colors and sizes */
    init(): void {
        this.stalks = [];
        const count = 7 + Math.floor(Math.random() * 4);
        const colorSets = [
            { base: "#2d6a27", tip: "#5dba4f" },
            { base: "#1e7a3a", tip: "#4ec96b" },
            { base: "#3a8530", tip: "#6ed85f" },
            { base: "#1b6b2a", tip: "#3fb54a" },
            { base: "#2e7d32", tip: "#66bb6a" },
            { base: "#1b5e20", tip: "#4caf50" },
            { base: "#336b3e", tip: "#7bc88a" },
        ];

        for (let i = 0; i < count; i++) {
            const colorSet = colorSets[Math.floor(Math.random() * colorSets.length)];
            this.stalks.push({
                x: rand(0.02, 0.98),
                height: rand(0.12, 0.38),
                segments: 6 + Math.floor(Math.random() * 5),
                width: rand(3.5, 8),
                color: colorSet.base,
                tipColor: colorSet.tip,
                swayOffset: rand(0, Math.PI * 2),
                swaySpeed: rand(0.6, 1.5),
                swayAmount: rand(0.8, 1.4),
            });
        }
    }

    /** Render all seaweed stalks */
    render(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        if (this.stalks.length === 0) this.init();
        const sandTop = h * 0.84;

        for (const stalk of this.stalks) {
            this.drawStalk(ctx, w, h, sandTop, stalk, time);
        }
    }

    private drawStalk(
        ctx: CanvasRenderingContext2D, w: number, h: number,
        sandTop: number, stalk: Stalk, time: number
    ): void {
        const baseX = stalk.x * w;
        const baseY = sandTop;
        const totalHeight = stalk.height * h;
        const segHeight = totalHeight / stalk.segments;

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        let prevX = baseX;
        let prevY = baseY;

        for (let i = 0; i < stalk.segments; i++) {
            const progress = (i + 1) / stalk.segments;
            const swayPower = progress * progress * 18 * stalk.swayAmount;
            const sway = Math.sin(time * 0.0008 * stalk.swaySpeed + stalk.swayOffset + i * 0.45) * swayPower
                       + Math.sin(time * 0.0005 * stalk.swaySpeed + stalk.swayOffset + i * 0.8) * swayPower * 0.3;

            const nextX = baseX + sway;
            const nextY = baseY - segHeight * (i + 1);
            const thickness = stalk.width * (1 - progress * 0.65);

            const cpX = (prevX + nextX) / 2 + sway * 0.25;
            const cpY = (prevY + nextY) / 2;

            // Segment shape
            ctx.beginPath();
            ctx.moveTo(prevX - thickness / 2, prevY);
            ctx.quadraticCurveTo(cpX - thickness / 3, cpY, nextX - thickness / 4, nextY);
            ctx.lineTo(nextX + thickness / 4, nextY);
            ctx.quadraticCurveTo(cpX + thickness / 3, cpY, prevX + thickness / 2, prevY);
            ctx.closePath();

            // Gradient from base color to tip color
            const segColor = this.lerpColor(stalk.color, stalk.tipColor, progress);
            ctx.fillStyle = segColor;
            ctx.globalAlpha = 0.85 - progress * 0.15;
            ctx.fill();

            // Subtle center vein (lighter)
            if (thickness > 2) {
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.quadraticCurveTo(cpX, cpY, nextX, nextY);
                ctx.strokeStyle = hexToRgba(lighten(stalk.tipColor, 0.3), 0.15);
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Leaf nubs — alternating sides, more organic shapes
            if (i > 0 && i < stalk.segments - 1) {
                const leafSide = (i % 2 === 0) ? 1 : -1;
                const leafX = (prevX + nextX) / 2;
                const leafY = (prevY + nextY) / 2;
                const leafLen = thickness * 2.8;
                const leafSway = Math.sin(time * 0.001 * stalk.swaySpeed + stalk.swayOffset + i) * 3;

                ctx.beginPath();
                ctx.moveTo(leafX, leafY);
                ctx.quadraticCurveTo(
                    leafX + leafSide * (leafLen + leafSway),
                    leafY - leafLen * 0.2,
                    leafX + leafSide * leafLen * 0.5 + leafSway,
                    leafY - leafLen * 0.7
                );
                ctx.quadraticCurveTo(
                    leafX + leafSide * leafLen * 0.2,
                    leafY - leafLen * 0.15,
                    leafX,
                    leafY
                );
                ctx.fillStyle = segColor;
                ctx.globalAlpha = (0.85 - progress * 0.15) * 0.65;
                ctx.fill();
            }

            prevX = nextX;
            prevY = nextY;
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    /** Simple hex color interpolation */
    private lerpColor(c1: string, c2: string, t: number): string {
        const r1 = parseInt(c1.slice(1, 3), 16);
        const g1 = parseInt(c1.slice(3, 5), 16);
        const b1 = parseInt(c1.slice(5, 7), 16);
        const r2 = parseInt(c2.slice(1, 3), 16);
        const g2 = parseInt(c2.slice(3, 5), 16);
        const b2 = parseInt(c2.slice(5, 7), 16);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return `rgb(${r},${g},${b})`;
    }
}

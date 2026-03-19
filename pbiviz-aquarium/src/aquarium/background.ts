/**
 * Background renderer — water gradient, light rays, caustics, sandy bottom, rocks, coral.
 */

import { ThemeColors, hexToRgba, rand } from "./utils";

interface Rock {
    x: number; // 0..1 relative position
    y: number;
    rx: number;
    ry: number;
    color: string;
}

interface Coral {
    x: number; // 0..1 relative
    color: string;
    branches: number;
    height: number; // 0..1 relative to sand area
    seed: number;
}

export class Background {
    private rocks: Rock[] = [];
    private corals: Coral[] = [];
    private initialized = false;

    /** Initialize decorations (call once or when theme changes) */
    init(): void {
        // Generate rocks
        this.rocks = [];
        const rockCount = 6 + Math.floor(Math.random() * 4);
        const rockColors = ["#8b7355", "#a0937a", "#6b5b45", "#7a6c55", "#9c8b72"];
        for (let i = 0; i < rockCount; i++) {
            this.rocks.push({
                x: rand(0.05, 0.95),
                y: rand(0.0, 0.7),
                rx: rand(0.008, 0.02),
                ry: rand(0.005, 0.012),
                color: rockColors[Math.floor(Math.random() * rockColors.length)],
            });
        }

        // Generate corals
        this.corals = [];
        const coralColors = ["#e84393", "#fd79a8", "#e17055", "#d63031", "#e056a0", "#ff7675"];
        const coralCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < coralCount; i++) {
            this.corals.push({
                x: rand(0.1, 0.9),
                color: coralColors[Math.floor(Math.random() * coralColors.length)],
                branches: 3 + Math.floor(Math.random() * 3),
                height: rand(0.3, 0.7),
                seed: Math.random() * 1000,
            });
        }

        this.initialized = true;
    }

    /** Render the full background */
    render(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, theme: ThemeColors): void {
        if (!this.initialized) this.init();

        this.drawWaterGradient(ctx, w, h, theme);
        this.drawLightRays(ctx, w, h, time, theme);
        this.drawCaustics(ctx, w, h, time, theme);
        this.drawSandyBottom(ctx, w, h, theme);
        this.drawRocks(ctx, w, h, theme);
        this.drawCorals(ctx, w, h, time);
    }

    private drawWaterGradient(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors): void {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, theme.waterTop);
        grad.addColorStop(0.7, theme.waterBottom);
        grad.addColorStop(1, theme.waterBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    private drawLightRays(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, theme: ThemeColors): void {
        ctx.save();
        const rayCount = theme.lightRayCount;
        const alpha = theme.lightRayAlpha;

        for (let i = 0; i < rayCount; i++) {
            const baseX = (w / (rayCount + 1)) * (i + 1);
            const sway = Math.sin(time * 0.0003 + i * 1.7) * w * 0.05;
            const topX = baseX + sway;
            const spread = w * 0.04 + Math.sin(time * 0.0005 + i) * w * 0.01;

            const grad = ctx.createLinearGradient(topX, 0, topX, h * 0.8);
            grad.addColorStop(0, hexToRgba("#ffffff", alpha * 1.5));
            grad.addColorStop(0.3, hexToRgba("#ffffff", alpha));
            grad.addColorStop(1, hexToRgba("#ffffff", 0));

            ctx.beginPath();
            ctx.moveTo(topX - spread * 0.3, 0);
            ctx.lineTo(topX + spread * 0.3, 0);
            ctx.lineTo(topX + spread * 2.5, h * 0.85);
            ctx.lineTo(topX - spread * 2, h * 0.85);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        }
        ctx.restore();
    }

    private drawCaustics(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, theme: ThemeColors): void {
        ctx.save();
        ctx.globalAlpha = theme.ambientLight * 0.3;
        ctx.globalCompositeOperation = "screen";

        const cellSize = 60;
        const cols = Math.ceil(w / cellSize) + 1;
        const rows = Math.ceil(h * 0.7 / cellSize) + 1;
        const t = time * 0.001;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cellSize;
                const y = r * cellSize;
                const distort = Math.sin(x * 0.02 + t) * Math.cos(y * 0.02 + t * 0.7) * 0.5 + 0.5;

                if (distort > 0.6) {
                    const brightness = (distort - 0.6) * 2.5;
                    ctx.fillStyle = `rgba(180,220,255,${brightness * 0.15})`;
                    ctx.beginPath();
                    const sx = x + Math.sin(t + r) * 8;
                    const sy = y + Math.cos(t * 0.8 + c) * 8;
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + cellSize * 0.4, sy + cellSize * 0.1);
                    ctx.lineTo(sx + cellSize * 0.3, sy + cellSize * 0.4);
                    ctx.lineTo(sx - cellSize * 0.1, sy + cellSize * 0.3);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }

    private drawSandyBottom(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors): void {
        const sandTop = h * 0.85;
        const sandHeight = h * 0.15;

        // Sand gradient
        const grad = ctx.createLinearGradient(0, sandTop, 0, h);
        grad.addColorStop(0, theme.sandLight);
        grad.addColorStop(1, theme.sandDark);

        // Curved sand surface
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, sandTop + sandHeight * 0.1);

        // Gentle undulating surface
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const x = (w / segments) * i;
            const waveY = sandTop + Math.sin(i * 0.8 + 0.5) * sandHeight * 0.08;
            if (i === 0) {
                ctx.lineTo(x, waveY);
            } else {
                const prevX = (w / segments) * (i - 1);
                ctx.quadraticCurveTo(
                    (prevX + x) / 2,
                    waveY - sandHeight * 0.03,
                    x,
                    waveY
                );
            }
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Sand texture - tiny dots
        ctx.fillStyle = hexToRgba(theme.sandDark, 0.15);
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * w;
            const y = sandTop + Math.random() * sandHeight;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawRocks(ctx: CanvasRenderingContext2D, w: number, h: number, _theme: ThemeColors): void {
        const sandTop = h * 0.85;

        for (const rock of this.rocks) {
            const x = rock.x * w;
            const y = sandTop + rock.y * (h - sandTop);
            const rx = rock.rx * w;
            const ry = rock.ry * h;

            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = rock.color;
            ctx.fill();

            // Highlight
            ctx.beginPath();
            ctx.ellipse(x - rx * 0.2, y - ry * 0.3, rx * 0.4, ry * 0.3, -0.3, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fill();
        }
    }

    private drawCorals(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        const sandTop = h * 0.85;

        for (const coral of this.corals) {
            const baseX = coral.x * w;
            const baseY = sandTop;
            const maxH = coral.height * (h - sandTop) * 2;

            this.drawCoralBranch(ctx, baseX, baseY, maxH, coral.branches, coral.color, time, coral.seed, 0);
        }
    }

    private drawCoralBranch(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        height: number,
        branchesLeft: number,
        color: string,
        time: number,
        seed: number,
        depth: number
    ): void {
        if (branchesLeft <= 0 || height < 5) return;

        const sway = Math.sin(time * 0.001 + seed) * 3 * (depth + 1) * 0.3;
        const thickness = Math.max(2, 6 - depth * 1.5);

        // Main stem
        const topX = x + sway;
        const topY = y - height;

        ctx.beginPath();
        ctx.moveTo(x - thickness / 2, y);
        ctx.quadraticCurveTo(topX - thickness / 4, y - height * 0.5, topX - thickness / 4, topY);
        ctx.lineTo(topX + thickness / 4, topY);
        ctx.quadraticCurveTo(topX + thickness / 4, y - height * 0.5, x + thickness / 2, y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Bulbous tip
        ctx.beginPath();
        ctx.arc(topX, topY, thickness * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Sub-branches
        if (depth < 3) {
            const nextHeight = height * 0.55;
            const midY = y - height * 0.5;
            const midX = (x + topX) / 2;

            // Left branch
            this.drawCoralBranch(
                ctx, midX, midY, nextHeight, branchesLeft - 1, color, time, seed + 1.3, depth + 1
            );
            // Right branch
            this.drawCoralBranch(
                ctx, midX + 8, midY + 5, nextHeight * 0.8, branchesLeft - 2, color, time, seed + 2.7, depth + 1
            );
        }
    }
}

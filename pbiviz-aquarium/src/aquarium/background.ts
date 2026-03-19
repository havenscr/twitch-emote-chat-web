/**
 * Background renderer — gorgeous underwater environment with volumetric lighting,
 * water surface shimmer, caustic patterns, sand, rocks, coral, and ambient particles.
 */

import { ThemeColors, hexToRgba, lighten, darken, rand } from "./utils";

interface Rock {
    x: number;
    y: number;
    rx: number;
    ry: number;
    color: string;
    highlight: string;
}

interface Coral {
    x: number;
    color: string;
    glowColor: string;
    branches: number;
    height: number;
    seed: number;
}

interface DustParticle {
    x: number;
    y: number;
    size: number;
    speed: number;
    drift: number;
    opacity: number;
    phase: number;
}

interface Shell {
    x: number;
    size: number;
    color: string;
    rotation: number;
}

export class Background {
    private rocks: Rock[] = [];
    private corals: Coral[] = [];
    private dust: DustParticle[] = [];
    private shells: Shell[] = [];
    private initialized = false;

    /** Initialize decorations */
    init(): void {
        // Generate rocks
        this.rocks = [];
        const rockCount = 8 + Math.floor(Math.random() * 5);
        const rockColors = ["#8b7355", "#a0937a", "#6b5b45", "#7a6c55", "#9c8b72", "#b5a48c"];
        for (let i = 0; i < rockCount; i++) {
            const color = rockColors[Math.floor(Math.random() * rockColors.length)];
            this.rocks.push({
                x: rand(0.03, 0.97),
                y: rand(0.0, 0.7),
                rx: rand(0.01, 0.025),
                ry: rand(0.006, 0.015),
                color,
                highlight: lighten(color, 0.3),
            });
        }

        // Generate corals
        this.corals = [];
        const coralColors = ["#e84393", "#fd79a8", "#e17055", "#d63031", "#e056a0", "#ff7675", "#fab1a0", "#ff6b81"];
        const coralCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < coralCount; i++) {
            const color = coralColors[Math.floor(Math.random() * coralColors.length)];
            this.corals.push({
                x: rand(0.08, 0.92),
                color,
                glowColor: lighten(color, 0.4),
                branches: 3 + Math.floor(Math.random() * 4),
                height: rand(0.3, 0.8),
                seed: Math.random() * 1000,
            });
        }

        // Generate ambient dust/plankton particles
        this.dust = [];
        for (let i = 0; i < 60; i++) {
            this.dust.push({
                x: rand(0, 1),
                y: rand(0, 0.85),
                size: rand(0.5, 2.5),
                speed: rand(0.00002, 0.00008),
                drift: rand(0.00005, 0.00015),
                opacity: rand(0.1, 0.4),
                phase: rand(0, Math.PI * 2),
            });
        }

        // Generate shells on the sand
        this.shells = [];
        const shellColors = ["#ffeaa7", "#dfe6e9", "#fab1a0", "#fad390", "#e8d5b7"];
        for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
            this.shells.push({
                x: rand(0.05, 0.95),
                size: rand(4, 10),
                color: shellColors[Math.floor(Math.random() * shellColors.length)],
                rotation: rand(-0.4, 0.4),
            });
        }

        this.initialized = true;
    }

    /** Render the full background */
    render(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, theme: ThemeColors): void {
        if (!this.initialized) this.init();

        this.drawWaterGradient(ctx, w, h, theme);
        this.drawDeepGlow(ctx, w, h, theme);
        this.drawLightRays(ctx, w, h, time, theme);
        this.drawCaustics(ctx, w, h, time, theme);
        this.drawSandyBottom(ctx, w, h, theme);
        this.drawRocks(ctx, w, h);
        this.drawShells(ctx, w, h);
        this.drawCorals(ctx, w, h, time);
        this.drawDustParticles(ctx, w, h, time);
        this.drawWaterSurface(ctx, w, h, time, theme);
    }

    private drawWaterGradient(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors): void {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, lighten(theme.waterTop, 0.15));
        grad.addColorStop(0.15, theme.waterTop);
        grad.addColorStop(0.6, theme.waterBottom);
        grad.addColorStop(0.85, darken(theme.waterBottom, 0.15));
        grad.addColorStop(1, darken(theme.waterBottom, 0.25));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    /** Subtle ambient glow at center bottom — gives a sense of depth */
    private drawDeepGlow(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors): void {
        ctx.save();
        const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.6);
        grad.addColorStop(0, hexToRgba(theme.waterTop, 0.08));
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    private drawLightRays(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, theme: ThemeColors): void {
        ctx.save();
        const rayCount = theme.lightRayCount + 2;
        const baseAlpha = theme.lightRayAlpha * 1.5;

        for (let i = 0; i < rayCount; i++) {
            const baseX = (w / (rayCount + 1)) * (i + 1);
            const sway = Math.sin(time * 0.00025 + i * 1.7) * w * 0.06;
            const topX = baseX + sway;
            const spread = w * 0.035 + Math.sin(time * 0.0004 + i * 0.8) * w * 0.015;

            // Volumetric ray with multiple alpha layers
            for (let layer = 0; layer < 3; layer++) {
                const layerAlpha = baseAlpha * (1 - layer * 0.3);
                const layerSpread = spread * (1 + layer * 0.3);

                const grad = ctx.createLinearGradient(topX, 0, topX, h * 0.85);
                grad.addColorStop(0, hexToRgba("#ffffff", layerAlpha * 1.8));
                grad.addColorStop(0.15, hexToRgba("#ffffee", layerAlpha * 1.2));
                grad.addColorStop(0.5, hexToRgba("#eeffff", layerAlpha * 0.6));
                grad.addColorStop(1, hexToRgba("#ffffff", 0));

                ctx.beginPath();
                ctx.moveTo(topX - layerSpread * 0.3, 0);
                ctx.lineTo(topX + layerSpread * 0.3, 0);
                ctx.lineTo(topX + layerSpread * 2.8, h * 0.88);
                ctx.lineTo(topX - layerSpread * 2.3, h * 0.88);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }
        ctx.restore();
    }

    private drawCaustics(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, theme: ThemeColors): void {
        ctx.save();
        ctx.globalCompositeOperation = "screen";

        const cellSize = 45;
        const cols = Math.ceil(w / cellSize) + 1;
        const rows = Math.ceil(h * 0.9 / cellSize) + 1;
        const t = time * 0.0008;
        const baseAlpha = theme.ambientLight * 0.4;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cellSize;
                const y = r * cellSize;
                // Layered sine/cosine distortion for organic shapes
                const d1 = Math.sin(x * 0.018 + t * 1.1) * Math.cos(y * 0.02 + t * 0.7);
                const d2 = Math.sin(x * 0.025 + t * 0.6 + 2) * Math.cos(y * 0.015 + t * 1.3);
                const distort = (d1 + d2) * 0.5 + 0.5;

                if (distort > 0.55) {
                    const brightness = (distort - 0.55) * 2.2;
                    const alpha = brightness * baseAlpha;
                    // Depth fade - caustics are brighter deeper
                    const depthFade = 0.4 + (y / h) * 0.6;

                    ctx.fillStyle = `rgba(180,230,255,${alpha * depthFade})`;
                    ctx.beginPath();
                    const sx = x + Math.sin(t * 1.1 + r * 0.7) * 10;
                    const sy = y + Math.cos(t * 0.9 + c * 0.8) * 10;
                    // Diamond-ish caustic shape
                    ctx.moveTo(sx, sy - cellSize * 0.15);
                    ctx.quadraticCurveTo(sx + cellSize * 0.2, sy, sx, sy + cellSize * 0.15);
                    ctx.quadraticCurveTo(sx - cellSize * 0.2, sy, sx, sy - cellSize * 0.15);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }

    private drawSandyBottom(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors): void {
        const sandTop = h * 0.84;
        const sandHeight = h * 0.16;

        // Multi-stop sand gradient for richer look
        const grad = ctx.createLinearGradient(0, sandTop - sandHeight * 0.1, 0, h);
        grad.addColorStop(0, hexToRgba(theme.sandLight, 0));
        grad.addColorStop(0.08, theme.sandLight);
        grad.addColorStop(0.4, theme.sandLight);
        grad.addColorStop(0.7, darken(theme.sandLight, 0.15));
        grad.addColorStop(1, theme.sandDark);

        // Smooth undulating sand surface with more segments
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, sandTop);
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const x = (w / segments) * i;
            const wave1 = Math.sin(i * 0.6 + 0.5) * sandHeight * 0.06;
            const wave2 = Math.sin(i * 1.3 + 2.1) * sandHeight * 0.03;
            const waveY = sandTop + wave1 + wave2;
            if (i === 0) {
                ctx.lineTo(x, waveY);
            } else {
                const prevX = (w / segments) * (i - 1);
                ctx.quadraticCurveTo((prevX + x) / 2, waveY - sandHeight * 0.02, x, waveY);
            }
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Sand ripple patterns
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = lighten(theme.sandLight, 0.3);
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
            const y = sandTop + sandHeight * (0.2 + i * 0.06);
            ctx.beginPath();
            for (let x = 0; x <= w; x += 4) {
                const wy = y + Math.sin(x * 0.03 + i * 1.2) * 2;
                if (x === 0) ctx.moveTo(x, wy);
                else ctx.lineTo(x, wy);
            }
            ctx.stroke();
        }
        ctx.restore();

        // Sand texture - scattered grains with varying opacity
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * w;
            const y = sandTop + Math.random() * sandHeight;
            const grainSize = Math.random() * 1.8 + 0.3;
            const grainAlpha = Math.random() * 0.15 + 0.05;
            ctx.fillStyle = hexToRgba(theme.sandDark, grainAlpha);
            ctx.beginPath();
            ctx.arc(x, y, grainSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // A few lighter sparkle grains
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * w;
            const y = sandTop + Math.random() * sandHeight * 0.4;
            ctx.fillStyle = hexToRgba("#ffffff", Math.random() * 0.08 + 0.02);
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 1.2 + 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawRocks(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const sandTop = h * 0.84;

        for (const rock of this.rocks) {
            const x = rock.x * w;
            const y = sandTop + rock.y * (h - sandTop);
            const rx = rock.rx * w;
            const ry = rock.ry * h;

            // Rock shadow
            ctx.beginPath();
            ctx.ellipse(x + rx * 0.1, y + ry * 0.3, rx * 1.1, ry * 0.5, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,0,0,0.12)";
            ctx.fill();

            // Rock body with gradient
            const rockGrad = ctx.createRadialGradient(x - rx * 0.2, y - ry * 0.3, 0, x, y, rx);
            rockGrad.addColorStop(0, rock.highlight);
            rockGrad.addColorStop(0.7, rock.color);
            rockGrad.addColorStop(1, darken(rock.color, 0.2));
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = rockGrad;
            ctx.fill();

            // Specular highlight
            ctx.beginPath();
            ctx.ellipse(x - rx * 0.25, y - ry * 0.35, rx * 0.3, ry * 0.25, -0.3, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.fill();
        }
    }

    private drawShells(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const sandTop = h * 0.84;

        for (const shell of this.shells) {
            const x = shell.x * w;
            const y = sandTop + rand(2, 8);
            const s = shell.size;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(shell.rotation);

            // Simple shell: fan shape
            ctx.beginPath();
            ctx.arc(0, 0, s, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fillStyle = shell.color;
            ctx.fill();

            // Shell ridges
            ctx.strokeStyle = darken(shell.color, 0.15);
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI * 0.8 + (i + 1) * (Math.PI * 0.6 / 6);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
                ctx.stroke();
            }

            // Highlight
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.3, -Math.PI * 0.7, -Math.PI * 0.3);
            ctx.strokeStyle = hexToRgba("#ffffff", 0.25);
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }
    }

    private drawCorals(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        const sandTop = h * 0.84;

        for (const coral of this.corals) {
            const baseX = coral.x * w;
            const baseY = sandTop;
            const maxH = coral.height * (h - sandTop) * 2.5;

            // Coral base glow
            ctx.save();
            const glow = ctx.createRadialGradient(baseX, baseY, 0, baseX, baseY - maxH * 0.3, maxH * 0.8);
            glow.addColorStop(0, hexToRgba(coral.glowColor, 0.06));
            glow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(baseX - maxH, baseY - maxH, maxH * 2, maxH);
            ctx.restore();

            this.drawCoralBranch(ctx, baseX, baseY, maxH, coral.branches, coral.color, coral.glowColor, time, coral.seed, 0);
        }
    }

    private drawCoralBranch(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, height: number, branchesLeft: number,
        color: string, glowColor: string, time: number, seed: number, depth: number
    ): void {
        if (branchesLeft <= 0 || height < 4) return;

        const sway = Math.sin(time * 0.0008 + seed) * 4 * (depth + 1) * 0.25;
        const thickness = Math.max(2.5, 7 - depth * 1.5);

        const topX = x + sway;
        const topY = y - height;

        // Branch body with gradient
        const branchGrad = ctx.createLinearGradient(x, y, topX, topY);
        branchGrad.addColorStop(0, darken(color, 0.1));
        branchGrad.addColorStop(1, color);

        ctx.beginPath();
        ctx.moveTo(x - thickness / 2, y);
        ctx.quadraticCurveTo(topX - thickness / 4, y - height * 0.5, topX - thickness / 4, topY);
        ctx.lineTo(topX + thickness / 4, topY);
        ctx.quadraticCurveTo(topX + thickness / 4, y - height * 0.5, x + thickness / 2, y);
        ctx.closePath();
        ctx.fillStyle = branchGrad;
        ctx.fill();

        // Glowing bulbous tip
        ctx.beginPath();
        ctx.arc(topX, topY, thickness * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Tip highlight
        ctx.beginPath();
        ctx.arc(topX - thickness * 0.2, topY - thickness * 0.2, thickness * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(glowColor, 0.4);
        ctx.fill();

        // Sub-branches
        if (depth < 3) {
            const nextHeight = height * 0.55;
            const midY = y - height * 0.5;
            const midX = (x + topX) / 2;

            this.drawCoralBranch(ctx, midX - 3, midY, nextHeight, branchesLeft - 1, color, glowColor, time, seed + 1.3, depth + 1);
            this.drawCoralBranch(ctx, midX + 6, midY + 4, nextHeight * 0.8, branchesLeft - 2, color, glowColor, time, seed + 2.7, depth + 1);
        }
    }

    /** Floating dust/plankton particles for depth and atmosphere */
    private drawDustParticles(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        ctx.save();
        for (const p of this.dust) {
            const x = ((p.x + Math.sin(time * p.drift + p.phase) * 0.05 + time * p.speed * 0.3) % 1.1) * w;
            const y = ((p.y + Math.cos(time * p.drift * 0.7 + p.phase) * 0.03) % 0.88) * h;

            // Soft glow around particle
            const glow = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3);
            glow.addColorStop(0, `rgba(200,230,255,${p.opacity * 0.5})`);
            glow.addColorStop(1, "rgba(200,230,255,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(x - p.size * 3, y - p.size * 3, p.size * 6, p.size * 6);

            // Bright center
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220,240,255,${p.opacity})`;
            ctx.fill();
        }
        ctx.restore();
    }

    /** Water surface shimmer effect at the top */
    private drawWaterSurface(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, theme: ThemeColors): void {
        ctx.save();
        const surfaceH = h * 0.03;
        const t = time * 0.001;

        // Rippling surface gradient
        const surfGrad = ctx.createLinearGradient(0, 0, 0, surfaceH * 2);
        surfGrad.addColorStop(0, hexToRgba(lighten(theme.waterTop, 0.4), 0.35));
        surfGrad.addColorStop(0.5, hexToRgba(lighten(theme.waterTop, 0.25), 0.12));
        surfGrad.addColorStop(1, "rgba(255,255,255,0)");

        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Wavy surface line
        for (let x = 0; x <= w; x += 8) {
            const wave = Math.sin(x * 0.02 + t * 2) * 2 + Math.sin(x * 0.035 + t * 1.3) * 1.5;
            ctx.lineTo(x, wave + 2);
        }
        ctx.lineTo(w, surfaceH * 2);
        ctx.lineTo(0, surfaceH * 2);
        ctx.closePath();
        ctx.fillStyle = surfGrad;
        ctx.fill();

        // Bright sparkle spots on the surface
        ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < 15; i++) {
            const sparkleX = (Math.sin(t * 0.5 + i * 2.3) * 0.5 + 0.5) * w;
            const sparkleY = Math.sin(sparkleX * 0.02 + t * 2) * 2 + 3;
            const sparkleAlpha = (Math.sin(t * 2 + i * 1.7) * 0.5 + 0.5) * 0.3;

            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, rand(1, 3), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${sparkleAlpha})`;
            ctx.fill();
        }

        ctx.restore();
    }
}

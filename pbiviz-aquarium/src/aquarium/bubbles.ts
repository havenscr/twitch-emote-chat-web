/**
 * Bubble particle system — beautiful floating bubbles with refraction,
 * inner highlights, and subtle rainbow iridescence.
 */

import { rand, hexToRgba } from "./utils";

interface Bubble {
    x: number;
    y: number;
    radius: number;
    speed: number;
    wobbleOffset: number;
    wobbleSpeed: number;
    wobbleAmplitude: number;
    opacity: number;
    hueShift: number; // subtle iridescent color shift
}

export class BubbleSystem {
    private bubbles: Bubble[] = [];
    private maxBubbles = 40;

    /** Reset and create initial bubbles */
    init(w: number, h: number): void {
        this.bubbles = [];
        for (let i = 0; i < this.maxBubbles; i++) {
            this.bubbles.push(this.createBubble(w, h, true));
        }
    }

    private createBubble(w: number, h: number, randomY: boolean): Bubble {
        const radius = rand(1.5, 8);
        return {
            x: rand(w * 0.03, w * 0.97),
            y: randomY ? rand(h * 0.1, h * 0.95) : h + rand(0, 30),
            radius,
            speed: rand(0.2, 0.8) + (8 - radius) * 0.05, // smaller = slightly faster
            wobbleOffset: rand(0, Math.PI * 2),
            wobbleSpeed: rand(1.2, 3.0),
            wobbleAmplitude: rand(0.3, 1.2),
            opacity: rand(0.2, 0.6),
            hueShift: rand(0, 360),
        };
    }

    /** Update bubble positions */
    update(w: number, h: number, dt: number, time: number): void {
        for (let i = 0; i < this.bubbles.length; i++) {
            const b = this.bubbles[i];
            b.y -= b.speed * dt * 0.05;
            b.x += Math.sin(time * 0.001 * b.wobbleSpeed + b.wobbleOffset) * b.wobbleAmplitude;

            // Slight size oscillation (pressure effect)
            // handled in render via time

            if (b.y + b.radius < -10) {
                this.bubbles[i] = this.createBubble(w, h, false);
            }
        }
    }

    /** Render all bubbles with beautiful refraction effects */
    render(ctx: CanvasRenderingContext2D): void {
        for (const b of this.bubbles) {
            this.drawBubble(ctx, b);
        }
    }

    private drawBubble(ctx: CanvasRenderingContext2D, b: Bubble): void {
        ctx.save();

        const r = b.radius;

        // Outer glow
        if (r > 3) {
            const outerGlow = ctx.createRadialGradient(b.x, b.y, r, b.x, b.y, r * 2);
            outerGlow.addColorStop(0, `rgba(180,220,255,${b.opacity * 0.08})`);
            outerGlow.addColorStop(1, "rgba(180,220,255,0)");
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(b.x, b.y, r * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main bubble body — radial gradient from transparent center to edge
        const bodyGrad = ctx.createRadialGradient(
            b.x - r * 0.15, b.y - r * 0.15, r * 0.1,
            b.x, b.y, r
        );
        bodyGrad.addColorStop(0, `rgba(220,240,255,${b.opacity * 0.05})`);
        bodyGrad.addColorStop(0.7, `rgba(200,230,255,${b.opacity * 0.15})`);
        bodyGrad.addColorStop(0.9, `rgba(180,220,255,${b.opacity * 0.35})`);
        bodyGrad.addColorStop(1, `rgba(160,210,255,${b.opacity * 0.1})`);

        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Edge ring
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,230,255,${b.opacity * 0.5})`;
        ctx.lineWidth = r > 4 ? 0.8 : 0.4;
        ctx.stroke();

        // Primary specular highlight (upper-left)
        if (r > 2) {
            const hlX = b.x - r * 0.3;
            const hlY = b.y - r * 0.3;
            const hlR = r * 0.35;
            const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
            hlGrad.addColorStop(0, `rgba(255,255,255,${b.opacity * 0.9})`);
            hlGrad.addColorStop(0.5, `rgba(255,255,255,${b.opacity * 0.3})`);
            hlGrad.addColorStop(1, "rgba(255,255,255,0)");
            ctx.beginPath();
            ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
            ctx.fillStyle = hlGrad;
            ctx.fill();
        }

        // Secondary smaller highlight (lower-right, refraction)
        if (r > 3.5) {
            const hl2X = b.x + r * 0.2;
            const hl2Y = b.y + r * 0.25;
            const hl2R = r * 0.15;
            ctx.beginPath();
            ctx.arc(hl2X, hl2Y, hl2R, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.35})`;
            ctx.fill();
        }

        // Subtle iridescent arc (rainbow sheen on large bubbles)
        if (r > 5) {
            ctx.save();
            ctx.globalAlpha = b.opacity * 0.15;
            ctx.globalCompositeOperation = "screen";
            ctx.beginPath();
            ctx.arc(b.x, b.y, r * 0.85, Math.PI * 1.1, Math.PI * 1.7);
            ctx.lineWidth = r * 0.12;
            // Use HSL for iridescent color
            ctx.strokeStyle = `hsl(${b.hueShift}, 60%, 70%)`;
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}

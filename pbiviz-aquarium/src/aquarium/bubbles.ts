/**
 * Bubble particle system — floating bubbles rising from the bottom.
 */

import { rand } from "./utils";

interface Bubble {
    x: number;
    y: number;
    radius: number;
    speed: number;
    wobbleOffset: number;
    wobbleSpeed: number;
    opacity: number;
}

export class BubbleSystem {
    private bubbles: Bubble[] = [];
    private maxBubbles = 30;

    /** Reset and create initial bubbles spread across the canvas */
    init(w: number, h: number): void {
        this.bubbles = [];
        for (let i = 0; i < this.maxBubbles; i++) {
            this.bubbles.push(this.createBubble(w, h, true));
        }
    }

    private createBubble(w: number, h: number, randomY: boolean): Bubble {
        return {
            x: rand(w * 0.05, w * 0.95),
            y: randomY ? rand(h * 0.1, h * 0.95) : h + rand(0, 20),
            radius: rand(1.5, 6),
            speed: rand(0.3, 1.2),
            wobbleOffset: rand(0, Math.PI * 2),
            wobbleSpeed: rand(1.5, 3.5),
            opacity: rand(0.15, 0.5),
        };
    }

    /** Update bubble positions */
    update(w: number, h: number, dt: number, time: number): void {
        for (let i = 0; i < this.bubbles.length; i++) {
            const b = this.bubbles[i];
            b.y -= b.speed * dt * 0.06;
            b.x += Math.sin(time * 0.001 * b.wobbleSpeed + b.wobbleOffset) * 0.3;

            // Respawn at bottom when off top
            if (b.y + b.radius < 0) {
                this.bubbles[i] = this.createBubble(w, h, false);
            }
        }
    }

    /** Render all bubbles */
    render(ctx: CanvasRenderingContext2D): void {
        for (const b of this.bubbles) {
            ctx.save();

            // Main bubble circle
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 230, 255, ${b.opacity * 0.3})`;
            ctx.fill();

            // Bubble outline
            ctx.strokeStyle = `rgba(220, 240, 255, ${b.opacity * 0.6})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Highlight spot (upper-left)
            if (b.radius > 2) {
                ctx.beginPath();
                ctx.arc(
                    b.x - b.radius * 0.25,
                    b.y - b.radius * 0.25,
                    b.radius * 0.25,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.8})`;
                ctx.fill();
            }

            ctx.restore();
        }
    }
}

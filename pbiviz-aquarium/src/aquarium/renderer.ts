/**
 * Aquarium Renderer — orchestrates all visual layers on a single Canvas.
 * Manages the animation loop, resize handling, and layer rendering order.
 */

import { Background } from "./background";
import { BubbleSystem } from "./bubbles";
import { Seaweed } from "./seaweed";
import { Fish, FishData } from "./fish";
import { THEMES, ThemeColors } from "./utils";

export interface AquariumSettings {
    theme: string;
    showBubbles: boolean;
    animationSpeed: number;
    showOutline: boolean;
    showLabels: boolean;
    labelFontSize: number;
    labelFontColor: string;
}

const DEFAULT_SETTINGS: AquariumSettings = {
    theme: "coralReef",
    showBubbles: true,
    animationSpeed: 5,
    showOutline: true,
    showLabels: true,
    labelFontSize: 11,
    labelFontColor: "#ffffff",
};

export class AquariumRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private background: Background;
    private bubbles: BubbleSystem;
    private seaweed: Seaweed;
    private fish: Fish[] = [];
    private settings: AquariumSettings = { ...DEFAULT_SETTINGS };
    private animFrameId: number | null = null;
    private lastTime = 0;
    private startTime = 0;
    private running = false;
    private width = 0;
    private height = 0;
    private needsScatter = false;
    private sizeInitialized = false;
    private lastScatterTime = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.background = new Background();
        this.bubbles = new BubbleSystem();
        this.seaweed = new Seaweed();
    }

    start(): void {
        if (this.running) return;
        this.running = true;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.loop(this.startTime);
    }

    stop(): void {
        this.running = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    resize(width: number, height: number): void {
        if (width <= 0 || height <= 0) return;

        const dpr = window.devicePixelRatio || 1;
        this.width = width;
        this.height = height;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.bubbles.init(width, height);
        this.seaweed.init();
        this.background.init();

        // If we have fish but haven't scattered them into valid bounds yet, do it now
        if (!this.sizeInitialized && this.fish.length > 0) {
            this.needsScatter = true;
        }
        this.sizeInitialized = true;

        // Update fish bounds
        for (const f of this.fish) {
            f.setBounds(width, height);
        }
    }

    setData(fishData: FishData[]): void {
        const existingMap = new Map<string, Fish>();
        for (const f of this.fish) {
            existingMap.set(f.label, f);
        }

        const newFish: Fish[] = [];
        let hasNew = false;
        for (const d of fishData) {
            const existing = existingMap.get(d.label);
            if (existing) {
                existing.updateData(d);
                newFish.push(existing);
                existingMap.delete(d.label);
            } else {
                newFish.push(new Fish(d, this.width, this.height));
                hasNew = true;
            }
        }
        this.fish = newFish;

        // If new fish were created and we have valid dimensions, scatter them
        // If dimensions aren't valid yet, flag for scatter on next frame
        if (hasNew) {
            if (this.width > 1 && this.height > 1) {
                for (const f of this.fish) {
                    // Only scatter fish that are in bad positions (near origin)
                    if (f.x < f.size * 3 && f.y < f.size * 3) {
                        f.scatter(this.width, this.height);
                    }
                }
            } else {
                this.needsScatter = true;
            }
        }
    }

    setSettings(settings: Partial<AquariumSettings>): void {
        const prevTheme = this.settings.theme;
        this.settings = { ...this.settings, ...settings };
        if (settings.theme && settings.theme !== prevTheme) {
            this.background.init();
        }
    }

    getFishAt(x: number, y: number): Fish | null {
        for (let i = this.fish.length - 1; i >= 0; i--) {
            if (this.fish[i].hitTest(x, y)) {
                return this.fish[i];
            }
        }
        return null;
    }

    clearHover(): void {
        for (const f of this.fish) f.hovered = false;
    }

    setHover(fish: Fish | null): void {
        for (const f of this.fish) f.hovered = f === fish;
    }

    clearSelection(): void {
        for (const f of this.fish) f.selected = false;
    }

    setSelection(fish: Fish | null): void {
        for (const f of this.fish) f.selected = f === fish;
    }

    /** Main animation loop */
    private loop = (now: number): void => {
        if (!this.running) return;

        try {
            const dt = Math.min(now - this.lastTime, 50);
            this.lastTime = now;
            const time = now - this.startTime;

            this.update(dt, time);
            this.render(time);
        } catch (e) {
            // Swallow rendering errors so the loop never dies
            console.warn("Aquarium render error:", e);
        }

        this.animFrameId = requestAnimationFrame(this.loop);
    };

    private update(dt: number, time: number): void {
        const w = this.width;
        const h = this.height;

        // Self-healing: scatter fish that need repositioning once we have valid dimensions
        if (this.needsScatter && w > 1 && h > 1 && this.fish.length > 0) {
            for (const f of this.fish) {
                f.scatter(w, h);
            }
            this.needsScatter = false;
        }

        // Additional self-healing: detect fish with NaN or fully out of bounds
        // Only scatter once per second max to avoid re-scatter loops
        const now = performance.now();
        if (w > 100 && h > 100 && this.fish.length > 0 && now - this.lastScatterTime > 1000) {
            let badCount = 0;
            for (const f of this.fish) {
                const hasNaN = isNaN(f.x) || isNaN(f.y);
                const outOfBounds = f.x <= 0 || f.y <= 0 || f.x >= w || f.y >= h;
                if (hasNaN || outOfBounds) badCount++;
            }
            if (badCount > this.fish.length * 0.5) {
                for (const f of this.fish) {
                    f.scatter(w, h);
                }
                this.lastScatterTime = now;
            }
        }

        const speedMul = this.settings.animationSpeed / 5;
        for (const f of this.fish) {
            f.update(dt, time, speedMul);
        }

        if (this.settings.showBubbles) {
            this.bubbles.update(w, h, dt, time);
        }
    }

    private render(time: number): void {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        if (w === 0 || h === 0) return;

        const theme: ThemeColors = THEMES[this.settings.theme] || THEMES.coralReef;
        const hasSelection = this.fish.some(f => f.selected);

        ctx.clearRect(0, 0, w, h);

        // Layer 1: Background
        this.background.render(ctx, w, h, time, theme);

        // Layer 2: Seaweed
        this.seaweed.render(ctx, w, h, time);

        // Layer 3: Fish
        for (const f of this.fish) {
            if (hasSelection && !f.selected && !f.hovered) {
                ctx.save();
                ctx.globalAlpha = 0.35;
                f.render(ctx, this.settings.showOutline);
                ctx.restore();
            } else {
                f.render(ctx, this.settings.showOutline);
            }
        }

        // Layer 4: Labels
        if (this.settings.showLabels) {
            for (const f of this.fish) {
                if (hasSelection && !f.selected && !f.hovered) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    f.renderLabel(ctx, this.settings.labelFontSize, this.settings.labelFontColor);
                    ctx.restore();
                } else {
                    f.renderLabel(ctx, this.settings.labelFontSize, this.settings.labelFontColor);
                }
            }
        }

        // Layer 5: Bubbles
        if (this.settings.showBubbles) {
            this.bubbles.render(ctx);
        }

        // Layer 6: Vignette
        this.drawVignette(ctx, w, h);
    }

    private drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const cx = w * 0.5;
        const cy = h * 0.5;
        const r = Math.max(w, h) * 0.7;
        const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.25)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    destroy(): void {
        this.stop();
        this.fish = [];
    }
}

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
    theme: string;          // "coralReef" | "deepOcean" | "clearWater"
    showBubbles: boolean;
    animationSpeed: number; // 1..10
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

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.background = new Background();
        this.bubbles = new BubbleSystem();
        this.seaweed = new Seaweed();
    }

    /** Start the animation loop */
    start(): void {
        if (this.running) return;
        this.running = true;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.loop(this.startTime);
    }

    /** Stop the animation loop */
    stop(): void {
        this.running = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    /** Update canvas size (call from Power BI update when viewport changes) */
    resize(width: number, height: number): void {
        const dpr = window.devicePixelRatio || 1;
        this.width = width;
        this.height = height;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Reinitialize particles for new size
        this.bubbles.init(width, height);
        this.seaweed.init();
        this.background.init();

        // Update fish bounds
        for (const f of this.fish) {
            f.setBounds(width, height);
        }
    }

    /** Update fish data from Power BI dataView */
    setData(fishData: FishData[]): void {
        const existingMap = new Map<string, Fish>();
        for (const f of this.fish) {
            existingMap.set(f.label, f);
        }

        const newFish: Fish[] = [];
        for (const d of fishData) {
            const existing = existingMap.get(d.label);
            if (existing) {
                // Preserve position, update data
                existing.updateData(d);
                newFish.push(existing);
                existingMap.delete(d.label);
            } else {
                // New fish
                newFish.push(new Fish(d, this.width, this.height));
            }
        }
        this.fish = newFish;
    }

    /** Update rendering settings */
    setSettings(settings: Partial<AquariumSettings>): void {
        const prevTheme = this.settings.theme;
        this.settings = { ...this.settings, ...settings };

        // Re-init background if theme changed
        if (settings.theme && settings.theme !== prevTheme) {
            this.background.init();
        }
    }

    /** Get fish at canvas coordinates (for click/hover) */
    getFishAt(x: number, y: number): Fish | null {
        // Check in reverse order (top-most fish first)
        for (let i = this.fish.length - 1; i >= 0; i--) {
            if (this.fish[i].hitTest(x, y)) {
                return this.fish[i];
            }
        }
        return null;
    }

    /** Clear all hover states */
    clearHover(): void {
        for (const f of this.fish) {
            f.hovered = false;
        }
    }

    /** Set hover state for a specific fish */
    setHover(fish: Fish | null): void {
        for (const f of this.fish) {
            f.hovered = f === fish;
        }
    }

    /** Clear all selection states */
    clearSelection(): void {
        for (const f of this.fish) {
            f.selected = false;
        }
    }

    /** Set selection state */
    setSelection(fish: Fish | null): void {
        for (const f of this.fish) {
            f.selected = f === fish;
        }
    }

    /** Main animation loop */
    private loop = (now: number): void => {
        if (!this.running) return;

        const dt = Math.min(now - this.lastTime, 50); // cap at 50ms to prevent jumps
        this.lastTime = now;
        const time = now - this.startTime;

        this.update(dt, time);
        this.render(time);

        this.animFrameId = requestAnimationFrame(this.loop);
    };

    private update(dt: number, time: number): void {
        const speedMul = this.settings.animationSpeed / 5;

        // Update fish
        for (const f of this.fish) {
            f.update(dt, time, speedMul);
        }

        // Update bubbles
        if (this.settings.showBubbles) {
            this.bubbles.update(this.width, this.height, dt, time);
        }
    }

    private render(time: number): void {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        if (w === 0 || h === 0) return;

        const theme: ThemeColors = THEMES[this.settings.theme] || THEMES.coralReef;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Layer 1: Background (water, rays, caustics, sand, rocks, coral)
        this.background.render(ctx, w, h, time, theme);

        // Layer 2: Seaweed (behind fish)
        this.seaweed.render(ctx, w, h, time);

        // Layer 3: Fish
        for (const f of this.fish) {
            f.render(ctx, this.settings.showOutline);
        }

        // Layer 4: Labels (on top of fish)
        if (this.settings.showLabels) {
            for (const f of this.fish) {
                f.renderLabel(ctx, this.settings.labelFontSize, this.settings.labelFontColor);
            }
        }

        // Layer 5: Bubbles (on top of everything)
        if (this.settings.showBubbles) {
            this.bubbles.render(ctx);
        }
    }

    /** Destroy and clean up */
    destroy(): void {
        this.stop();
        this.fish = [];
    }
}

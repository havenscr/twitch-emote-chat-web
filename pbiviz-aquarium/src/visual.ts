/**
 * Aquarium Power BI Custom Visual
 *
 * Main visual class implementing IVisual.
 * Maps categorical data to animated fish swimming in an aquarium.
 */

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import ITooltipService = powerbi.extensibility.ITooltipService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import { AquariumRenderer } from "./aquarium/renderer";
import { FishData } from "./aquarium/fish";
import { COLOR_PALETTES } from "./aquarium/utils";
import { AquariumFormattingSettings } from "./settings";

import "../style/visual.less";

export class Visual implements IVisual {
    private host: IVisualHost;
    private container: HTMLDivElement;
    private canvas: HTMLCanvasElement;
    private renderer: AquariumRenderer;
    private selectionManager: ISelectionManager;
    private tooltipService: ITooltipService;
    private formattingSettings: AquariumFormattingSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionIds: Map<string, ISelectionId> = new Map();

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.tooltipService = this.host.tooltipService;
        this.formattingSettings = new AquariumFormattingSettings();
        this.formattingSettingsService = new FormattingSettingsService();

        // Create container and canvas
        this.container = document.createElement("div");
        this.container.className = "aquarium-container";
        options.element.appendChild(this.container);

        this.canvas = document.createElement("canvas");
        this.container.appendChild(this.canvas);

        // Create renderer
        this.renderer = new AquariumRenderer(this.canvas);

        // Set up interaction handlers
        this.setupInteraction();

        // Start animation
        this.renderer.start();
    }

    public update(options: VisualUpdateOptions): void {
        // Parse formatting settings
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            AquariumFormattingSettings,
            options.dataViews?.[0]
        );

        // Update renderer settings
        const aqSettings = this.formattingSettings.aquariumSettings;
        const fishSettings = this.formattingSettings.fishSettings;
        const labelSettings = this.formattingSettings.labelSettings;

        this.renderer.setSettings({
            theme: aqSettings.theme.value?.value as string || "coralReef",
            showBubbles: aqSettings.showBubbles.value,
            animationSpeed: aqSettings.animationSpeed.value,
            showOutline: fishSettings.showOutline.value,
            showLabels: labelSettings.showLabels.value,
            labelFontSize: labelSettings.fontSize.value,
            labelFontColor: labelSettings.fontColor.value?.value || "#ffffff",
        });

        // Handle resize
        const viewport = options.viewport;
        this.renderer.resize(viewport.width, viewport.height);

        // Parse data
        const dataView = options.dataViews?.[0];
        if (!dataView?.categorical?.categories?.[0]) {
            this.renderer.setData([]);
            return;
        }

        const categorical = dataView.categorical;
        const categories = categorical.categories[0];
        const values = categorical.values;

        const measureValues = values?.[0]?.values || [];
        const measure2Values = values?.[1]?.values || [];

        // Get color palette
        const paletteName = fishSettings.colorPalette.value?.value as string || "tropical";
        const palette = COLOR_PALETTES[paletteName] || COLOR_PALETTES.tropical;

        // Calculate size scaling
        const minSize = fishSettings.minFishSize.value;
        const maxSize = fishSettings.maxFishSize.value;
        const measureNums = measureValues.map((v) => Number(v) || 0);
        const dataMin = Math.min(...measureNums);
        const dataMax = Math.max(...measureNums);
        const dataRange = dataMax - dataMin || 1;

        // Normalize measure2 for speed
        const measure2Nums = measure2Values.map((v) => Number(v) || 1);
        const m2Min = Math.min(...measure2Nums);
        const m2Max = Math.max(...measure2Nums);
        const m2Range = m2Max - m2Min || 1;

        // Build fish data
        const fishData: FishData[] = [];
        this.selectionIds.clear();

        for (let i = 0; i < categories.values.length; i++) {
            const label = String(categories.values[i] ?? `Item ${i + 1}`);
            const value = measureNums[i] ?? 0;
            const value2Raw = measure2Nums[i] ?? 1;
            const normalizedSize = minSize + ((value - dataMin) / dataRange) * (maxSize - minSize);
            const normalizedSpeed = 0.3 + ((value2Raw - m2Min) / m2Range) * 1.7;

            // Create selection ID
            const selectionId = this.host.createSelectionIdBuilder()
                .withCategory(categories, i)
                .createSelectionId();
            this.selectionIds.set(label, selectionId);

            fishData.push({
                label,
                value,
                value2: normalizedSpeed,
                color: palette[i % palette.length],
                species: i % 6,
                size: normalizedSize,
                selectionId,
            });
        }

        this.renderer.setData(fishData);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    public destroy(): void {
        this.renderer.destroy();
    }

    private setupInteraction(): void {
        // Click for cross-filtering
        this.canvas.addEventListener("click", (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const fish = this.renderer.getFishAt(x, y);
            if (fish && fish.selectionId) {
                this.selectionManager.select(fish.selectionId as ISelectionId).then(() => {
                    this.renderer.clearSelection();
                    this.renderer.setSelection(fish);
                });
            } else {
                this.selectionManager.clear().then(() => {
                    this.renderer.clearSelection();
                });
            }
        });

        // Mouse move for hover/tooltips
        this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const fish = this.renderer.getFishAt(x, y);
            this.renderer.clearHover();

            if (fish) {
                this.renderer.setHover(fish);
                this.canvas.style.cursor = "pointer";

                // Show tooltip
                const tooltipData: VisualTooltipDataItem[] = [
                    {
                        displayName: "Category",
                        value: fish.label,
                    },
                    {
                        displayName: "Value",
                        value: fish.value.toLocaleString(),
                    },
                ];

                this.tooltipService.show({
                    coordinates: [e.clientX, e.clientY],
                    isTouchEvent: false,
                    dataItems: tooltipData,
                    identities: [],
                });
            } else {
                this.canvas.style.cursor = "default";
                this.tooltipService.hide({
                    immediately: true,
                    isTouchEvent: false,
                });
            }
        });

        // Mouse leave to hide tooltips
        this.canvas.addEventListener("mouseleave", () => {
            this.renderer.clearHover();
            this.canvas.style.cursor = "default";
            this.tooltipService.hide({
                immediately: true,
                isTouchEvent: false,
            });
        });
    }
}

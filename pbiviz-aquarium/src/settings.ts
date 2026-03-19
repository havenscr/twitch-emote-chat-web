/**
 * Power BI formatting settings for the Aquarium visual.
 * Defines the formatting pane cards and properties.
 */

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/** Aquarium environment settings card */
export class AquariumSettingsCard extends FormattingSettingsCard {
    theme = new formattingSettings.ItemDropdown({
        name: "theme",
        displayName: "Theme",
        items: [
            { value: "coralReef", displayName: "Coral Reef" },
            { value: "deepOcean", displayName: "Deep Ocean" },
            { value: "clearWater", displayName: "Clear Water" },
        ],
        value: { value: "coralReef", displayName: "Coral Reef" },
    });

    showBubbles = new formattingSettings.ToggleSwitch({
        name: "showBubbles",
        displayName: "Show Bubbles",
        value: true,
    });

    animationSpeed = new formattingSettings.NumUpDown({
        name: "animationSpeed",
        displayName: "Animation Speed",
        value: 5,
    });

    name = "aquariumSettings";
    displayName = "Aquarium";
    slices: FormattingSettingsSlice[] = [this.theme, this.showBubbles, this.animationSpeed];
}

/** Fish appearance settings card */
export class FishSettingsCard extends FormattingSettingsCard {
    colorPalette = new formattingSettings.ItemDropdown({
        name: "colorPalette",
        displayName: "Color Palette",
        items: [
            { value: "tropical", displayName: "Tropical" },
            { value: "ocean", displayName: "Ocean" },
            { value: "warm", displayName: "Warm" },
            { value: "cool", displayName: "Cool" },
        ],
        value: { value: "tropical", displayName: "Tropical" },
    });

    showOutline = new formattingSettings.ToggleSwitch({
        name: "showOutline",
        displayName: "Show Outline",
        value: true,
    });

    minFishSize = new formattingSettings.NumUpDown({
        name: "minFishSize",
        displayName: "Minimum Fish Size",
        value: 25,
    });

    maxFishSize = new formattingSettings.NumUpDown({
        name: "maxFishSize",
        displayName: "Maximum Fish Size",
        value: 80,
    });

    name = "fishSettings";
    displayName = "Fish";
    slices: FormattingSettingsSlice[] = [this.colorPalette, this.showOutline, this.minFishSize, this.maxFishSize];
}

/** Label settings card */
export class LabelSettingsCard extends FormattingSettingsCard {
    showLabels = new formattingSettings.ToggleSwitch({
        name: "showLabels",
        displayName: "Show Labels",
        value: true,
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font Size",
        value: 11,
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font Color",
        value: { value: "#ffffff" },
    });

    name = "labelSettings";
    displayName = "Labels";
    slices: FormattingSettingsSlice[] = [this.showLabels, this.fontSize, this.fontColor];
}

/** Top-level formatting settings model */
export class AquariumFormattingSettings extends FormattingSettingsModel {
    aquariumSettings = new AquariumSettingsCard();
    fishSettings = new FishSettingsCard();
    labelSettings = new LabelSettingsCard();

    cards: FormattingSettingsCard[] = [this.aquariumSettings, this.fishSettings, this.labelSettings];
}

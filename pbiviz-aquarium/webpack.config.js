const path = require("path");
const fs = require("fs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Read pbiviz.json for visual metadata
const pbivizJson = JSON.parse(fs.readFileSync(path.join(__dirname, "pbiviz.json"), "utf8"));
const capabilities = JSON.parse(fs.readFileSync(path.join(__dirname, "capabilities.json"), "utf8"));

module.exports = {
    entry: {
        "visual.js": path.join(__dirname, "src", "visual.ts"),
    },
    output: {
        path: path.join(__dirname, ".tmp", "drop"),
        filename: "[name]",
        library: pbivizJson.visual.guid,
        libraryTarget: "var",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    externals: {
        "powerbi-visuals-api": "null",
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.less$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "less-loader",
                ],
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                ],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "visual.css",
        }),
    ],
    devtool: "source-map",
    mode: "production",
};

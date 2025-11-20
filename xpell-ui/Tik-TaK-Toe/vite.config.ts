import { defineConfig } from "vite";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function inlineSingleHtml() {
    let outDir = "dist";

    return {
        name: "inline-single-html",
        apply: "build",
        configResolved(config) {
            outDir = config.build.outDir;
        },
        closeBundle() {
            const indexPath = resolve(outDir, "index.html");
            if (!existsSync(indexPath)) {
                return;
            }

            const readAsset = (assetPath: string) => {
                const normalized = assetPath.replace(/^\//, "");
                const filePath = resolve(outDir, normalized);
                if (!existsSync(filePath)) {
                    return null;
                }
                return readFileSync(filePath, "utf-8");
            };

            let html = readFileSync(indexPath, "utf-8");

            html = html.replace(
                /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
                (original, href) => {
                    const css = readAsset(href);
                    if (!css) {
                        return original;
                    }
                    return `<style>${css}</style>`;
                }
            );

            html = html.replace(
                /<script\s+([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi,
                (original, pre, src, post) => {
                    const js = readAsset(src);
                    if (!js) {
                        return original;
                    }
                    const attrs = [pre.trim(), post.trim()].filter(Boolean).join(" ");
                    const open = attrs ? `<script ${attrs}>` : "<script>";
                    return `${open}${js}</script>`;
                }
            );

            writeFileSync(indexPath, html, "utf-8");

            // Clean up generated assets to leave a single-file build output.
            rmSync(resolve(outDir, "assets"), { recursive: true, force: true });
        }
    };
}

export default defineConfig({
    build: {
        cssCodeSplit: false,
        assetsInlineLimit: 256 * 1024, // inline small assets into the bundle
        rollupOptions: {
            output: {
                manualChunks: () => "app" // force a single JS chunk
            }
        }
    },
    plugins: [inlineSingleHtml()]
});

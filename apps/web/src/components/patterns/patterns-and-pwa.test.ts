import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Compositions, Patterns & PWA Baseline Compliance (Fase 1c)", () => {
  it("enforces semantic tokens without hardcoded palette classes in compositions/ and patterns/", () => {
    const dirs = [
      path.resolve(process.cwd(), "src/components/compositions"),
      path.resolve(process.cwd(), "src/components/patterns"),
    ];

    const forbiddenPalette =
      /\b(bg|text|border)-(slate|gray|zinc|neutral|stone|emerald|teal|amber|blue|purple|red|rose)-\d{2,3}\b/;

    for (const dir of dirs) {
      const files = readdirSync(dir).filter((f) => f.endsWith(".tsx"));
      expect(files.length).toBeGreaterThan(0);

      for (const file of files) {
        const src = readFileSync(path.join(dir, file), "utf-8");
        expect(src, `Hardcoded palette found in ${file}`).not.toMatch(
          forbiddenPalette
        );
      }
    }
  });

  it("enforces DataTable mobile recomposition (< 768px list) and WorkflowProgress 375px stacking", () => {
    const dataTableSrc = readFileSync(
      path.resolve(process.cwd(), "src/components/patterns/data-table.tsx"),
      "utf-8"
    );
    expect(dataTableSrc).toMatch(/renderMobileRow:\s*\(row:\s*T\)/);
    expect(dataTableSrc).toContain("md:hidden");
    expect(dataTableSrc).toContain("hidden md:block");

    const workflowSrc = readFileSync(
      path.resolve(
        process.cwd(),
        "src/components/patterns/workflow-progress.tsx"
      ),
      "utf-8"
    );
    expect(workflowSrc).toContain("grid-cols-1");
  });

  it("provides a valid installable PWA manifest and offline shell Service Worker", () => {
    const manifestRaw = readFileSync(
      path.resolve(process.cwd(), "public/manifest.webmanifest"),
      "utf-8"
    );
    const manifest = JSON.parse(manifestRaw) as {
      display: string;
      theme_color: string;
      background_color: string;
      icons: unknown[];
      shortcuts: unknown[];
    };

    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#1F6650");
    expect(manifest.background_color).toBe("#F7F8F4");
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.shortcuts.length).toBeGreaterThan(0);

    const swSrc = readFileSync(
      path.resolve(process.cwd(), "public/sw.js"),
      "utf-8"
    );
    expect(swSrc).toContain("/offline");
    expect(swSrc).toContain("SKIP_WAITING");
  });
});


import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_WORKSPACE_NAV } from "@/components/layout/app-shell";

describe("UI Primitives & Layout Shell Design System Compliance (Fase 1b)", () => {
  it("uses only canonical Indonesian Title Case labels in DEFAULT_WORKSPACE_NAV", () => {
    const allLabels = DEFAULT_WORKSPACE_NAV.flatMap((g) => [
      g.title ?? "",
      ...g.items.map((i) => i.label),
    ]);

    const joined = allLabels.join(" | ");
    expect(joined).toContain("Dashboard");
    expect(joined).toContain("Peserta Didik");
    expect(joined).toContain("Kehadiran");
    expect(joined).toContain("Perkembangan Peserta");
    expect(joined).toContain("Jejak Audit");
    expect(joined).toContain("Administrasi");

    // Forbidden legacy / non-canonical terms (10 §24)
    expect(joined).not.toMatch(/\b(Siswa|Rombel|Guru|Audit Trail|Overview|Programs|Content|Reports|Administration)\b/i);
  });

  it("enforces semantic tokens without hardcoded palette classes in ui/ and layout/", () => {
    const dirs = [
      path.resolve(process.cwd(), "src/components/ui"),
      path.resolve(process.cwd(), "src/components/layout"),
    ];

    const forbiddenPalette = /\b(bg|text|border)-(slate|gray|zinc|neutral|stone|emerald|teal|amber|blue|purple|red|rose)-\d{2,3}\b/;

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
});


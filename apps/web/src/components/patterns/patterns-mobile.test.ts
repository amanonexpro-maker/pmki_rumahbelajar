import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Mobile-First Primitives Guardrails (Fase 19 Step 2 - P3)", () => {
  const patternsDir = path.resolve(process.cwd(), "src/components/patterns");
  const dashboardPath = path.resolve(
    process.cwd(),
    "src/features/organization/components/contextual-dashboard-view.tsx"
  );
  const summaryStripPath = path.join(patternsDir, "summary-strip.tsx");
  const mobileCardListPath = path.join(patternsDir, "mobile-card-list.tsx");
  const patternsIndexPath = path.join(patternsDir, "index.ts");
  const dataTablePath = path.join(patternsDir, "data-table.tsx");

  it("1. verifies summary-strip.tsx contains snap-x, snap-mandatory, and min-w-[78%] via real class candidate string", () => {
    const content = readFileSync(summaryStripPath, "utf-8");
    const snapScrollMatch = content.match(/"([^"\n]*snap-x[^"\n]*)"/);
    expect(snapScrollMatch).not.toBeNull();
    if (snapScrollMatch) {
      expect(snapScrollMatch[1]).toContain("snap-x");
      expect(snapScrollMatch[1]).toContain("snap-mandatory");
      expect(snapScrollMatch[1]).toContain("overflow-x-auto");
    }

    const itemCardMatch = content.match(/"([^"\n]*min-w-\[78%\][^"\n]*)"/);
    expect(itemCardMatch).not.toBeNull();
    if (itemCardMatch) {
      expect(itemCardMatch[1]).toContain("snap-start");
      expect(itemCardMatch[1]).toContain("min-w-[78%]");
      expect(itemCardMatch[1]).toContain("sm:min-w-0");
    }
  });

  it("2. verifies summary-strip.tsx contains sm:grid-cols-2, lg:grid-cols-4, and sm:divide-x", () => {
    const content = readFileSync(summaryStripPath, "utf-8");
    expect(content).toContain("sm:grid-cols-2");
    expect(content).toContain("lg:grid-cols-4");
    expect(content).toContain("sm:divide-x");
    expect(content).toContain("sm:divide-border");
  });

  it("3. verifies summary-strip.tsx uses type-h1 and avoids text-2xl or arbitrary text-[...]", () => {
    const content = readFileSync(summaryStripPath, "utf-8");
    expect(content).toContain("type-h1");
    expect(content).toContain("tabular-nums");
    expect(content).not.toContain("text-2xl");
    expect(content).not.toMatch(/text-\[\d+px\]/);
  });

  it("4. verifies summary-strip.tsx is server-safe without use client directive", () => {
    const content = readFileSync(summaryStripPath, "utf-8");
    expect(content).not.toContain('"use client"');
    expect(content).not.toContain("'use client'");
  });

  it("5. verifies mobile-card-list.tsx renders presentational root div and avoids list/table tags or overflow-x-auto", () => {
    const content = readFileSync(mobileCardListPath, "utf-8");
    expect(content).toMatch(/<div\s+className=\{cn\("space-y-2"/);
    expect(content).not.toMatch(/<ul[\s>]/);
    expect(content).not.toMatch(/<li[\s>]/);
    expect(content).not.toMatch(/role=["']list["']/);
    expect(content).not.toMatch(/<table[\s>]/);
    expect(content).not.toMatch(/<th[\s>]/);
    expect(content).not.toMatch(/<td[\s>]/);
    expect(content).not.toContain("overflow-x-auto");
  });

  it("6. verifies both mobile pattern files avoid direct lucide-react imports", () => {
    const summaryContent = readFileSync(summaryStripPath, "utf-8");
    const mobileCardContent = readFileSync(mobileCardListPath, "utf-8");
    expect(summaryContent).not.toMatch(/from\s+["']lucide-react["']/);
    expect(mobileCardContent).not.toMatch(/from\s+["']lucide-react["']/);
  });

  it("7. verifies both mobile pattern files avoid rounded-full, shadow-md, shadow-lg, and hardcoded palette classes", () => {
    const summaryContent = readFileSync(summaryStripPath, "utf-8");
    const mobileCardContent = readFileSync(mobileCardListPath, "utf-8");
    const forbiddenPattern =
      /\b(rounded-full|shadow-md|shadow-lg|#[0-9a-fA-F]{3,6}|(bg|text|border)-(slate|gray|zinc|neutral|stone|emerald|teal|amber|blue|purple|red|rose)-\d{2,3})\b/;

    expect(summaryContent).not.toMatch(forbiddenPattern);
    expect(mobileCardContent).not.toMatch(forbiddenPattern);
  });

  it("8. verifies patterns/index.ts exports both summary-strip and mobile-card-list", () => {
    const indexContent = readFileSync(patternsIndexPath, "utf-8");
    expect(indexContent).toContain('export * from "./summary-strip";');
    expect(indexContent).toContain('export * from "./mobile-card-list";');
  });

  it("9. verifies contextual-dashboard-view.tsx avoids direct lucide-react imports, min-w-[78%], and snap-x", () => {
    const dashboardContent = readFileSync(dashboardPath, "utf-8");
    expect(dashboardContent).not.toMatch(/from\s+["']lucide-react["']/);
    expect(dashboardContent).not.toContain("min-w-[78%]");
    expect(dashboardContent).not.toContain("snap-x");
  });

  it("10. verifies DataTable preserves renderMobileRow contract and ul/li mobile recomposition", () => {
    const dataTableContent = readFileSync(dataTablePath, "utf-8");
    expect(dataTableContent).toContain("renderMobileRow");

    const ulMatch = dataTableContent.match(/<ul\s+role="list"\s+className="([^"]+)"/);
    expect(ulMatch).not.toBeNull();
    if (ulMatch) {
      expect(ulMatch[1]).toContain("md:hidden");
      expect(ulMatch[1]).toContain("divide-y");
    }

    const liMatch = dataTableContent.match(/<li[\s\S]*?className=\{cn\(\s*"([^"]+)"/);
    expect(liMatch).not.toBeNull();
    if (liMatch) {
      expect(liMatch[1]).toContain("p-4");
    }
  });
});


import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Layout Shell & Mobile Navigation Guardrails (Fase 19 Step 2 - P1 & P2)", () => {
  const layoutDir = path.resolve(process.cwd(), "src/components/layout");
  const uiDir = path.resolve(process.cwd(), "src/components/ui");
  const patternsDir = path.resolve(process.cwd(), "src/components/patterns");
  const stylesDir = path.resolve(process.cwd(), "src/styles");
  const studentsDir = path.resolve(process.cwd(), "src/features/students/components");

  // === P1 Guardrails (6 asserts) ===
  it("verifies workspace-bottom-nav.tsx contains md:hidden, z-40, aria-current, and safe-area pattern", () => {
    const content = readFileSync(
      path.join(layoutDir, "workspace-bottom-nav.tsx"),
      "utf-8"
    );
    expect(content).toContain("md:hidden");
    expect(content).toContain("z-40");
    expect(content).toContain("aria-current");
    expect(content).toContain("env(safe-area-inset-bottom");
  });

  it("verifies workspace-header.tsx uses md:hidden for mobile-only hamburger drawer navigation", () => {
    const content = readFileSync(
      path.join(layoutDir, "workspace-header.tsx"),
      "utf-8"
    );
    expect(content).toContain("md:hidden");
  });

  it("verifies sidebar.tsx uses hidden md:flex and collapsible width for tablet/desktop navigation", () => {
    const content = readFileSync(
      path.join(layoutDir, "sidebar.tsx"),
      "utf-8"
    );
    expect(content).toContain("hidden md:flex");
    expect(content).toContain("isCollapsed");
    expect(content).toContain("md:w-16");
    expect(content).toContain("md:w-64");
  });

  it("verifies page-container.tsx contains 5rem and md:pb-0 bottom inset compensation", () => {
    const content = readFileSync(
      path.join(layoutDir, "page-container.tsx"),
      "utf-8"
    );
    expect(content).toContain("5rem");
    expect(content).toContain("md:pb-0");
  });

  it("verifies app-shell.tsx renders WorkspaceBottomNav", () => {
    const content = readFileSync(
      path.join(layoutDir, "app-shell.tsx"),
      "utf-8"
    );
    expect(content).toContain("<WorkspaceBottomNav");
  });

  it("verifies new layout file workspace-bottom-nav.tsx does not import directly from lucide-react (C2 anti-drift)", () => {
    const content = readFileSync(
      path.join(layoutDir, "workspace-bottom-nav.tsx"),
      "utf-8"
    );
    expect(content).not.toMatch(/from\s+["']lucide-react["']/);
  });

  // === P2 Guardrails (5 asserts) ===
  it("verifies mobile-navigation.tsx retains side=\"left\" for hamburger drawer navigation", () => {
    const content = readFileSync(
      path.join(layoutDir, "mobile-navigation.tsx"),
      "utf-8"
    );
    expect(content).toContain('side="left"');
  });

  it("verifies sheet.tsx has default side = \"right\", and bottom branch contains max-h-[90dvh] without inset-y-0", () => {
    const content = readFileSync(
      path.join(uiDir, "sheet.tsx"),
      "utf-8"
    );
    expect(content).toContain('side = "right"');
    expect(content).toContain("max-h-[90dvh]");

    // Extract the specific class string for bottom variant (R8)
    const bottomClassMatch = content.match(
      /side === "bottom"\s*\?\s*["'`]([^"'`]+)["'`]/
    );
    expect(bottomClassMatch).not.toBeNull();
    if (bottomClassMatch) {
      const bottomClass = bottomClassMatch[1];
      expect(bottomClass).toContain("inset-x-0");
      expect(bottomClass).toContain("animate-sheet-bottom");
      expect(bottomClass).not.toContain("inset-y-0");
      expect(bottomClass).not.toContain("h-full");
    }
    expect(content).toContain("overscroll-contain");
    expect(content).toContain("shrink-0");
  });

  it("verifies themes.css contains animate-sheet-bottom and sheetSlideBottom keyframes", () => {
    const content = readFileSync(
      path.join(stylesDir, "themes.css"),
      "utf-8"
    );
    expect(content).toContain("animate-sheet-bottom");
    expect(content).toContain("sheetSlideBottom");
  });

  it("verifies form-bottom-sheet.tsx contains md:hidden and hidden md:block, without lucide-react import", () => {
    const content = readFileSync(
      path.join(patternsDir, "form-bottom-sheet.tsx"),
      "utf-8"
    );
    expect(content).toContain("md:hidden");
    expect(content).toContain("hidden md:block");
    expect(content).not.toMatch(/from\s+["']lucide-react["']/);
  });

  it("verifies both students workspace and detail clients use FormBottomSheet, autoFocus, and zero literal dialog form IDs", () => {
    const detailContent = [
      "student-detail-client.tsx",
      "edit-student-profile-sheet.tsx",
      "verify-student-sheet.tsx",
      "place-student-sheet.tsx",
    ]
      .map((f) => readFileSync(path.join(studentsDir, f), "utf-8"))
      .join("\n");
    const workspaceContent = readFileSync(
      path.join(studentsDir, "students-workspace-client.tsx"),
      "utf-8"
    );
    expect(detailContent).toContain("<FormBottomSheet");
    expect(workspaceContent).toContain("<FormBottomSheet");
    expect(detailContent).not.toMatch(/\bid="[a-z]+-dialog-form"/);
    expect(detailContent).toContain("autoFocus");
    expect(workspaceContent).toContain("autoFocus");
  });
});

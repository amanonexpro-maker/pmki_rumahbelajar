import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Layout Shell & Mobile Navigation Guardrails (Fase 19 Step 2 - P1)", () => {
  const layoutDir = path.resolve(process.cwd(), "src/components/layout");

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

  it("verifies workspace-header.tsx retains lg:hidden for hamburger drawer navigation", () => {
    const content = readFileSync(
      path.join(layoutDir, "workspace-header.tsx"),
      "utf-8"
    );
    expect(content).toContain("lg:hidden");
  });

  it("verifies sidebar.tsx retains hidden lg:flex for desktop persistent navigation", () => {
    const content = readFileSync(
      path.join(layoutDir, "sidebar.tsx"),
      "utf-8"
    );
    expect(content).toContain("hidden lg:flex");
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
});


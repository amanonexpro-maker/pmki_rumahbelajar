import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("DatePicker Primitives & P4 Backlog Guardrails (Fase 19 Step 2 - P4)", () => {
  const patternsDir = path.resolve(process.cwd(), "src/components/patterns");
  const datePickerPath = path.join(patternsDir, "date-picker.tsx");
  const summaryStripPath = path.join(patternsDir, "summary-strip.tsx");
  const patternsIndexPath = path.join(patternsDir, "index.ts");

  const loadingPath = path.resolve(
    process.cwd(),
    "src/app/(workspace)/workspace/loading.tsx"
  );
  const dashboardPath = path.resolve(
    process.cwd(),
    "src/features/organization/components/contextual-dashboard-view.tsx"
  );
  const auditPath = path.resolve(
    process.cwd(),
    "src/features/audit/components/audit-workspace-client.tsx"
  );
  const consentPath = path.resolve(
    process.cwd(),
    "src/features/consent/components/consent-workspace-client.tsx"
  );
  const attendancePath = path.resolve(
    process.cwd(),
    "src/features/attendance/components/attendance-workspace-client.tsx"
  );
  const mediaPath = path.resolve(
    process.cwd(),
    "src/features/media/components/media-workspace-client.tsx"
  );
  const wizardPath = path.resolve(
    process.cwd(),
    "src/features/students/components/public-registration-wizard.tsx"
  );
  const studentDetailPath = path.resolve(
    process.cwd(),
    "src/features/students/components/student-detail-client.tsx"
  );
  const statusIndexPath = path.resolve(process.cwd(), "src/lib/status/index.ts");

  it("1. verifies date-picker.tsx contains 'use client' and real class string containing opacity-0, absolute, and inset-0 on native input", () => {
    const content = readFileSync(datePickerPath, "utf-8");
    expect(content).toContain('"use client"');
    const nativeMatch = content.match(/"([^"\n]*opacity-0[^"\n]*)"/);
    expect(nativeMatch).not.toBeNull();
    if (nativeMatch) {
      expect(nativeMatch[1]).toContain("opacity-0");
      expect(nativeMatch[1]).toContain("absolute");
      expect(nativeMatch[1]).toContain("inset-0");
    }
  });

  it("2. verifies date-picker.tsx contains min-h-11, ICON_MAP.calendar, formatToIndonesianStandard, and decorative button is aria-hidden (MINOR-1)", () => {
    const content = readFileSync(datePickerPath, "utf-8");
    expect(content).toContain("min-h-11");
    expect(content).toContain("ICON_MAP.calendar");
    expect(content).toContain("formatToIndonesianStandard");
    expect(content).toContain('aria-hidden="true"');
    // Decorative button should not have noisy aria-label/aria-controls when pointer-events-none & tabIndex={-1}
    expect(content).not.toContain('aria-label="Pilih tanggal"');
  });

  it("3. verifies date-picker.tsx avoids lucide-react, responsive hooks/APIs, rounded-full, heavy shadows, and palette classes", () => {
    const content = readFileSync(datePickerPath, "utf-8");
    expect(content).not.toMatch(/from\s+["']lucide-react["']/);
    expect(content).not.toContain("useMediaQuery");
    expect(content).not.toContain("matchMedia");
    expect(content).not.toContain("window.innerWidth");
    expect(content).not.toContain("rounded-full");
    expect(content).not.toContain("shadow-md");
    expect(content).not.toContain("shadow-lg");
    const forbiddenPalette =
      /\b(#[0-9a-fA-F]{3,6}|(bg|text|border)-(slate|gray|zinc|neutral|stone|emerald|teal|amber|blue|purple|red|rose)-\d{2,3})\b/;
    expect(content).not.toMatch(forbiddenPalette);
  });

  it("4. verifies date-picker.tsx enforces unique IDs between mobile and desktop presentations without duplicate id attributes (MAJOR-1)", () => {
    const content = readFileSync(datePickerPath, "utf-8");
    expect(content).toContain("useId(");
    expect(content).toContain("-mobile-display");
    expect(content).toContain("-mobile-native");
    expect(content).toContain("-desktop-native");

    // Ensure distinct IDs for mobile and desktop inputs
    expect(content).toContain("htmlFor={mobileDisplayId}");
    expect(content).toContain("htmlFor={desktopNativeId}");
    expect(content).toContain("id={mobileDisplayId}");
    expect(content).toContain("id={mobileNativeId}");
    expect(content).toContain("id={desktopNativeId}");

    // Verify exactly one instance of each ID attribute assignment in JSX
    const mobileDisplayMatches = Array.from(content.matchAll(/id=\{mobileDisplayId\}/g));
    const mobileNativeMatches = Array.from(content.matchAll(/id=\{mobileNativeId\}/g));
    const desktopNativeMatches = Array.from(content.matchAll(/id=\{desktopNativeId\}/g));
    expect(mobileDisplayMatches.length).toBe(1);
    expect(mobileNativeMatches.length).toBe(1);
    expect(desktopNativeMatches.length).toBe(1);
  });

  it("5. verifies summary-strip.tsx exports summaryStripGridClass containing snap-mandatory, sm:grid-cols-2, and sm:divide-x", () => {
    const content = readFileSync(summaryStripPath, "utf-8");
    expect(content).toContain("export const summaryStripGridClass");
    const gridClassMatch = content.match(
      /export const summaryStripGridClass\s*=\s*["'`]([^"'`]+)["'`]/
    );
    expect(gridClassMatch).not.toBeNull();
    if (gridClassMatch) {
      const cls = gridClassMatch[1];
      expect(cls).toContain("snap-mandatory");
      expect(cls).toContain("sm:grid-cols-2");
      expect(cls).toContain("sm:divide-x");
    }
  });

  it("6. verifies summary-strip.tsx exports SummaryStripSkeleton with aria-hidden='true' and without conflicting aria-label (MINOR-4)", () => {
    const content = readFileSync(summaryStripPath, "utf-8");
    expect(content).toContain("export function SummaryStripSkeleton");
    expect(content).toContain('aria-hidden="true"');
    expect(content).toContain("{summaryStripGridClass}");

    // Skeleton root section should not combine aria-label with aria-hidden="true"
    const skeletonSectionMatch = content.match(/<section[^>]*aria-hidden="true"[^>]*>/);
    expect(skeletonSectionMatch).not.toBeNull();
    if (skeletonSectionMatch) {
      expect(skeletonSectionMatch[0]).not.toContain("aria-label");
    }
  });

  it("7. verifies summary-strip.tsx link arrowUpRight icon includes opacity-70 and text-primary instead of opacity-0 (R-MAJ-3)", () => {
    const content = readFileSync(summaryStripPath, "utf-8");
    const iconMatch = content.match(
      /<Icon[^>]*ICON_MAP\.arrowUpRight[^>]*className=["'`]([^"'`]+)["'`]/
    );
    expect(iconMatch).not.toBeNull();
    if (iconMatch) {
      expect(iconMatch[1]).toContain("opacity-70");
      expect(iconMatch[1]).toContain("text-primary");
      expect(iconMatch[1]).not.toContain("opacity-0");
    }
  });

  it("8. verifies summary-strip.tsx contains at least 2 min-w-[78%] occurrences and precisely locks both snap-start wrappers (R-TEST-2 / MINOR-2)", () => {
    const content = readFileSync(summaryStripPath, "utf-8");
    const matches = Array.from(content.matchAll(/min-w-\[78%\]/g));
    expect(matches.length).toBeGreaterThanOrEqual(2);

    // Verify exactly 2 snap-start wrappers exist (Link and div) and both contain min-w-[78%]
    const snapWrappers = Array.from(
      content.matchAll(/className="([^"]*snap-start[^"]*)"/g)
    );
    expect(snapWrappers.length).toBe(2);
    expect(snapWrappers[0][1]).toContain("min-w-[78%]");
    expect(snapWrappers[1][1]).toContain("min-w-[78%]");
  });

  it("9. verifies workspace loading.tsx uses SummaryStripSkeleton and has 0 raw strip classes (R-MAJ-2)", () => {
    const content = readFileSync(loadingPath, "utf-8");
    expect(content).toContain("<SummaryStripSkeleton");
    expect(content).not.toContain("min-w-[78%]");
    expect(content).not.toContain("snap-");
    expect(content).not.toContain("divide-x");
    expect(content).not.toContain("sm:grid-cols-2");
  });

  it("10. verifies contextual-dashboard-view.tsx mobile order comment has Ringkasan operasional before Perlu perhatian (R-MAJ-1)", () => {
    const content = readFileSync(dashboardPath, "utf-8");
    const ringkasanIndex = content.indexOf("Ringkasan operasional");
    const perhatianIndex = content.indexOf("Perlu perhatian");
    expect(ringkasanIndex).toBeGreaterThan(-1);
    expect(perhatianIndex).toBeGreaterThan(-1);
    expect(ringkasanIndex).toBeLessThan(perhatianIndex);

    expect(content).not.toContain("min-w-[78%]");
    expect(content).not.toContain("snap-x");
    expect(content).not.toMatch(/from\s+["']lucide-react["']/);
  });

  it("11. verifies audit-workspace-client.tsx uses getAuditEntityLabel and AUDIT_ENTITY_META without local ENTITY_TYPE_OPTIONS (R-MIN-1)", () => {
    const content = readFileSync(auditPath, "utf-8");
    expect(content).toContain("getAuditEntityLabel");
    expect(content).toContain("AUDIT_ENTITY_META");
    expect(content).not.toContain("const ENTITY_TYPE_OPTIONS");
    expect(content).not.toContain("entityType.replace(");
  });

  it("12. verifies consent-workspace-client.tsx action block contains exactly 1 Button and 1 text button (R-MIN-2)", () => {
    const content = readFileSync(consentPath, "utf-8");
    const actionMatch = content.match(
      /action=\{\s*canUpdate\s*\?\s*\(([\s\S]*?)\)\s*:\s*null/
    );
    expect(actionMatch).not.toBeNull();
    if (actionMatch) {
      const actionBlock = actionMatch[1];
      const buttonComponents = Array.from(actionBlock.matchAll(/<Button\b/g));
      expect(buttonComponents.length).toBe(1);
      expect(actionBlock).toContain("<button");
      expect(actionBlock).toContain("min-h-10");
    }
  });

  it("13. verifies attendance-workspace-client.tsx uses ATTENDANCE_STATUS_META, 0 hit 'Alpa', uses DatePicker, and 0 raw type='date'", () => {
    const content = readFileSync(attendancePath, "utf-8");
    expect(content).toContain("ATTENDANCE_STATUS_META");
    expect(content).not.toContain('"Alpa"');
    expect(content).not.toContain("'Alpa'");
    expect(content).not.toContain("Alpa:");
    expect(content).toContain("<DatePicker");
    expect(content).not.toContain('type="date"');
  });

  it("14. verifies media, registration wizard, and student detail clients have 0 raw type='date' while preserving FormBottomSheet", () => {
    const mediaContent = readFileSync(mediaPath, "utf-8");
    const wizardContent = readFileSync(wizardPath, "utf-8");
    const detailDir = path.dirname(studentDetailPath);
    const detailBundleContent = [
      "student-detail-client.tsx",
      "edit-student-profile-sheet.tsx",
      "verify-student-sheet.tsx",
      "place-student-sheet.tsx",
    ]
      .map((f) => readFileSync(path.join(detailDir, f), "utf-8"))
      .join("\n");

    expect(mediaContent).not.toContain('type="date"');
    expect(wizardContent).not.toContain('type="date"');
    expect(detailBundleContent).not.toContain('type="date"');
    expect(detailBundleContent).toContain("FormBottomSheet");
  });

  it("15. verifies patterns index exports date-picker (17 total) and lib/status exports AUDIT_ENTITY_META", () => {
    const indexContent = readFileSync(patternsIndexPath, "utf-8");
    expect(indexContent).toContain('export * from "./date-picker";');

    const statusContent = readFileSync(statusIndexPath, "utf-8");
    expect(statusContent).toContain("export const AUDIT_ENTITY_META");
  });

  it("16. verifies date-picker.tsx binds aria-describedby to hintId and errorId, and passes aria-invalid when error is present (MINOR-5)", () => {
    const content = readFileSync(datePickerPath, "utf-8");
    expect(content).toContain("describedById = error ? errorId : hint ? hintId : undefined");
    expect(content).toContain("aria-describedby={describedById}");
    expect(content).toContain('aria-invalid={error ? "true" : undefined}');
    expect(content).toContain("id={hintId}");
    expect(content).toContain("id={errorId}");
  });
});

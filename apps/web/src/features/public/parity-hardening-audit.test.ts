import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getOperationalTelemetrySnapshot,
  measureServerOperation,
  PERFORMANCE_BUDGET_MS,
  recordOperationalTelemetry,
  resetOperationalTelemetryForTests,
} from "@/server/monitoring/operational-telemetry";

function collectSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

const ALL_DOMAINS = [
  "identity",
  "administration",
  "organization",
  "academic",
  "students",
  "attendance",
  "development",
  "consent",
  "media",
  "governance",
  "publishing",
  "audit",
  "public",
] as const;

describe("Fase 10 — System-Wide Parity Audit, Domain Boundaries, Terminology Sweep, Security & ADR-13 Platform Verify", () => {
  const webRoot = path.resolve(__dirname, "../../..");
  const srcRoot = path.join(webRoot, "src");
  const repoRoot = path.resolve(webRoot, "../..");

  it("1. DOMAIN AUDIT (11 §40, §42): all 13 feature modules strictly import other domains via index.ts only (zero cross-domain repository/query imports)", () => {
    const featuresRoot = path.join(srcRoot, "features");

    for (const domain of ALL_DOMAINS) {
      const domainDir = path.join(featuresRoot, domain);
      expect(fs.existsSync(domainDir)).toBe(true);
      expect(fs.existsSync(path.join(domainDir, "index.ts"))).toBe(true);

      const files = collectSourceFiles(domainDir);
      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        const crossDomainInternalRegex = new RegExp(
          `@/features/(?!${domain}\\b)[a-z-]+/(repositories|queries|actions|validators|permissions|components)`
        );
        expect(content).not.toMatch(crossDomainInternalRegex);
      }

      // Repositories must never import other repositories
      const repoDir = path.join(domainDir, "repositories");
      const repoFiles = collectSourceFiles(repoDir);
      for (const repoFile of repoFiles) {
        const content = fs.readFileSync(repoFile, "utf8");
        expect(content).not.toMatch(/-repository/);
      }
    }
  });

  it("2. TERMINOLOGY SWEEP (10 §24, §29): zero forbidden non-canonical or English UI terms across all UI components & pages", () => {
    const uiFiles = [
      ...collectSourceFiles(path.join(srcRoot, "app")),
      ...collectSourceFiles(path.join(srcRoot, "components")),
      ...collectSourceFiles(path.join(srcRoot, "features")),
    ];
    expect(uiFiles.length).toBeGreaterThan(40);

    const forbiddenUiStrings = [
      "No Data Found",
      "Join now",
      "Enroll immediately",
      "Media Consent Verified",
      "Daftar Siswa Baru",
      "Siswa Terdaftar",
      "Tenaga Guru Relawan",
      "Rombel Aktif",
      "Kelas Rombel",
    ];

    for (const file of uiFiles) {
      const content = fs.readFileSync(file, "utf8");
      for (const forbidden of forbiddenUiStrings) {
        expect(content).not.toContain(forbidden);
      }
    }
  });

  it("3. SECURITY & ADR-13 PLATFORM VERIFY: getUser() enforcement, edge-safe middleware, private storage, harden_tables(), sin1 region, & zero client supabase.from()", () => {
    // 3a. Session adapter uses supabase.auth.getUser() and never supabase.auth.getSession()
    const sessionFile = fs.readFileSync(
      path.join(srcRoot, "server/auth/session.ts"),
      "utf8"
    );
    expect(sessionFile).toContain("supabase.auth.getUser()");
    expect(sessionFile).not.toContain("supabase.auth.getSession(");

    // 3b. Proxy / Middleware is edge-safe (zero Drizzle / postgres imports)
    const proxyTarget = fs.existsSync(path.join(srcRoot, "proxy.ts"))
      ? path.join(srcRoot, "proxy.ts")
      : path.join(srcRoot, "middleware.ts");
    const middlewareFile = fs.readFileSync(proxyTarget, "utf8");
    expect(middlewareFile).not.toMatch(
      /from\s+["'](drizzle-orm|@\/db|postgres)/
    );

    // 3c. No client component ("use client") reads operational tables via supabase.from(...) or exposes SERVICE_ROLE_KEY
    const allSrcFiles = collectSourceFiles(srcRoot);
    for (const file of allSrcFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
      if (
        content.startsWith('"use client"') ||
        content.startsWith("'use client'")
      ) {
        expect(content).not.toMatch(/supabase\.from\s*\(/);
        expect(content).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      }
    }

    // 3d. Migrations invoke public.pmki_harden_tables()
    const migrationsDir = path.join(webRoot, "src/db/migrations");
    const sqlFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"));
    expect(sqlFiles.length).toBeGreaterThanOrEqual(2);
    const combinedSql = sqlFiles
      .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"))
      .join("\n");
    expect(combinedSql).toContain("SELECT public.pmki_harden_tables();");
    expect(combinedSql).toContain("trg_audit_logs_immutable");
    expect(combinedSql).toContain("trg_report_workflow_logs_immutable");

    // 3e. Vercel region is pinned to sin1 (Singapore — D-27)
    const vercelJson = JSON.parse(
      fs.readFileSync(path.join(webRoot, "vercel.json"), "utf8")
    ) as { regions?: string[] };
    expect(vercelJson.regions).toContain("sin1");

    // 3f. dev-seed.ts blocks production execution (D-30), while prod-bootstrap-admin.ts exists for production Admin API bootstrap
    const devSeedContent = fs.readFileSync(
      path.join(srcRoot, "db/seed/dev-seed.ts"),
      "utf8"
    );
    expect(devSeedContent).toContain('process.env.NODE_ENV === "production"');
    expect(
      fs.existsSync(path.join(srcRoot, "db/seed/prod-bootstrap-admin.ts"))
    ).toBe(true);

    // 3g. Prototype in root repository remains untouched (D-16)
    expect(fs.existsSync(path.join(repoRoot, "src/App.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, "src/db/seed-data.ts"))).toBe(
      true
    );
  });

  it("4. PERFORMANCE & MONITORING (09 §39–40, 06 §27): tracks action latency budgets (<500ms normal, <2000ms heavy) and operational counters", async () => {
    resetOperationalTelemetryForTests();

    expect(PERFORMANCE_BUDGET_MS.NORMAL_ACTION_MAX_MS).toBe(500);
    expect(PERFORMANCE_BUDGET_MS.HEAVY_ACTION_MAX_MS).toBe(2000);

    const fastOp = await measureServerOperation("student.fastRead", async () => {
      return "ok";
    });
    expect(fastOp.result).toBe("ok");
    expect(fastOp.withinBudget).toBe(true);

    recordOperationalTelemetry({
      category: "PERMISSION_DENIED",
      operationName: "guardian.read",
    });
    recordOperationalTelemetry({
      category: "POLICY_DENIED",
      operationName: "report.approve.sod",
    });
    recordOperationalTelemetry({
      category: "VALIDATION_FAILURE",
      operationName: "student.register",
    });
    recordOperationalTelemetry({
      category: "SYNC_PROCESSED",
      operationName: "api.sync.attendance",
    });

    const snapshot = getOperationalTelemetrySnapshot();
    expect(snapshot.totalActionsMeasured).toBe(1);
    expect(snapshot.budgetExceededCount).toBe(0);
    expect(snapshot.permissionDenialsCount).toBe(1);
    expect(snapshot.policyDenialsCount).toBe(1);
    expect(snapshot.validationFailuresCount).toBe(1);
    expect(snapshot.syncProcessedCount).toBe(1);
  });
});


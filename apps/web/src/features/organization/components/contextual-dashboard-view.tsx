import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/patterns";
import { Badge, type BadgeProps } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import {
  getIndonesianTimeGreeting,
  type ContextualDashboardViewModelDTO,
  type DashboardActionLinkDTO,
  type DashboardActivityEntryDTO,
  type DashboardTone,
} from "../services/dashboard-overview-service";

export interface ContextualDashboardViewProps {
  vm: ContextualDashboardViewModelDTO;
}

export interface DashboardOrientationHeaderProps {
  session?: SessionUser;
  vm?: ContextualDashboardViewModelDTO;
}

function resolveHeaderData(props: DashboardOrientationHeaderProps): {
  eyebrow: string;
  title: string;
  badgeLabel: string;
  description: string;
  primaryAction: DashboardActionLinkDTO | null;
  secondaryAction: DashboardActionLinkDTO | null;
} {
  if (props.vm) {
    return {
      eyebrow: `${props.vm.serviceUnitName} · Tahun ajaran ${props.vm.academicYearName}`,
      title: `${props.vm.greeting}, ${props.vm.userName}`,
      badgeLabel: props.vm.primaryRoleLabel,
      description: props.vm.contextSummarySentence,
      primaryAction: props.vm.primaryAction,
      secondaryAction: props.vm.secondaryAction,
    };
  }

  const session = props.session;
  const primaryRole = (session?.roles[0] ?? "TEACHER") as SystemRole;
  const primaryRoleLabel = getRoleLabel(primaryRole) ?? primaryRole;
  const greeting = getIndonesianTimeGreeting();
  const userName = session?.name ?? "Pengguna";

  let primaryAction: DashboardActionLinkDTO | null = null;
  let secondaryAction: DashboardActionLinkDTO | null = null;

  if (primaryRole === "TEACHER") {
    primaryAction = {
      label: "Catat presensi",
      href: "/workspace/attendance",
    };
    secondaryAction = {
      label: "Tambah catatan perkembangan",
      href: "/workspace/development/new",
    };
  } else if (primaryRole === "APPROVER" || primaryRole === "REVIEWER") {
    primaryAction = {
      label: "Tinjau laporan",
      href: "/workspace/reports",
    };
  } else if (primaryRole === "EDITOR") {
    primaryAction = {
      label: "Kelola publikasi",
      href: "/workspace/publishing",
    };
    secondaryAction = {
      label: "Unggah dokumentasi",
      href: "/workspace/media",
    };
  } else if (primaryRole === "AUDITOR") {
    primaryAction = {
      label: "Lihat jejak audit",
      href: "/workspace/audit",
    };
  } else {
    // UNIT_COORDINATOR, PLATFORM_ADMIN
    primaryAction = {
      label: "Verifikasi pendaftaran",
      href: "/workspace/students",
    };
    secondaryAction = {
      label: "Catat presensi",
      href: "/workspace/attendance",
    };
  }

  return {
    eyebrow: "Rumah Belajar Griya Asih Lawang · Tahun ajaran 2026/2027",
    title: `${greeting}, ${userName}`,
    badgeLabel: primaryRoleLabel,
    description:
      "Tinjauan ringkas operasional unit layanan, antrean tindak lanjut tugas, jadwal belajar Sabtu, dan aktivitas terbaru.",
    primaryAction,
    secondaryAction,
  };
}

export function DashboardOrientationHeader(props: DashboardOrientationHeaderProps) {
  const data = resolveHeaderData(props);

  return (
    <PageHeader
      eyebrow={data.eyebrow}
      title={data.title}
      badge={<Badge variant="primary">{data.badgeLabel}</Badge>}
      description={data.description}
      primaryAction={
        data.primaryAction ? (
          <Link
            href={data.primaryAction.href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 text-sm font-semibold shadow-xs transition-colors active:scale-[0.985] focus-ring"
          >
            <span>{data.primaryAction.label}</span>
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </Link>
        ) : undefined
      }
      secondaryActions={
        data.secondaryAction ? (
          <Link
            href={data.secondaryAction.href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border px-4 py-2 text-sm font-semibold shadow-xs transition-colors active:scale-[0.985] focus-ring"
          >
            <span>{data.secondaryAction.label}</span>
          </Link>
        ) : undefined
      }
    />
  );
}

function mapToneToBadgeVariant(
  tone: DashboardTone
): NonNullable<BadgeProps["variant"]> {
  switch (tone) {
    case "primary":
      return "primary";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    case "info":
      return "info";
    case "learning":
      return "learning";
    case "activity":
      return "activity";
    default:
      return "neutral";
  }
}

/**
 * Body sections of UI-3 Contextual Workspace Dashboard (`UI-UX §24`, `03 §5`, `10 §8`).
 */
export function ContextualDashboardBody({
  vm,
}: {
  vm: ContextualDashboardViewModelDTO;
}) {
  // Group recent activities by dateGroup
  const activityGroups: {
    dateGroup: string;
    entries: DashboardActivityEntryDTO[];
  }[] = [];
  for (const item of vm.activityItems) {
    const existing = activityGroups.find((g) => g.dateGroup === item.dateGroup);
    if (existing) {
      existing.entries.push(item);
    } else {
      activityGroups.push({ dateGroup: item.dateGroup, entries: [item] });
    }
  }

  return (
    <>
      {/*
       * Responsive Order (UI-3 Parity):
       * Mobile (<640px): Orientation -> [Perlu perhatian & Jadwal belajar] -> Ringkasan operasional -> Aktivitas terbaru
       * Tablet/Desktop (>=640px): Orientation -> Ringkasan operasional -> [Perlu perhatian | Jadwal belajar] -> Aktivitas terbaru
       */}

      {/* 2. OPERATIONAL SUMMARY STRIP (Horizontal Snap Scroll on mobile — zero KPI cards) */}
      <section
        aria-label="Ringkasan operasional"
        className="order-3 sm:order-2 border-y border-border py-4 sm:py-5"
      >
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-y-6 sm:gap-x-6 sm:divide-x sm:divide-border sm:pb-0">
          {vm.summaryMetrics.map((item, idx) => {
            const inner = (
              <div
                className={cn(
                  "p-4 rounded-card border border-border-subtle bg-surface sm:border-0 sm:bg-transparent sm:p-0",
                  idx > 0 && "sm:pl-6"
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="type-h1 text-foreground tabular-nums tracking-tight">
                    {item.value}
                  </span>
                  {item.href && (
                    <ArrowUpRight
                      aria-hidden="true"
                      className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 type-caption text-secondary-foreground">
                  {item.context}
                </p>
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="snap-start shrink-0 min-w-[78%] sm:min-w-0 group block text-left rounded-control transition-colors hover:bg-surface-subtle/70 focus-ring"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div
                key={item.id}
                className="snap-start shrink-0 min-w-[78%] sm:min-w-0"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. NEEDS ATTENTION ("Perlu perhatian") & UPCOMING WORK ("Jadwal belajar") */}
      <div className="order-2 sm:order-3 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Perlu perhatian */}
        <section
          aria-labelledby="dashboard-attention-heading"
          className="lg:col-span-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                id="dashboard-attention-heading"
                className="type-h3 text-foreground"
              >
                Perlu perhatian
              </h2>
              <p className="type-caption text-secondary-foreground mt-0.5">
                Tindak lanjut operasional berdasarkan wewenang peran Anda saat
                ini
              </p>
            </div>
            {vm.attentionItems.length > 0 && (
              <Badge variant="warning" dot>
                {vm.attentionItems.length} kategori
              </Badge>
            )}
          </div>

          {vm.attentionItems.length === 0 ? (
            <div className="rounded-card bg-surface border border-border px-5 py-6 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-pill bg-success-soft text-success flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Tidak ada hal mendesak yang menunggu tindakan Anda
                </p>
                <p className="type-caption text-secondary-foreground leading-relaxed">
                  Seluruh antrean verifikasi pendaftaran, pencatatan presensi,
                  dan peninjauan dalam cakupan tugas Anda telah mutakhir.
                </p>
              </div>
            </div>
          ) : (
            <ul
              role="list"
              className="rounded-card bg-warning-soft/30 border border-warning/30 border-l-4 border-l-warning divide-y divide-warning/20 overflow-hidden"
            >
              {vm.attentionItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group w-full min-h-14 text-left px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-warning-soft/50 transition-colors focus-ring"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={mapToneToBadgeVariant(item.tone)}
                          dot
                        >
                          {item.category}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <p className="type-caption text-secondary-foreground pl-0.5">
                        {item.detail}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary shrink-0 self-start sm:self-center bg-surface px-3 py-1.5 rounded-control border border-border-subtle">
                      <span>{item.actionLabel}</span>
                      <ArrowRight
                        aria-hidden="true"
                        className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right Column: Jadwal belajar */}
        <section
          aria-labelledby="dashboard-upcoming-heading"
          className="lg:col-span-6 space-y-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2
                id="dashboard-upcoming-heading"
                className="type-h3 text-foreground"
              >
                Jadwal belajar
              </h2>
              <p className="type-caption text-secondary-foreground mt-0.5">
                Sesi rutin setiap Sabtu · 15.00 – 17.00 WIB di RAAL Griya Asih
              </p>
            </div>

            {vm.recentSessionsSummary.canOpenAttendance && (
              <Link
                href="/workspace/attendance"
                className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary hover:underline focus-ring rounded-xs px-1"
              >
                <span>Buku presensi</span>
                <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="rounded-card bg-surface border border-border divide-y divide-border-subtle overflow-hidden">
            {vm.upcomingSchedules.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-20 sm:w-24 shrink-0 pt-0.5">
                    <span className="text-xs font-bold text-foreground font-mono tabular-nums block">
                      {item.timeRange}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Sabtu WIB
                    </span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {item.className}
                      </p>
                      {item.isCurrentUserTeacher && (
                        <Badge variant="primary">Kelas Anda</Badge>
                      )}
                    </div>

                    <p className="text-xs text-secondary-foreground">
                      Pengajar: <span className="font-medium text-foreground">{item.teacherName}</span>
                    </p>
                  </div>
                </div>

                {item.canManageAttendance && (
                  <div className="shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                    <Link
                      href={item.href}
                      className="inline-flex min-h-9 items-center gap-1 rounded-control px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-surface-subtle focus-ring"
                    >
                      <span>Catat presensi</span>
                      <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}

            {/* Footer context strip showing latest attendance completion status */}
            <div className="px-4 sm:px-5 py-3 bg-surface-subtle/60 flex flex-wrap items-center justify-between gap-2 type-caption text-secondary-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-primary"
                />
                <span>
                  Rekap sesi terakhir (
                  {vm.recentSessionsSummary.latestDateLabel}):{" "}
                  <strong className="text-foreground">
                    {vm.recentSessionsSummary.recordedClassesCount} dari{" "}
                    {vm.recentSessionsSummary.totalClassesCount} kelas
                  </strong>{" "}
                  tercatat
                </span>
              </span>

              <Link
                href="/workspace/academic"
                className="inline-flex min-h-9 items-center text-xs font-semibold text-primary hover:underline focus-ring rounded-xs px-1"
              >
                Lihat seluruh kelas &amp; pengajar
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* 4. RECENT ACTIVITY ("Aktivitas terbaru" — Privacy-safe, human-readable) */}
      {activityGroups.length > 0 && (
        <section
          aria-labelledby="dashboard-activity-heading"
          className="order-4 pt-4 border-t border-border space-y-4"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2
                id="dashboard-activity-heading"
                className="type-h3 text-foreground"
              >
                Aktivitas terbaru
              </h2>
              <p className="type-caption text-secondary-foreground mt-0.5">
                Jejak kegiatan operasional unit layanan secara ringkas dan aman
                privasi
              </p>
            </div>

            {vm.canViewAuditLog && (
              <Link
                href="/workspace/audit"
                className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary hover:underline focus-ring rounded-xs px-1"
              >
                <span>Lihat jejak audit</span>
                <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="space-y-5">
            {activityGroups.slice(0, 2).map((group) => (
              <div key={group.dateGroup} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group.dateGroup}
                </h3>

                <ul role="list" className="divide-y divide-border-subtle">
                  {group.entries.slice(0, 3).map((entry) => (
                    <li
                      key={entry.id}
                      className="py-2.5 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Badge
                          variant={mapToneToBadgeVariant(entry.tone)}
                          dot
                          className="mt-0.5 shrink-0"
                        >
                          Aktivitas
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {entry.title}
                          </p>
                          <p className="type-caption text-secondary-foreground">
                            {entry.context}
                          </p>
                        </div>
                      </div>

                      {entry.timeLabel && (
                        <span className="type-caption text-muted-foreground font-mono tabular-nums shrink-0">
                          {entry.timeLabel}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {vm.canViewAuditLog && (
              <div className="pt-2 flex justify-start sm:justify-end">
                <Link
                  href="/workspace/audit"
                  className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-ring rounded-xs"
                >
                  <span>Lihat semua aktivitas di jejak audit</span>
                  <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

/**
 * UI-3 Contextual Workspace Dashboard (`UI-UX §24`, `03 §5`, `10 §8`, `AGENTS.md`).
 */
export function ContextualDashboardView({ vm }: ContextualDashboardViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <DashboardOrientationHeader vm={vm} />
      <ContextualDashboardBody vm={vm} />
    </div>
  );
}


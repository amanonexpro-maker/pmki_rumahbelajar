import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  MapPin,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/patterns";
import { Badge, type BadgeProps } from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
  ContextualDashboardViewModelDTO,
  DashboardActivityEntryDTO,
  DashboardTone,
} from "../services/dashboard-overview-service";

export interface ContextualDashboardViewProps {
  vm: ContextualDashboardViewModelDTO;
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
 * UI-3 Contextual Workspace Dashboard (`UI-UX §24`, `03 §5`, `10 §8`, `AGENTS.md`).
 *
 * Mental Model:
 * 1. Orientation (Greeting, Role, Service Unit & Academic Year context, Primary/Secondary CTA)
 * 2. Operational Summary Strip (Lightweight inline typography strip — NO isolated 4 KPI cards, NO chart)
 * 3. Perlu perhatian (Actionable role-filtered attention queue)
 * 4. Jadwal belajar (Upcoming Saturday learning sessions with direct attendance link)
 * 5. Aktivitas terbaru (Restrained, privacy-safe human-readable activity list grouped by date)
 */
export function ContextualDashboardView({ vm }: ContextualDashboardViewProps) {
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
    <div className="flex flex-col gap-8">
      {/* 1. ORIENTATION & GREETING (Open, calm, not wrapped in a card) */}
      <PageHeader
        eyebrow={`${vm.serviceUnitName} · Tahun ajaran ${vm.academicYearName}`}
        title={`${vm.greeting}, ${vm.userName}`}
        badge={<Badge variant="primary">{vm.primaryRoleLabel}</Badge>}
        description={vm.contextSummarySentence}
        primaryAction={
          vm.primaryAction ? (
            <Link
              href={vm.primaryAction.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 text-sm font-semibold shadow-xs transition-colors active:scale-[0.985] focus-ring"
            >
              <span>{vm.primaryAction.label}</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </Link>
          ) : undefined
        }
        secondaryActions={
          vm.secondaryAction ? (
            <Link
              href={vm.secondaryAction.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border px-4 py-2 text-sm font-semibold shadow-xs transition-colors active:scale-[0.985] focus-ring"
            >
              <span>{vm.secondaryAction.label}</span>
            </Link>
          ) : undefined
        }
      />

      {/*
       * Responsive Order (UI-3 Parity):
       * Mobile (<640px): Orientation -> [Perlu perhatian & Jadwal belajar] -> Ringkasan operasional -> Aktivitas terbaru
       * Tablet/Desktop (>=640px): Orientation -> Ringkasan operasional -> [Perlu perhatian | Jadwal belajar] -> Aktivitas terbaru
       */}

      {/* 2. OPERATIONAL SUMMARY STRIP (Inline typography strip with subtle dividers — zero KPI cards) */}
      <section
        aria-label="Ringkasan operasional"
        className="order-3 sm:order-2 border-y border-border py-5"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-6 sm:divide-x sm:divide-border">
          {vm.summaryMetrics.map((item, idx) => {
            const inner = (
              <div className={cn(idx > 0 && "sm:pl-6")}>
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
                  className="group block text-left rounded-control -m-2 p-2 transition-colors hover:bg-surface-subtle/70 focus-ring"
                >
                  {inner}
                </Link>
              );
            }

            return <div key={item.id}>{inner}</div>;
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
              className="rounded-card bg-surface border border-border divide-y divide-border overflow-hidden"
            >
              {vm.attentionItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group w-full min-h-14 text-left px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle/75 transition-colors focus-ring"
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

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0 self-start sm:self-center">
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
                Sesi rutin setiap Sabtu · 15.00 – 17.15 WIB di RAAL Griya Asih
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

          <div className="rounded-card bg-surface border border-border divide-y divide-border overflow-hidden">
            {vm.upcomingSchedules.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-24 shrink-0 pt-0.5">
                    <span className="text-xs font-bold text-foreground font-mono tabular-nums block">
                      {item.timeRange}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Sabtu WIB
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {item.subjectName}
                      </p>
                      {item.isCurrentUserTeacher && (
                        <Badge variant="primary">Kelas Anda</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-secondary-foreground">
                      <span className="font-medium text-foreground">
                        {item.className}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Users
                          aria-hidden="true"
                          className="w-3.5 h-3.5 text-muted-foreground"
                        />
                        <span>{item.enrolledCount} peserta didik</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin
                          aria-hidden="true"
                          className="w-3.5 h-3.5 text-muted-foreground"
                        />
                        <span>{item.roomName}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Pengajar: {item.teacherName}
                    </p>
                  </div>
                </div>

                {item.canManageAttendance && (
                  <div className="shrink-0 sm:self-center">
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
            {activityGroups.map((group) => (
              <div key={group.dateGroup} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group.dateGroup}
                </h3>

                <ul role="list" className="divide-y divide-border-subtle">
                  {group.entries.map((entry) => (
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
          </div>
        </section>
      )}
    </div>
  );
}


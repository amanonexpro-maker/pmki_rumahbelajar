"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/compositions";
import {
  DataTable,
  MobileCardList,
  PageHeader,
  SearchToolbar,
  SummaryStrip,
  type DataTableColumn,
} from "@/components/patterns";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Textarea,
} from "@/components/ui";
import { useConnectivity } from "@/hooks/use-connectivity";
import { PRIVACY_MESSAGES, SUCCESS_MESSAGES } from "@/lib/messages";
import { checkTierCOnlineAvailability } from "@/lib/offline";
import { CONSENT_STATUS_META, type ConsentStatus } from "@/lib/status";
import { updateStudentConsentAction } from "../actions/consent-actions";
import type { StudentConsentRecordDTO } from "../types/consent-types";

export interface ConsentWorkspaceClientProps {
  consents: StudentConsentRecordDTO[];
  initialSearch: string;
  initialPhotoStatus: string;
  canUpdate: boolean;
}

export function ConsentWorkspaceClient({
  consents,
  initialSearch,
  initialPhotoStatus,
  canUpdate,
}: ConsentWorkspaceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: connectivityStatus } = useConnectivity();

  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [editingConsent, setEditingConsent] =
    React.useState<StudentConsentRecordDTO | null>(null);
  const [draftPersonal, setDraftPersonal] =
    React.useState<ConsentStatus>("GRANTED");
  const [draftPhoto, setDraftPhoto] = React.useState<ConsentStatus>("DENIED");
  const [draftNotes, setDraftNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);

  const updateUrl = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === "ALL") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  React.useEffect(() => {
    if (searchInput === initialSearch) return;
    const t = window.setTimeout(() => {
      updateUrl({ search: searchInput.trim() || null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [initialSearch, searchInput, updateUrl]);

  function openEditor(
    item: StudentConsentRecordDTO,
    presetRevokePhoto = false
  ) {
    setFeedback(null);
    const tierCheck = checkTierCOnlineAvailability(
      "Tata Kelola & Persetujuan Laporan",
      connectivityStatus !== "OFFLINE"
    );
    if (!tierCheck.allowed) {
      setFeedback({ tone: "warning", message: tierCheck.message });
      return;
    }

    setEditingConsent(item);
    setDraftPersonal(item.personalDataConsent);
    setDraftPhoto(presetRevokePhoto ? "REVOKED" : item.photoVideoConsent);
    setDraftNotes(item.notes ?? "");
  }

  async function handleSaveConsent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingConsent || pending) return;

    const tierCheck = checkTierCOnlineAvailability(
      "Tata Kelola & Persetujuan Laporan",
      connectivityStatus !== "OFFLINE"
    );
    if (!tierCheck.allowed) {
      setFeedback({ tone: "warning", message: tierCheck.message });
      return;
    }

    setPending(true);
    setFeedback(null);
    try {
      const res = await updateStudentConsentAction({
        consentId: editingConsent.id,
        personalDataConsent: draftPersonal,
        photoVideoConsent: draftPhoto,
        notes: draftNotes.trim() || null,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setEditingConsent(null);
      setFeedback({
        tone: "success",
        message: SUCCESS_MESSAGES.consentUpdated,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const totalCount = consents.length;
  const photoGrantedCount = consents.filter(
    (c) => c.photoVideoConsent === "GRANTED"
  ).length;
  const revokedCount = consents.filter(
    (c) =>
      c.personalDataConsent === "REVOKED" || c.photoVideoConsent === "REVOKED"
  ).length;

  const columns: DataTableColumn<StudentConsentRecordDTO>[] = [
    {
      id: "student",
      header: "Peserta didik",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">{row.studentFullName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {row.studentRegistrationNumber} · {row.studentEducationLevelLabel}
          </p>
        </div>
      ),
    },
    {
      id: "personal-data",
      header: "Persetujuan data",
      cell: (row) => (
        <StatusBadge domain="consent" status={row.personalDataConsent} />
      ),
    },
    {
      id: "photo-video",
      header: "Persetujuan foto & video",
      cell: (row) => (
        <StatusBadge domain="consent" status={row.photoVideoConsent} />
      ),
    },
    {
      id: "evidence",
      header: "Catatan & waktu efektif",
      cell: (row) => (
        <div className="space-y-0.5 text-xs">
          <p className="text-foreground">
            {row.notes ?? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Icon icon={Lock} size="xs" />
                <span>Catatan bukti terlindungi / kosong</span>
              </span>
            )}
          </p>
          <p className="text-muted-foreground font-mono">
            Efektif: {new Date(row.effectiveAt).toLocaleDateString("id-ID")}
            {row.revokedAt
              ? ` · Dicabut: ${new Date(row.revokedAt).toLocaleDateString("id-ID")}`
              : ""}
          </p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Tindakan",
      align: "right",
      cell: (row) =>
        canUpdate ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => openEditor(row, false)}
            >
              Perbarui persetujuan
            </Button>
            {row.photoVideoConsent === "GRANTED" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openEditor(row, true)}
              >
                Cabut persetujuan
              </Button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persetujuan"
        description="Kelola Persetujuan Data dan Persetujuan Foto & Video peserta didik secara terpisah. Perubahan status persetujuan membutuhkan koneksi online aktif (Tier C) dan langsung dicatat dalam jejak audit."
      />

      <SummaryStrip
        items={[
          {
            id: "total",
            label: "Total arsip persetujuan",
            value: `${totalCount} peserta didik`,
          },
          {
            id: "photo-granted",
            label: "Foto & video disetujui",
            value: `${photoGrantedCount} peserta didik`,
          },
          {
            id: "revoked",
            label: "Izin dicabut",
            value: `${revokedCount} catatan`,
          },
        ]}
        ariaLabel="Ringkasan persetujuan"
        bordered
      />

      <div className="rounded-control border border-border bg-surface-subtle/60 px-4 py-3 text-xs text-secondary-foreground flex items-center gap-2.5">
        <Icon
          icon={ShieldCheck}
          size="sm"
          className="text-primary shrink-0"
        />
        <span>{PRIVACY_MESSAGES.mediaConsentIndependent}</span>
      </div>

      {feedback && (
        <div
          role={feedback.tone === "danger" ? "alert" : "status"}
          className={
            feedback.tone === "success"
              ? "rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
              : feedback.tone === "warning"
                ? "rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground"
                : "rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          }
        >
          {feedback.message}
        </div>
      )}

      <SearchToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari peserta didik..."
        filterCount={initialPhotoStatus !== "ALL" ? 1 : 0}
        onResetAll={() => {
          setSearchInput("");
          router.push(pathname);
        }}
        desktopFilters={
          <select
            aria-label="Filter status persetujuan foto dan video"
            value={initialPhotoStatus}
            onChange={(e) => updateUrl({ photoStatus: e.target.value })}
            className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
          >
            <option value="ALL">Semua status foto & video</option>
            <option value="GRANTED">
              {CONSENT_STATUS_META.GRANTED.label}
            </option>
            <option value="DENIED">
              {CONSENT_STATUS_META.DENIED.label}
            </option>
            <option value="REVOKED">
              {CONSENT_STATUS_META.REVOKED.label}
            </option>
          </select>
        }
      />

      <DataTable
        columns={columns}
        data={consents}
        getRowKey={(row) => row.id}
        caption="Daftar persetujuan data dan foto/video peserta didik"
        renderMobileRow={(row) => (
          <MobileCardList
            title={row.studentFullName}
            badge={
              <StatusBadge domain="consent" status={row.photoVideoConsent} />
            }
            primaryMeta={
              <span className="font-mono">
                No: {row.studentRegistrationNumber}
              </span>
            }
            secondaryMeta={
              <span>
                Data:{" "}
                <strong>
                  {CONSENT_STATUS_META[row.personalDataConsent].label}
                </strong>
              </span>
            }
            action={
              canUpdate ? (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="min-h-10 text-xs"
                    onClick={() => openEditor(row, false)}
                  >
                    Perbarui persetujuan
                  </Button>
                  {row.photoVideoConsent === "GRANTED" && (
                    <button
                      type="button"
                      className="min-h-10 text-xs text-danger underline-offset-4 hover:underline focus-ring px-2 py-1 rounded-control"
                      onClick={() => openEditor(row, true)}
                    >
                      Cabut persetujuan
                    </button>
                  )}
                </div>
              ) : null
            }
          />
        )}
        emptyState={
          <EmptyState
            icon={ShieldAlert}
            title="Belum ada catatan persetujuan."
            description="Catatan persetujuan terbentuk secara otomatis saat pendaftaran peserta didik diterima."
          />
        }
      />

      <Dialog
        open={Boolean(editingConsent)}
        onOpenChange={(open) => {
          if (!open) setEditingConsent(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perbarui persetujuan</DialogTitle>
            <DialogDescription>
              Perbarui status Persetujuan Data atau Persetujuan Foto & Video
              untuk{" "}
              <strong className="text-foreground">
                {editingConsent?.studentFullName}
              </strong>
              . {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveConsent}>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-personal-consent"
                  className="block text-sm font-medium text-foreground"
                >
                  Persetujuan Data
                </label>
                <select
                  id="edit-personal-consent"
                  value={draftPersonal}
                  onChange={(e) =>
                    setDraftPersonal(e.target.value as ConsentStatus)
                  }
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                >
                  <option value="GRANTED">
                    {CONSENT_STATUS_META.GRANTED.label}
                  </option>
                  <option value="DENIED">
                    {CONSENT_STATUS_META.DENIED.label}
                  </option>
                  <option value="REVOKED">
                    {CONSENT_STATUS_META.REVOKED.label}
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-photo-consent"
                  className="block text-sm font-medium text-foreground"
                >
                  Persetujuan Foto & Video
                </label>
                <select
                  id="edit-photo-consent"
                  value={draftPhoto}
                  onChange={(e) =>
                    setDraftPhoto(e.target.value as ConsentStatus)
                  }
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                >
                  <option value="GRANTED">
                    {CONSENT_STATUS_META.GRANTED.label}
                  </option>
                  <option value="DENIED">
                    {CONSENT_STATUS_META.DENIED.label}
                  </option>
                  <option value="REVOKED">
                    {CONSENT_STATUS_META.REVOKED.label}
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-consent-notes"
                  className="block text-sm font-medium text-foreground"
                >
                  Catatan atau alasan perubahan{" "}
                  {(draftPersonal === "REVOKED" || draftPhoto === "REVOKED") &&
                    "*"}
                </label>
                <Textarea
                  id="edit-consent-notes"
                  rows={3}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Tuliskan keterangan bukti persetujuan atau alasan pencabutan izin..."
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingConsent(null)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan keputusan persetujuan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


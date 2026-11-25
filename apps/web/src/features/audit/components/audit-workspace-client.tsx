"use client";

import * as React from "react";
import { Eye, History, Lock } from "lucide-react";
import { EmptyState } from "@/components/compositions";
import {
  DataTable,
  DecisionHistory,
  MobileCardList,
  PageHeader,
  SearchToolbar,
  SummaryStrip,
  type DataTableColumn,
} from "@/components/patterns";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
} from "@/components/ui";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
import { formatDateID } from "@/utils/date-formatter";
import {
  AUDIT_ENTITY_META,
  getAuditEntityLabel,
} from "@/lib/status";
import {
  AUDIT_ACTION_LABELS,
  type AuditLogItemDTO,
  type AuditLogListResultDTO,
} from "../types/audit-types";

export interface AuditWorkspaceClientProps {
  listResult: AuditLogListResultDTO;
  initialSearch: string;
  initialAction: string;
  initialEntityType: string;
}

export function AuditWorkspaceClient({
  listResult,
  initialSearch,
  initialAction,
  initialEntityType,
}: AuditWorkspaceClientProps) {
  const { updateQuery: updateUrl, pathname, router } = useUrlQueryParams();

  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [selectedLog, setSelectedLog] = React.useState<AuditLogItemDTO | null>(
    null
  );

  React.useEffect(() => {
    if (searchInput === initialSearch) return;
    const t = window.setTimeout(() => {
      updateUrl({ search: searchInput.trim() || null, page: "1" });
    }, 300);
    return () => window.clearTimeout(t);
  }, [initialSearch, searchInput, updateUrl]);

  const columns: DataTableColumn<AuditLogItemDTO>[] = [
    {
      id: "timestamp",
      header: "Waktu tercatat",
      cell: (row) => (
        <div className="space-y-0.5 text-xs font-mono">
          <p className="text-foreground">
            {new Date(row.createdAt).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {row.syncedAt && (
            <p className="text-[11px] text-muted-foreground">
              Sinkron offline
            </p>
          )}
        </div>
      ),
    },
    {
      id: "actor",
      header: "Pelaku",
      cell: (row) => (
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-foreground">{row.actorName}</p>
          {row.actorId && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {row.actorId.slice(0, 8)}...
            </p>
          )}
        </div>
      ),
    },
    {
      id: "action",
      header: "Peristiwa",
      cell: (row) => (
        <div className="space-y-1">
          <Badge variant="neutral" size="sm">
            {row.actionLabel}
          </Badge>
          <p className="text-xs text-foreground leading-relaxed">
            {row.description}
          </p>
        </div>
      ),
    },
    {
      id: "entity",
      header: "Entitas & ID",
      cell: (row) => (
        <div className="space-y-0.5 text-xs font-mono">
          <p className="text-secondary-foreground">{row.entityType}</p>
          <p className="text-muted-foreground">{row.entityId.slice(0, 13)}</p>
        </div>
      ),
    },
    {
      id: "detail",
      header: "Detail",
      align: "right",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(row)}
          aria-label={`Buka riwayat audit ${row.actionLabel}`}
          leftIcon={<Icon icon={Eye} size="xs" />}
        >
          Riwayat Audit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jejak Audit"
        description="Catatan peristiwa sistem yang bersifat baca-saja (read-only) dan tidak dapat diubah maupun dihapus oleh peran manapun."
      />

      <SummaryStrip
        items={[
          {
            id: "total-logs",
            label: "Total catatan terfilter",
            value: `${listResult.totalCount} peristiwa`,
          },
          {
            id: "immutability",
            label: "Integritas penyimpanan",
            value: "Append-only (Trigger PG17)",
          },
          {
            id: "access-mode",
            label: "Mode akses",
            value: "Baca-saja (Online Tier C)",
          },
        ]}
        ariaLabel="Ringkasan jejak audit"
        bordered
      />

      <div className="rounded-control border border-border bg-surface-subtle/60 px-4 py-3 text-xs text-secondary-foreground flex items-center gap-2.5">
        <Icon icon={Lock} size="sm" className="text-primary shrink-0" />
        <span>
          Seluruh entri jejak audit dilindungi oleh pemicu basis data
          PostgreSQL. Tidak ada pengguna—termasuk Administrator Platform—yang
          dapat mengubah atau menghapus riwayat audit.
        </span>
      </div>

      <SearchToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari deskripsi atau ID entitas..."
        filterCount={
          (initialAction !== "ALL" ? 1 : 0) +
          (initialEntityType !== "ALL" ? 1 : 0)
        }
        onResetAll={() => {
          setSearchInput("");
          router.push(pathname);
        }}
        desktopFilters={
          <>
            <select
              aria-label="Filter jenis peristiwa audit"
              value={initialAction}
              onChange={(e) =>
                updateUrl({ action: e.target.value, page: "1" })
              }
              className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
            >
              <option value="ALL">Semua peristiwa</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter jenis entitas"
              value={initialEntityType}
              onChange={(e) =>
                updateUrl({ entityType: e.target.value, page: "1" })
              }
              className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
            >
              <option value="ALL">Semua entitas</option>
              {Object.entries(AUDIT_ENTITY_META).map(([code, meta]) => (
                <option key={code} value={code}>
                  {meta.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={listResult.items}
        getRowKey={(row) => row.id}
        caption="Tabel jejak audit sistem PMKI"
        renderMobileRow={(row) => (
          <MobileCardList
            title={
              <span className="text-sm font-semibold text-foreground">
                {getAuditEntityLabel(row.entityType)} ·{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {row.entityId ? row.entityId.slice(0, 8) : ""}
                </span>
              </span>
            }
            badge={
              <span className="text-[11px] font-mono text-muted-foreground">
                {formatDateID(row.createdAt, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            }
            primaryMeta={
              <div className="space-y-1">
                <div>
                  <Badge variant="neutral" size="sm">
                    {row.actionLabel}
                  </Badge>
                </div>
                <p className="text-xs text-secondary-foreground">
                  Oleh: <strong className="text-foreground">{row.actorName}</strong>
                </p>
              </div>
            }
            secondaryMeta={
              <p className="text-xs text-foreground leading-relaxed">
                {row.description}
              </p>
            }
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-10 text-xs text-secondary-foreground hover:text-foreground"
                onClick={() => setSelectedLog(row)}
              >
                Riwayat Audit →
              </Button>
            }
          />
        )}
        emptyState={
          <EmptyState
            icon={History}
            title="Belum ada catatan jejak audit."
            description="Peristiwa operasional dan perubahan tata kelola akan tercatat secara otomatis di halaman ini."
          />
        }
      />

      {listResult.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2 text-xs text-secondary-foreground">
          <span>
            Halaman {listResult.page} dari {listResult.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={listResult.page <= 1}
              onClick={() =>
                updateUrl({ page: String(listResult.page - 1) })
              }
            >
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={listResult.page >= listResult.totalPages}
              onClick={() =>
                updateUrl({ page: String(listResult.page + 1) })
              }
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {/* Dialog: Riwayat Audit (Detail view) */}
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Riwayat Audit</DialogTitle>
            <DialogDescription>
              Rincian catatan jejak audit permanen untuk peristiwa{" "}
              <strong className="text-foreground">
                {selectedLog?.actionLabel}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <DialogBody className="space-y-4">
              <DecisionHistory
                entries={[
                  {
                    id: selectedLog.id,
                    stageLabel: selectedLog.actionLabel,
                    decisionLabel: selectedLog.entityType,
                    decisionTone: "info",
                    actorName: selectedLog.actorName,
                    timestamp: new Date(selectedLog.createdAt).toLocaleString(
                      "id-ID"
                    ),
                    comment: selectedLog.description,
                  },
                ]}
              />

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-control border border-border bg-surface-subtle/50 p-3.5 text-xs">
                <div>
                  <dt className="text-muted-foreground">ID catatan audit</dt>
                  <dd className="font-mono text-foreground mt-0.5 break-all">
                    {selectedLog.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">ID entitas</dt>
                  <dd className="font-mono text-foreground mt-0.5 break-all">
                    {selectedLog.entityId}
                  </dd>
                </div>
                {selectedLog.originalTimestamp && (
                  <div>
                    <dt className="text-muted-foreground">Waktu asal aksi</dt>
                    <dd className="font-mono text-foreground mt-0.5">
                      {new Date(selectedLog.originalTimestamp).toLocaleString(
                        "id-ID"
                      )}
                    </dd>
                  </div>
                )}
                {selectedLog.syncedAt && (
                  <div>
                    <dt className="text-muted-foreground">
                      Waktu sinkronisasi
                    </dt>
                    <dd className="font-mono text-foreground mt-0.5">
                      {new Date(selectedLog.syncedAt).toLocaleString("id-ID")}
                    </dd>
                  </div>
                )}
              </dl>
            </DialogBody>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedLog(null)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


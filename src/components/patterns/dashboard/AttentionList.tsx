import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge, Icon } from '../../ui/index.ts';
import type { DashboardAttentionItem } from './dashboardData.ts';

export interface AttentionListProps {
  items: DashboardAttentionItem[];
  onNavigate: (destination: string) => void;
}

/**
 * AttentionList (Sections 6, 17, 19, 20 of UI-UX-DESIGN-SYSTEM.md)
 * Displays real actionable items derived from application state and filtered by RBAC permissions.
 */
export const AttentionList: React.FC<AttentionListProps> = ({
  items,
  onNavigate,
}) => {
  return (
    <section aria-labelledby="dashboard-attention-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 id="dashboard-attention-heading" className="type-h3 text-foreground">
            Perlu perhatian
          </h2>
          <p className="type-caption text-secondary-foreground mt-0.5">
            Tindak lanjut operasional berdasarkan wewenang peran Anda saat ini
          </p>
        </div>
        {items.length > 0 && (
          <Badge variant="warning" dot>
            {items.length} kategori
          </Badge>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-card bg-surface border border-border px-5 py-6 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-pill bg-success-soft text-success flex items-center justify-center shrink-0 mt-0.5">
            <Icon icon={CheckCircle2} size="sm" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              Tidak ada hal mendesak yang menunggu tindakan Anda
            </p>
            <p className="type-caption text-secondary-foreground leading-relaxed">
              Seluruh antrean verifikasi, pencatatan presensi, dan peninjauan dalam cakupan tugas Anda telah mutakhir.
            </p>
          </div>
        </div>
      ) : (
        <ul
          role="list"
          className="rounded-card bg-surface border border-border divide-y divide-border overflow-hidden"
        >
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.destination)}
                className="group w-full text-left px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle/75 transition-colors cursor-pointer focus-ring"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.variant} size="sm" dot>
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
                  <Icon
                    icon={ArrowRight}
                    size="xs"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};


"use client";

import * as React from "react";
import { Badge, Icon } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { getPermissionLabel } from "@/lib/status";
import type { MyProfileViewDTO } from "../services/auth-service";

export interface ProfileAccessTabProps {
  profile: MyProfileViewDTO;
}

export function ProfileAccessTab({ profile }: ProfileAccessTabProps) {
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
    () => new Set()
  );

  function toggleModule(moduleKey: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-card border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Icon
              icon={ICON_MAP.shieldCheck}
              size="sm"
              className="text-primary"
            />
            <h2 className="text-sm font-semibold text-foreground">
              Peran yang dipegang
            </h2>
          </div>
          {profile.roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((r) => (
                <Badge key={r.code} variant="primary" size="sm">
                  {r.label}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-secondary-foreground">
              Belum ada peran yang ditetapkan pada akun ini.
            </p>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Peran dan hak akses dikelola oleh Administrator Platform sesuai
            kebutuhan tugas Anda.
          </p>
        </section>

        <section className="rounded-card border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Icon icon={ICON_MAP.lokasi} size="sm" className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Lingkup unit layanan
            </h2>
          </div>
          {profile.memberships.length > 0 ? (
            <ul className="space-y-2">
              {profile.memberships.map((m) => (
                <li
                  key={`${m.organizationId}-${m.serviceUnitId}`}
                  className="rounded-control border border-border-subtle bg-surface-subtle/40 px-3 py-2 text-xs"
                >
                  <p className="font-medium text-foreground">
                    {m.serviceUnitName}
                  </p>
                  <p className="text-muted-foreground">{m.organizationName}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-secondary-foreground">
              Belum ada lingkup unit layanan yang ditetapkan.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-card border border-border bg-surface p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-foreground">
              Kewenangan akses Anda
            </h2>
            <p className="text-xs text-secondary-foreground">
              Pilih modul untuk melihat rincian hak akses aktif Anda.
            </p>
          </div>
          <Badge variant="neutral" size="sm">
            {profile.totalPermissions} izin aktif
          </Badge>
        </div>

        {profile.permissionGroups.length === 0 ? (
          <p className="text-xs text-secondary-foreground">
            Akun ini belum memiliki hak akses modul yang aktif.
          </p>
        ) : (
          <div className="rounded-control border border-border divide-y divide-border">
            {profile.permissionGroups.map((group) => {
              const isExpanded = expandedModules.has(group.moduleKey);
              return (
                <div key={group.moduleKey} className="bg-surface">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleModule(group.moduleKey)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-surface-subtle/50 transition-colors cursor-pointer focus-ring"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {group.moduleLabel}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <Badge variant="neutral" size="sm">
                        {group.permissions.length} izin
                      </Badge>
                      <span className="hidden sm:inline text-xs text-primary font-medium">
                        {isExpanded ? "Tutup" : "Lihat detail"}
                      </span>
                      <Icon
                        icon={ICON_MAP.chevronRight}
                        size="xs"
                        className={
                          isExpanded
                            ? "text-muted-foreground rotate-90 transition-transform duration-150"
                            : "text-muted-foreground transition-transform duration-150"
                        }
                      />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3.5 pt-1 border-t border-border-subtle bg-surface-subtle/30">
                      <ul className="flex flex-wrap gap-1.5 pt-2">
                        {group.permissions.map((perm) => (
                          <li
                            key={perm}
                            className="inline-flex items-center gap-1.5 rounded-pill bg-surface px-2.5 py-1 border border-border-subtle text-xs text-foreground font-medium"
                          >
                            <Icon
                              icon={ICON_MAP.centang}
                              size="xs"
                              className="text-primary shrink-0"
                            />
                            <span>{getPermissionLabel(perm)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}


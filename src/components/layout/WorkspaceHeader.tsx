import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { Role, User } from '../../types/index.ts';
import { Avatar, Button, Icon } from '../ui/index.ts';
import { ThemePicker } from './ThemePicker.tsx';

export const ROLE_LABELS: Record<Role, string> = {
  PLATFORM_ADMIN: 'Platform Administrator',
  ORG_ADMIN: 'Admin Organisasi',
  UNIT_COORDINATOR: 'Koordinator Unit',
  PROGRAM_COORDINATOR: 'Koordinator Program',
  TEACHER: 'Pengajar / Guru Relawan',
  VOLUNTEER: 'Relawan Pendamping',
  EDITOR: 'Penyusun Konten',
  REVIEWER: 'Peninjau Privasi',
  APPROVER: 'Pejabat Penyetuju',
  AUDITOR: 'Auditor Independen',
  STAKEHOLDER: 'Pemangku Kepentingan',
};

export interface WorkspaceHeaderProps {
  currentViewLabel: string;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  onOpenMobileMenu: () => void;
  onBackToPublic: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  currentViewLabel,
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenMobileMenu,
  onBackToPublic,
}) => {
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleSwitcherOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setRoleSwitcherOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRoleSwitcherOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [roleSwitcherOpen]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/95 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
      {/* Left: Mobile/Tablet Drawer Trigger + Service Location Context */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Buka menu navigasi"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-10 w-10 shrink-0"
        >
          <Icon icon={Menu} size="lg" />
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-secondary-foreground">
            <span className="truncate font-medium">
              Rumah Belajar Griya Asih Lawang
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-muted-foreground">
              •
            </span>
            <span className="hidden sm:inline text-muted-foreground">
              TA 2026/2027
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground truncate">
            {currentViewLabel}
          </p>
        </div>
      </div>

      {/* Right: Genuinely Global Controls (Theme, Public Link, Account/RBAC Switcher) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemePicker className="hidden sm:inline-flex" />

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Icon icon={ArrowLeft} size="xs" />}
          onClick={onBackToPublic}
          className="hidden md:inline-flex"
        >
          Web Publik
        </Button>

        {/* Account & RBAC Persona Switcher */}
        <div ref={switcherRef} className="relative">
          <button
            type="button"
            onClick={() => setRoleSwitcherOpen((prev) => !prev)}
            aria-expanded={roleSwitcherOpen}
            aria-haspopup="menu"
            aria-label={`Akun aktif: ${currentUser.name} (${
              ROLE_LABELS[currentUser.role] || currentUser.role
            }). Klik untuk mengganti peran uji coba.`}
            className="min-h-10 flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-pill border border-border bg-surface hover:bg-surface-subtle transition-colors cursor-pointer focus-ring"
          >
            <Avatar name={currentUser.name} size="sm" />
            <div className="hidden sm:block text-left leading-tight">
              <span className="block text-xs font-semibold text-foreground max-w-36 truncate">
                {currentUser.name}
              </span>
              <span className="block text-[10px] font-medium text-primary">
                {ROLE_LABELS[currentUser.role] || currentUser.role}
              </span>
            </div>
            <Icon
              icon={ChevronDown}
              size="xs"
              className={`text-muted-foreground transition-transform ${
                roleSwitcherOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {roleSwitcherOpen && (
            <div
              role="menu"
              aria-label="Pilih Peran Uji Coba (RBAC)"
              className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-card bg-surface border border-border shadow-overlay p-2 z-50 animate-dropdown"
            >
              <div className="px-3 py-2 border-b border-border-subtle mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Icon icon={ShieldCheck} size="xs" className="text-primary" />
                  <span>Simulasi Akses Peran (RBAC)</span>
                </div>
                <p className="text-[11px] text-secondary-foreground mt-0.5">
                  Pilih akun demo untuk mengevaluasi hak akses & pemisahan tugas.
                </p>
              </div>

              <div className="space-y-0.5 max-h-72 overflow-y-auto">
                {allUsers.map((u) => {
                  const isSelected = currentUser.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => {
                        onSwitchUser(u);
                        setRoleSwitcherOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-control text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer focus-ring ${
                        isSelected
                          ? 'bg-primary-soft text-primary font-semibold'
                          : 'text-foreground hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={u.name} size="xs" />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{u.name}</p>
                          <p className="text-[11px] text-secondary-foreground truncate">
                            {ROLE_LABELS[u.role] || u.role} • {u.email}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Icon
                          icon={Check}
                          size="sm"
                          className="text-primary shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


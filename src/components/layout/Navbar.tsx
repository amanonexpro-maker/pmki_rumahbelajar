/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
  HeartHandshake,
} from 'lucide-react';
import { ThemePicker } from './ThemePicker.tsx';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenDashboard,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'tentang', label: 'Tentang Kami' },
    { id: 'program', label: 'Program & Kelas' },
    { id: 'jadwal', label: 'Jadwal' },
    { id: 'galeri', label: 'Dokumentasi' },
    { id: 'berita', label: 'Berita & Agenda' },
    { id: 'pendaftaran', label: 'Pendaftaran' },
    { id: 'kontak', label: 'Kontak' },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      {/* Top Institutional Service Context Strip */}
      <div className="bg-surface-subtle text-secondary-foreground border-b border-border-subtle">
        <div className="max-w-7xl mx-auto flex min-h-8 items-center justify-between gap-4 px-4 text-xs sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 text-primary font-medium">
            <HeartHandshake className="w-3.5 h-3.5" />
            PMKI Mupel Jawa Timur
          </span>
          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <span className="hidden md:inline text-secondary-foreground">
              Pelayanan Pendidikan Kasih & Karakter Bangsa
            </span>
            <span className="hidden sm:inline font-semibold text-warning tracking-wide">
              "Dare to be Great" <span className="font-normal text-muted-foreground">(Berani Menjadi Unggul)</span>
            </span>
            <ThemePicker className="text-secondary-foreground hover:text-foreground" />
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Brand Logo & Motto */}
          <button
            type="button"
            onClick={() => handleNavClick('beranda')}
            className="group flex min-w-0 shrink-0 cursor-pointer select-none items-center gap-3 text-left focus-ring rounded-control p-1"
            aria-label="Rumah Belajar Griya Asih - Beranda"
          >
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-base sm:text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  Rumah Belajar Griya Asih
                </span>
                <span className="hidden lg:inline-flex rounded-pill bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/15">
                  Lawang
                </span>
              </div>
              <p className="whitespace-nowrap text-xs font-medium text-secondary-foreground">
                Ayo Belajar & Tumbuh Bersama!
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav aria-label="Navigasi utama" className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-control px-2.5 py-1.5 text-xs 2xl:text-[13px] font-medium transition-colors focus-ring ${
                    isActive
                      ? 'text-primary bg-primary-soft font-semibold'
                      : 'text-secondary-foreground hover:text-foreground hover:bg-surface-subtle'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Internal Portal Link (Restrained & Secondary) */}
          <div className="hidden shrink-0 items-center gap-3 xl:flex">
            <button
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border px-3.5 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.985] focus-ring"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
              <span>Portal Pengurus</span>
            </button>
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            <button
              onClick={onOpenDashboard}
              aria-label="Portal Pengurus & Guru"
              title="Portal Pengurus & Guru"
              className="rounded-control border border-border p-2 text-secondary-foreground hover:text-foreground hover:bg-surface-subtle focus-ring"
            >
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-control p-2 text-secondary-foreground hover:text-foreground hover:bg-surface-subtle focus-ring"
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="border-b border-border bg-surface px-4 pb-6 pt-3 shadow-overlay animate-in slide-in-from-top duration-200 xl:hidden">
          <div className="grid grid-cols-2 gap-2 border-b border-border-subtle pb-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                aria-current={currentTab === link.id ? 'page' : undefined}
                className={`text-left px-3 py-2.5 rounded-control text-sm font-medium transition-colors ${
                  currentTab === link.id
                    ? 'bg-primary-soft font-bold text-primary'
                    : 'text-secondary-foreground hover:bg-surface-subtle hover:text-foreground'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDashboard();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-control bg-surface-subtle hover:bg-surface text-foreground border border-border font-semibold text-xs shadow-xs focus-ring"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span>Akses Portal Internal Pengurus & Guru</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

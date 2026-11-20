/**
 * Institutional Signature Footer (Fase 13g, UI-UX §28, 03 §9).
 * Pure text signature block (< 60px height) without interactive links or graphic logos.
 * Primary navigation is exclusively served by PublicBottomNav (< md) and PublicNavbar (>= md).
 */
export function PublicFooter() {
  return (
    <footer className="border-t border-border-subtle py-6 text-center">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Rumah Belajar Griya Asih
        </p>
        <p className="text-xs text-muted-foreground">
          © 2026 PMKI Hub — Bersama Melayani, Bersama Bertumbuh
        </p>
      </div>
    </footer>
  );
}

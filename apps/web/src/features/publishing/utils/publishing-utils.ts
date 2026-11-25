import type { WorkflowStageItem } from "@/components/patterns";
import { PUBLICATION_STATUS_META, type PublicationStatus } from "@/lib/status";
import type { PublicationCategoryCode } from "../types/publishing-types";

export const PUBLICATION_DRAFT_STORAGE_KEY = "pmki_draft_pub_new";

export interface LocalPublicationDraft {
  title: string;
  category: PublicationCategoryCode;
  excerpt: string;
  content: string;
  coverMediaId: string;
}

export function buildPublicationStages(
  status: PublicationStatus
): WorkflowStageItem[] {
  const steps: Array<{
    id: PublicationStatus;
    label: string;
    actorHint: string;
  }> = [
    {
      id: "DRAFT",
      label: PUBLICATION_STATUS_META.DRAFT.label,
      actorHint: "Penyusun Konten",
    },
    {
      id: "PRIVACY_REVIEW",
      label: PUBLICATION_STATUS_META.PRIVACY_REVIEW.label,
      actorHint: "Peninjau",
    },
    {
      id: "APPROVED",
      label: PUBLICATION_STATUS_META.APPROVED.label,
      actorHint: "Siap terbit",
    },
    {
      id: "PUBLISHED",
      label: PUBLICATION_STATUS_META.PUBLISHED.label,
      actorHint: "Pejabat Penyetuju (SoD)",
    },
  ];

  if (status === "ARCHIVED") {
    return steps.map((s) => ({ ...s, state: "archived" }));
  }

  const currentIdx = steps.findIndex((s) => s.id === status);
  return steps.map((s, idx) => ({
    ...s,
    state:
      status === "PUBLISHED" || idx < currentIdx
        ? "completed"
        : idx === currentIdx
          ? "current"
          : "upcoming",
  }));
}

export function loadLocalPublicationDraft(): Partial<LocalPublicationDraft> | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(PUBLICATION_DRAFT_STORAGE_KEY);
    if (!saved) return null;
    const parsed: Partial<LocalPublicationDraft> = JSON.parse(saved);
    if (
      parsed.title?.trim() ||
      parsed.content?.trim() ||
      parsed.excerpt?.trim()
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLocalPublicationDraft(payload: LocalPublicationDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PUBLICATION_DRAFT_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // Silently catch quota exceeded or private mode errors
  }
}

export function clearLocalPublicationDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PUBLICATION_DRAFT_STORAGE_KEY);
  } catch {
    // Storage unavailable
  }
}


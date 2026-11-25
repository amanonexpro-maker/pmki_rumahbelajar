"use client";

import * as React from "react";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import {
  confirmMediaUploadAction,
  createMediaUploadUrlAction,
} from "../actions/media-actions";
import type { MediaCategoryCode } from "../types/media-types";

export interface MediaUploadMetadata {
  title: string;
  description?: string;
  category: MediaCategoryCode;
  capturedDate: string;
}

type AllowedMediaMimeType = "image/jpeg" | "image/png" | "image/webp";

/**
 * Manages the 3-step private bucket upload flow (signed URL -> direct PUT -> confirmation)
 * with Tier C offline guard, unmount safety, and AbortController cancellation.
 *
 * @returns `{ startUpload, isUploading, uploadError, resetError }`
 */
export function useMediaUpload() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const { withTierCGuard } = useTierCGuard(
    "Tata Kelola & Persetujuan Laporan",
    (message) => {
      if (isMountedRef.current) {
        setUploadError(message);
      }
    }
  );

  const resetError = React.useCallback(() => {
    setUploadError(null);
  }, []);

  const startUpload = React.useCallback(
    async (file: File, metadata: MediaUploadMetadata): Promise<boolean> => {
      if (isUploading) return false;

      const result = await withTierCGuard(async () => {
        const fileName = file.name;
        const mimeType = file.type as AllowedMediaMimeType;
        const fileSize = file.size;

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsUploading(true);
        setUploadError(null);

        try {
          // Step 1: Server Action generates signed upload URL in private bucket "media"
          const urlRes = await createMediaUploadUrlAction({
            fileName,
            mimeType,
            fileSize,
          });
          if (!urlRes.success) {
            if (isMountedRef.current) {
              setUploadError(urlRes.error.message);
            }
            return false;
          }

          // Step 2: Client PUTs file directly to Supabase Storage signed upload URL
          const putRes = await fetch(urlRes.data.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": mimeType },
            body: file,
            signal: controller.signal,
          });
          if (!putRes.ok) {
            if (isMountedRef.current) {
              setUploadError("Gagal mengunggah berkas ke penyimpanan privat.");
            }
            return false;
          }

          // Step 3: Server Action confirms upload, persists media_assets row + audit log
          const confirmRes = await confirmMediaUploadAction({
            title: metadata.title,
            description: metadata.description?.trim() || null,
            filePath: urlRes.data.filePath,
            mimeType,
            fileSize,
            category: metadata.category,
            capturedDate: metadata.capturedDate || null,
          });

          if (!confirmRes.success) {
            if (isMountedRef.current) {
              setUploadError(confirmRes.error.message);
            }
            return false;
          }

          return true;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            return false;
          }
          if (isMountedRef.current) {
            setUploadError("Gagal mengunggah berkas ke penyimpanan privat.");
          }
          return false;
        } finally {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
          if (isMountedRef.current) {
            setIsUploading(false);
          }
        }
      });

      return Boolean(result);
    },
    [isUploading, withTierCGuard]
  );

  return {
    startUpload,
    isUploading,
    uploadError,
    resetError,
  };
}


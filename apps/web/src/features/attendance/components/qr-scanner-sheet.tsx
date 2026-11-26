"use client";

import * as React from "react";
import jsQR from "jsqr";
import { Camera, CheckCircle2 } from "lucide-react";
import { FormBottomSheet } from "@/components/patterns";
import { Badge, Button, Icon } from "@/components/ui";
import { parseStudentQrPayload } from "@/lib/student-qr";

export interface QrScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanRegistrationNumber: (
    registrationNumber: string
  ) => { ok: true; label: string } | { ok: false; message: string };
}

export function QrScannerSheet({
  open,
  onOpenChange,
  onScanRegistrationNumber,
}: QrScannerSheetProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const lastScannedRef = React.useRef<{ code: string; at: number } | null>(null);

  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [scanResult, setScanResult] = React.useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [scannedCount, setScannedCount] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;

    let active = true;
    let stream: MediaStream | null = null;
    let timerId: number | null = null;

    async function startCamera() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(
          "Kamera tidak didukung pada perangkat atau browser ini. Gunakan pencarian manual di tab Presensi cepat."
        );
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        timerId = window.setInterval(() => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState !== 4) return;
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (!w || !h) return;

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const qr = jsQR(imageData.data, w, h, {
            inversionAttempts: "dontInvert",
          });
          if (!qr?.data) return;

          const regNo = parseStudentQrPayload(qr.data);
          if (!regNo) {
            setScanResult({
              ok: false,
              text: "Kode QR tidak berasal dari kartu peserta didik Rumah Belajar.",
            });
            return;
          }

          const now = Date.now();
          if (
            lastScannedRef.current &&
            lastScannedRef.current.code === regNo &&
            now - lastScannedRef.current.at < 1800
          ) {
            return;
          }
          lastScannedRef.current = { code: regNo, at: now };

          const matched = onScanRegistrationNumber(regNo);
          if (matched.ok) {
            setScannedCount((c) => c + 1);
            setScanResult({
              ok: true,
              text: `Hadir: ${matched.label}`,
            });
          } else {
            setScanResult({
              ok: false,
              text: matched.message,
            });
          }
        }, 180);
      } catch {
        if (active) {
          setCameraError(
            "Izin kamera ditolak atau kamera tidak tersedia. Gunakan pencarian manual di tab Presensi cepat."
          );
        }
      }
    }

    void startCamera();

    return () => {
      active = false;
      if (timerId !== null) window.clearInterval(timerId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [open, onScanRegistrationNumber]);

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setScanResult(null);
          setCameraError(null);
          setScannedCount(0);
          lastScannedRef.current = null;
        }
        onOpenChange(nextOpen);
      }}
      title="Pindai QR kartu peserta didik"
      description="Arahkan kamera ke QR Code pada kartu peserta didik untuk menandai Hadir secara otomatis."
      footer={(_, isMobile) => (
        <div className="flex w-full justify-end">
          <Button
            type="button"
            variant="primary"
            onClick={() => onOpenChange(false)}
            className={isMobile ? "w-full min-h-11" : undefined}
          >
            Selesai memindai
          </Button>
        </div>
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-secondary-foreground flex items-center gap-1.5">
            <Icon icon={Camera} size="xs" />
            Pemindai kamera aktif (offline-ready)
          </span>
          <Badge variant="success" size="sm">
            {scannedCount} terpindai
          </Badge>
        </div>

        {cameraError ? (
          <div
            role="alert"
            className="rounded-control border border-danger/30 bg-danger-soft p-4 text-xs text-danger leading-relaxed"
          >
            {cameraError}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-card border border-border bg-black aspect-video">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {scanResult && (
          <div
            role="status"
            aria-live="polite"
            className={
              scanResult.ok
                ? "rounded-control border border-success/30 bg-success-soft px-3.5 py-2.5 text-xs font-semibold text-success flex items-center gap-2"
                : "rounded-control border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-xs font-medium text-warning-foreground"
            }
          >
            {scanResult.ok && (
              <Icon icon={CheckCircle2} size="xs" className="shrink-0" />
            )}
            <span>{scanResult.text}</span>
          </div>
        )}
      </div>
    </FormBottomSheet>
  );
}


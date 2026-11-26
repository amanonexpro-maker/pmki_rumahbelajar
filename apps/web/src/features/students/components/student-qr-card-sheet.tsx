"use client";

import * as React from "react";
import { Download, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { FormBottomSheet } from "@/components/patterns";
import { Badge, Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { buildStudentQrPayload } from "@/lib/student-qr";

export interface StudentQrCardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    fullName: string;
    nickname: string;
    registrationNumber: string;
    educationLevelLabel: string;
    assignedClassName: string | null;
  };
}

const CARD_FOOTER_TEXT = "© 2026 PMKI Hub — Bersama Melayani, Bersama Bertumbuh";

export function StudentQrCardSheet({
  open,
  onOpenChange,
  student,
}: StudentQrCardSheetProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const payload = React.useMemo(
    () => buildStudentQrPayload(student.registrationNumber),
    [student.registrationNumber]
  );

  const classLabel = student.assignedClassName ?? "Belum ditempatkan";

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#163020", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Gagal membuat gambar QR Code peserta didik.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, payload]);

  function handleDownloadPng() {
    if (!qrDataUrl) return;
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#FAF8F5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header band
    ctx.fillStyle = "#1E4D3B";
    ctx.fillRect(0, 0, canvas.width, 108);

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Rumah Belajar Griya Asih", canvas.width / 2, 48);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#D8ECE3";
    ctx.fillText("Kartu Peserta Didik", canvas.width / 2, 78);

    // Student info (non-sensitive only, centered portrait)
    ctx.fillStyle = "#162019";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(student.fullName.slice(0, 28), canvas.width / 2, 162);

    ctx.fillStyle = "#4B5951";
    ctx.font = "17px sans-serif";
    ctx.fillText(`Panggilan: ${student.nickname}`, canvas.width / 2, 196);
    ctx.fillText(
      `No. Pendaftaran: ${student.registrationNumber}`,
      canvas.width / 2,
      230
    );
    ctx.fillText(`Kelas: ${classLabel}`, canvas.width / 2, 264);

    // Footer
    ctx.fillStyle = "#E7ECE8";
    ctx.fillRect(0, 654, canvas.width, 66);
    ctx.fillStyle = "#4B5951";
    ctx.font = "13px sans-serif";
    ctx.fillText(CARD_FOOTER_TEXT, canvas.width / 2, 692);

    // Border
    ctx.strokeStyle = "#D8DDD8";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 272;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 314;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
      ctx.strokeStyle = "#D8DDD8";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      const link = document.createElement("a");
      link.download = `kartu-qr-${student.registrationNumber.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    qrImg.src = qrDataUrl;
  }

  function handlePrintCard() {
    if (!qrDataUrl) return;
    const printWin = window.open("", "_blank", "width=420,height=640");
    if (!printWin) return;
    printWin.document.write(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Kartu Peserta Didik - ${student.fullName}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #162019; display: flex; justify-content: center; }
    .card { width: 320px; border: 2px solid #d0d7d2; border-radius: 16px; overflow: hidden; background: #faf8f5; text-align: center; }
    .hdr { background: #1e4d3b; color: #fff; padding: 18px 16px; }
    .hdr h1 { margin: 0; font-size: 16px; }
    .hdr p { margin: 4px 0 0; font-size: 12px; opacity: .88; }
    .body { padding: 20px 18px; }
    .info h2 { margin: 0 0 6px; font-size: 18px; }
    .info p { margin: 4px 0; font-size: 12px; color: #4b5951; }
    .qr { display: inline-block; margin-top: 16px; background: #fff; padding: 10px; border: 1px solid #d0d7d2; border-radius: 10px; }
    .qr img { width: 176px; height: 176px; display: block; }
    .ftr { background: #e7ece8; padding: 12px 14px; font-size: 10.5px; color: #4b5951; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="hdr">
      <h1>Rumah Belajar Griya Asih</h1>
      <p>Kartu Peserta Didik</p>
    </div>
    <div class="body">
      <div class="info">
        <h2>${student.fullName}</h2>
        <p>Panggilan: <strong>${student.nickname}</strong></p>
        <p>No. Pendaftaran: <strong>${student.registrationNumber}</strong></p>
        <p>Kelas: <strong>${classLabel}</strong></p>
      </div>
      <div class="qr"><img src="${qrDataUrl}" alt="QR Code ${student.fullName}" /></div>
    </div>
    <div class="ftr">${CARD_FOOTER_TEXT}</div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    printWin.document.close();
  }

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Kartu peserta didik"
      description="Unduh atau cetak kartu portrait ini untuk identitas dan presensi cepat peserta didik di Rumah Belajar."
      footer={(_, isMobile) => (
        <div
          className={cn(
            "flex gap-2 w-full",
            isMobile ? "flex-col-reverse" : "justify-end"
          )}
        >
          <Button
            type="button"
            variant="secondary"
            disabled={!qrDataUrl}
            onClick={handlePrintCard}
            leftIcon={<Icon icon={Printer} size="xs" />}
            className={isMobile ? "w-full min-h-11" : undefined}
          >
            Cetak kartu
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!qrDataUrl}
            onClick={handleDownloadPng}
            leftIcon={<Icon icon={Download} size="xs" />}
            className={isMobile ? "w-full min-h-11" : undefined}
          >
            Unduh kartu (PNG)
          </Button>
        </div>
      )}
    >
      <div className="space-y-3">
        {error && (
          <div
            role="alert"
            className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
          >
            {error}
          </div>
        )}

        <div className="mx-auto max-w-[300px] rounded-card border border-border bg-surface overflow-hidden text-center">
          <div className="bg-primary px-4 py-3.5 text-primary-foreground">
            <div className="flex items-center justify-center gap-1.5">
              <Icon icon={QrCode} size="sm" aria-hidden="true" />
              <p className="text-sm font-semibold">Rumah Belajar Griya Asih</p>
            </div>
            <p className="text-xs opacity-90 mt-0.5">Kartu Peserta Didik</p>
          </div>

          <div className="p-5 space-y-3 bg-surface-subtle/50">
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {student.fullName}
              </p>
              <p className="text-xs text-secondary-foreground">
                Panggilan: <strong>{student.nickname}</strong>
              </p>
              <p className="text-xs font-mono text-foreground">
                {student.registrationNumber}
              </p>
              <div className="pt-1 flex justify-center">
                <Badge variant="info" size="sm">
                  Kelas: {classLabel}
                </Badge>
              </div>
            </div>

            <div className="inline-block rounded-control border border-border bg-surface p-2.5">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${student.fullName}`}
                  className="h-40 w-40 object-contain"
                />
              ) : (
                <div className="h-40 w-40 flex items-center justify-center text-xs text-muted-foreground">
                  Memuat QR...
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-surface-subtle px-3 py-2.5 text-[11px] text-secondary-foreground">
            {CARD_FOOTER_TEXT}
          </div>
        </div>
      </div>
    </FormBottomSheet>
  );
}

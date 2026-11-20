"use client";

import * as React from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { publicContactInquirySchema } from "../validators/public-validator";

/**
 * Client-only interactive WhatsApp inquiry composer (`08`: Client Component hanya interaktivitas / browser API).
 */
export function PublicContactForm() {
  const [senderName, setSenderName] = React.useState("");
  const [senderPhone, setSenderPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );
  const [sentSuccess, setSentSuccess] = React.useState(false);

  const handleSendWhatsApp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    const parsed = publicContactInquirySchema.safeParse({
      senderName,
      senderPhone,
      message,
    });

    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ??
          "Mohon periksa kembali isian pesan Anda."
      );
      return;
    }

    const phoneInfo = parsed.data.senderPhone
      ? ` (${parsed.data.senderPhone})`
      : "";
    const text = `Halo Pengurus Rumah Belajar Griya Asih Lawang, nama saya ${parsed.data.senderName}${phoneInfo}. Pesan: ${parsed.data.message}`;
    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/628123235318?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    setSentSuccess(true);
  };

  if (sentSuccess) {
    return (
      <div className="p-6 bg-primary-soft/40 rounded-control border border-primary/20 text-center space-y-3">
        <div className="w-10 h-10 rounded-pill bg-primary text-primary-foreground flex items-center justify-center mx-auto">
          <CheckCircle2 aria-hidden="true" className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-foreground text-base">
          Pesan Anda siap dikirim
        </h4>
        <p className="type-caption text-secondary-foreground">
          Jendela WhatsApp telah dibuka untuk melanjutkan percakapan langsung
          dengan pengurus.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setSentSuccess(false)}
        >
          Tulis pesan baru
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendWhatsApp} className="space-y-4" noValidate>
      {validationError && (
        <div
          role="alert"
          className="p-3 rounded-control bg-danger-soft border border-danger-border text-xs text-danger-foreground font-medium"
        >
          {validationError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="public-inquiry-name"
            className="type-label block text-foreground mb-1.5"
          >
            Nama lengkap Anda
          </label>
          <Input
            id="public-inquiry-name"
            type="text"
            required
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Masukkan nama lengkap"
          />
        </div>
        <div>
          <label
            htmlFor="public-inquiry-phone"
            className="type-label block text-foreground mb-1.5"
          >
            Nomor WhatsApp aktif
          </label>
          <Input
            id="public-inquiry-phone"
            type="tel"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="public-inquiry-message"
          className="type-label block text-foreground mb-1.5"
        >
          Pesan atau pertanyaan
        </label>
        <Textarea
          id="public-inquiry-message"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tuliskan pertanyaan mengenai pendaftaran peserta didik, penempatan kelas, jadwal belajar, atau informasi pengajar relawan..."
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full min-h-11"
      >
        <Send aria-hidden="true" className="w-4 h-4 mr-2" />
        <span>Kirim pesan melalui WhatsApp</span>
      </Button>
    </form>
  );
}


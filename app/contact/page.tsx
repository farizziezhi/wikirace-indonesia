"use client";

import { useState } from "react";
import Link from "next/link";
import {
  House,
  EnvelopeSimple,
  Bug,
  Lightbulb,
  Handshake,
  WarningCircle,
  PaperPlaneRight,
  CheckCircle,
  Spinner,
} from "@phosphor-icons/react";

export default function ContactPage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Hubungi WikiRace Indonesia",
    description:
      "Laporkan bug, beri masukan, atau ajukan ide fitur baru untuk WikiRace Indonesia.",
    url: `${siteUrl}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "WikiRace Indonesia",
      url: siteUrl,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["Indonesian", "English"],
      },
    },
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengirim pesan.");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  return (
    <main className="dot-bg flex min-h-screen flex-col items-center justify-center bg-warm-cream px-6 py-12">
      <div className="w-full max-w-[750px]">
        {/* Back Button */}
        <header className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-text/75 hover:text-charcoal-text font-bold transition text-xs bg-light-beige border border-warm-gray/60 px-4 py-2 rounded-full self-start shadow-[2px_2px_0px_#000] z-10 w-fit hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-[1px_1px_0px_#000]"
          >
            <House size={14} />
            <span>Kembali ke Beranda</span>
          </Link>
        </header>

        {/* Content Card */}
        <section
          className="relative overflow-hidden bg-charcoal-deep text-warm-cream p-6 sm:p-10 flex flex-col gap-6 border-3 border-charcoal-text shadow-[6px_6px_0px_#000]"
          style={{
            borderRadius: "var(--radius-input)",
            paddingTop: "40px",
          }}
        >
          {/* JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
          />

          {/* Header */}
          <div className="border-b border-warm-cream/15 pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-lime-accent text-charcoal-text rounded-2xl border-2 border-charcoal-text shadow-[3px_3px_0px_#000] w-fit shrink-0">
              <EnvelopeSimple size={32} weight="fill" />
            </div>
            <div>
              <h1
                className="font-black text-lime-accent uppercase mb-1"
                style={{
                  fontSize: "clamp(24px, 4.5vw, 32px)",
                  lineHeight: 1.1,
                }}
              >
                Hubungi Kami
              </h1>
              <p className="text-xs text-warm-cream/60 font-mono uppercase tracking-wider">
                Contact Us
              </p>
            </div>
          </div>

          {/* Intro */}
          <div className="text-sm sm:text-base leading-relaxed text-warm-cream/90">
            <p>
              Punya pertanyaan, menemukan bug, atau ingin memberi masukan soal
              WikiRace Indonesia? Kami senang mendengarnya.
            </p>
          </div>

          {/* What You Can Report */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: <Bug size={18} weight="fill" />,
                title: "Bug atau Error",
                desc: "Sertakan screenshot dan langkah untuk mereproduksi.",
                color: "text-burnt-orange",
                bg: "bg-burnt-orange/15 border-burnt-orange/30",
              },
              {
                icon: <Lightbulb size={18} weight="fill" />,
                title: "Saran Fitur",
                desc: "Ide mode permainan baru, perbaikan UI, atau apa pun.",
                color: "text-playdate-yellow",
                bg: "bg-playdate-yellow/15 border-playdate-yellow/30",
              },
              {
                icon: <WarningCircle size={18} weight="fill" />,
                title: "Konten Bermasalah",
                desc: "Artikel Wikipedia bermasalah atau penyalahgunaan platform.",
                color: "text-warm-cream/80",
                bg: "bg-warm-cream/10 border-warm-cream/20",
              },
              {
                icon: <Handshake size={18} weight="fill" />,
                title: "Kerja Sama",
                desc: "Kolaborasi komunitas, sponsorship, atau publikasi.",
                color: "text-lime-accent",
                bg: "bg-lime-accent/15 border-lime-accent/30",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`p-3 rounded-lg border ${item.bg} flex items-start gap-2.5`}
              >
                <span className={`${item.color} shrink-0 mt-0.5`}>
                  {item.icon}
                </span>
                <div>
                  <h3
                    className={`font-black text-xs uppercase ${item.color} mb-0.5`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-warm-cream/70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="border-t border-warm-cream/15 pt-5">
            <h2 className="font-black text-lg text-lime-accent uppercase mb-4">
              Form Kontak
            </h2>

            {status === "success" ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle
                  size={48}
                  weight="fill"
                  className="text-lime-accent"
                />
                <p className="font-black text-lime-accent text-lg">
                  Pesan Terkirim!
                </p>
                <p className="text-sm text-warm-cream/70 max-w-sm">
                  Terima kasih sudah menghubungi kami. Kami akan membaca setiap
                  pesan yang masuk.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="chunky-press btn-white py-2 px-5 text-xs font-extrabold border-2 border-charcoal-text mt-2"
                  style={{ borderRadius: "var(--radius-button)" }}
                >
                  Kirim Pesan Lagi
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-name"
                      className="text-xs font-black uppercase text-warm-cream/60"
                    >
                      Nama
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name: e.target.value }))
                      }
                      className="bg-charcoal-text/30 border-2 border-warm-cream/20 text-warm-cream px-3 py-2.5 text-sm font-bold focus:border-lime-accent focus:outline-none transition"
                      style={{ borderRadius: "var(--radius-subtle)" }}
                      placeholder="Nama kamu"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-email"
                      className="text-xs font-black uppercase text-warm-cream/60"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, email: e.target.value }))
                      }
                      className="bg-charcoal-text/30 border-2 border-warm-cream/20 text-warm-cream px-3 py-2.5 text-sm font-bold focus:border-lime-accent focus:outline-none transition"
                      style={{ borderRadius: "var(--radius-subtle)" }}
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-subject"
                    className="text-xs font-black uppercase text-warm-cream/60"
                  >
                    Subjek
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, subject: e.target.value }))
                    }
                    className="bg-charcoal-text/30 border-2 border-warm-cream/20 text-warm-cream px-3 py-2.5 text-sm font-bold focus:border-lime-accent focus:outline-none transition"
                    style={{ borderRadius: "var(--radius-subtle)" }}
                    placeholder="Laporan Bug / Saran Fitur / Lainnya"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-message"
                    className="text-xs font-black uppercase text-warm-cream/60"
                  >
                    Pesan
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, message: e.target.value }))
                    }
                    className="bg-charcoal-text/30 border-2 border-warm-cream/20 text-warm-cream px-3 py-2.5 text-sm font-bold focus:border-lime-accent focus:outline-none transition resize-none"
                    style={{ borderRadius: "var(--radius-subtle)" }}
                    placeholder="Tulis pesan kamu di sini..."
                  />
                </div>

                {status === "error" && (
                  <div
                    className="bg-burnt-orange/15 text-burnt-orange border border-burnt-orange/30 p-3 text-xs font-mono font-bold"
                    style={{ borderRadius: "var(--radius-subtle)" }}
                  >
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="chunky-press btn-primary py-3 px-5 text-sm font-extrabold border-2 border-charcoal-text flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ borderRadius: "var(--radius-button)" }}
                >
                  {status === "loading" ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <PaperPlaneRight size={16} weight="fill" />
                      Kirim Pesan
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Response Time Note */}
          <div className="bg-charcoal-text/20 border border-warm-cream/10 p-4 text-xs text-warm-cream/60 leading-relaxed" style={{ borderRadius: "var(--radius-subtle)" }}>
            <strong className="text-warm-cream/80">Waktu Respons:</strong> Kami
            adalah tim kecil yang mengembangkan platform ini secara mandiri, jadi
            mohon bersabar jika respons tidak instan. Namun setiap pesan pasti
            kami baca.
          </div>
        </section>
      </div>
    </main>
  );
}

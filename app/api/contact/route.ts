import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validasi dasar
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (typeof message !== "string" || message.length < 10) {
      return NextResponse.json(
        { error: "Pesan terlalu pendek (minimal 10 karakter)." },
        { status: 400 }
      );
    }

    if (typeof message === "string" && message.length > 5000) {
      return NextResponse.json(
        { error: "Pesan terlalu panjang (maksimal 5000 karakter)." },
        { status: 400 }
      );
    }

    // Log pesan ke console untuk backup
    console.log("=== CONTACT FORM SUBMISSION ===");
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log("================================");

    // Kirim ke Discord Webhook jika ada
    const webhookUrl = process.env.DISCORD_CONTACT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const payload = {
          embeds: [
            {
              title: "📩 Pesan Baru dari Form Kontak",
              color: 3066993, // Emerald Green
              fields: [
                {
                  name: "Nama Pengirim",
                  value: name,
                  inline: true,
                },
                {
                  name: "Email",
                  value: email,
                  inline: true,
                },
                {
                  name: "Subjek",
                  value: subject,
                },
                {
                  name: "Pesan",
                  value: message.length > 1000 ? `${message.substring(0, 1000)}... (pesan dipotong)` : message,
                },
              ],
              timestamp: new Date().toISOString(),
              footer: {
                text: "WikiRace Indonesia Contact Form",
              },
            },
          ],
        };

        const discordRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!discordRes.ok) {
          console.error("Gagal mengirim notifikasi ke Discord:", await discordRes.text());
        }
      } catch (err) {
        console.error("Error mengirim notifikasi ke Discord:", err);
      }
    } else {
      console.warn("DISCORD_CONTACT_WEBHOOK_URL belum dikonfigurasi di env.");
    }

    return NextResponse.json(
      { success: true, message: "Pesan berhasil dikirim." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in contact route:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

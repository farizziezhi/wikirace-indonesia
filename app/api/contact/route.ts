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

    // Log pesan ke console (bisa disambungkan ke email service nanti)
    console.log("=== CONTACT FORM SUBMISSION ===");
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log("================================");

    return NextResponse.json(
      { success: true, message: "Pesan berhasil dikirim." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

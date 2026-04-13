// app/api/wallets/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wallets } from '@woilaa/db-mykanz/schema/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// 🚀 POST: Untuk Membuat Wallet Baru (Pengganti createWallet)
export async function POST(req: Request) {
  try {
    // 1. Cek Autentikasi (Sama kayak sebelumnya)
    const user = await getCurrentUser();
    if (!user) {
      // Bedanya: Kita kembalikan error dengan HTTP Status 401 (Unauthorized)
      return NextResponse.json({ error: 'Kamu harus login dulu ya!' }, { status: 401 });
    }

    // 2. Ambil data dari Body (Sekarang kita pakai JSON, bukan FormData lagi!)
    const body = await req.json();
    const { name, type, currency = 'IDR' } = body;

    if (!name || !type) {
      // Bedanya: Error validasi pakai HTTP Status 400 (Bad Request)
      return NextResponse.json({ error: 'Nama dan Tipe dompet wajib diisi!' }, { status: 400 });
    }

    // 3. Simpan ke Database
    const newWallet = await db.insert(wallets).values({
        userId: user.sub,
        name,
        type,
        currency,
    }).returning();

    // 4. BERHASIL! Kita kembalikan data yang baru dibuat dengan Status 201 (Created)
    // PERHATIKAN: Tidak ada lagi revalidatePath! API murni nggak peduli sama tampilan UI.
    return NextResponse.json(
      { success: true, message: 'Dompet berhasil dibuat!', data: newWallet[0] },
      { status: 201 }
    );

  } catch (error) {
    console.error("Gagal membuat dompet via API:", error);
    // Bedanya: Error server pakai HTTP Status 500 (Internal Server Error)
    return NextResponse.json({ error: 'Ups! Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// 🚀 GET: Untuk Mengambil Daftar Wallet (Contoh tambahan biar komplit!)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const walletsList = await db.select()
      .from(wallets)
      .where(and(eq(wallets.userId, user.sub), isNull(wallets.deletedAt)))
      .orderBy(asc(wallets.createdAt));

    return NextResponse.json({ success: true, data: walletsList }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 🚀 PUT: Untuk Mengupdate Dompet (Pengganti updateWallet)
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Kamu harus login dulu ya!' }, { status: 401 });
    }

    // Ambil data dari Body JSON
    const body = await req.json();
    const { id, name, type } = body;

    if (!id || !name || !type) {
      return NextResponse.json({ error: 'Semua field wajib diisi!' }, { status: 400 });
    }

    // Update ke Database
    const updatedWallet = await db.update(wallets)
      .set({ name, type, updatedAt: new Date() })
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.sub)))
      .returning();

    return NextResponse.json(
      { success: true, message: 'Dompet berhasil diupdate!', data: updatedWallet[0] },
      { status: 200 } // Status 200 berarti "OK"
    );
  } catch (error) {
    console.error("Gagal update dompet via API:", error);
    return NextResponse.json({ error: 'Ups! Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// 🚀 DELETE: Untuk Menghapus Dompet (Pengganti deleteWallet)
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Kamu harus login dulu ya!' }, { status: 401 });
    }

    // Trik API: Ambil ID dari URL pencarian (contoh: /api/wallets?id=abc-123)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Dompet wajib dikirim!' }, { status: 400 });
    }

    // Soft Delete (hanya update deleted_at, sesuai logikamu sebelumnya)
    await db.update(wallets)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.sub)));

    return NextResponse.json(
      { success: true, message: 'Dompet berhasil dihapus!' },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal hapus dompet via API:", error);
    return NextResponse.json({ error: 'Ups! Gagal menghapus dompet.' }, { status: 500 });
  }
}

// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@woilaa/db-mykanz/schema/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// POST: Create a new category
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type } = body as { name: string; type: any };

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama kategori wajib diisi!' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Tipe kategori (Pemasukan/Pengeluaran) wajib dipilih!' },
        { status: 400 }
      );
    }

    const newCategory = await db.insert(categories).values({
        userId: user.sub,
        name: name.trim(),
        type,
    }).returning();

    return NextResponse.json(
      { success: true, message: 'Kategori berhasil dibuat!', data: newCategory[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal membuat kategori:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// GET: Get all categories for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoriesList = await db.select()
      .from(categories)
      .where(and(eq(categories.userId, user.sub), isNull(categories.deletedAt)))
      .orderBy(asc(categories.name));

    return NextResponse.json({ success: true, data: categoriesList }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update an existing category
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, type } = body as { id: string; name: string; type: any };

    if (!id || !name || !type) {
      return NextResponse.json(
        { error: 'Data tidak lengkap!' },
        { status: 400 }
      );
    }

    const updatedCategory = await db.update(categories)
      .set({ name: name.trim(), type })
      .where(and(eq(categories.id, id), eq(categories.userId, user.sub)))
      .returning();

    return NextResponse.json(
      { success: true, message: 'Kategori berhasil diupdate!', data: updatedCategory[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal update kategori:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui kategori.' },
      { status: 500 }
    );
  }
}

// DELETE: Soft-delete a category
// Usage: DELETE /api/categories?id=<id>
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID Kategori wajib dikirim!' },
        { status: 400 }
      );
    }

    await db.update(categories)
      .set({ deletedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, user.sub)));

    return NextResponse.json(
      { success: true, message: 'Kategori berhasil dihapus!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal menghapus kategori:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus kategori.' },
      { status: 500 }
    );
  }
}

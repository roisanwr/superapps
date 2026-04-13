// app/api/assets/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assets } from '@woilaa/db-mykanz/schema/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// GET: Fetch all assets for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assetsList = await db.select()
      .from(assets)
      .where(eq(assets.userId, user.sub))
      .orderBy(asc(assets.name));

    return NextResponse.json({ success: true, data: assetsList }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new asset
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      asset_type: type,
      ticker_symbol: rawTicker,
      unit_name = 'unit',
      currency = 'IDR',
    } = body as {
      name: string;
      asset_type: any;
      ticker_symbol?: string;
      unit_name?: string;
      currency?: string;
    };

    const ticker_symbol = rawTicker ? rawTicker.trim().toUpperCase() : null;

    if (!name || name.trim() === '' || !type) {
      return NextResponse.json(
        { error: 'Nama Aset & Jenis Aset wajib diisi!' },
        { status: 400 }
      );
    }

    if (ticker_symbol) {
      const existing = await db.select()
        .from(assets)
        .where(and(eq(assets.userId, user.sub), eq(assets.assetType, type), eq(assets.tickerSymbol, ticker_symbol)));
      if (existing.length > 0) {
        return NextResponse.json(
          { error: `Ticker ${ticker_symbol} sudah ada untuk aset jenis ${type}!` },
          { status: 409 }
        );
      }
    }

    const newAssetResult = await db.insert(assets).values({
        userId: user.sub,
        name: name.trim(),
        assetType: type,
        tickerSymbol: ticker_symbol,
        unitName: unit_name,
        currency,
    }).returning();
    const newAsset = newAssetResult[0];

    return NextResponse.json(
      { success: true, message: 'Aset berhasil dibuat!', data: newAsset },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal membuat aset:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing asset
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, ticker_symbol: rawTicker, unit_name } = body;

    if (!id || !name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama Aset wajib diisi!' },
        { status: 400 }
      );
    }

    const ticker_symbol = rawTicker ? rawTicker.trim().toUpperCase() : null;

    const assetResult = await db.select().from(assets).where(and(eq(assets.id, id), eq(assets.userId, user.sub)));
    const asset = assetResult[0];

    if (!asset) {
      return NextResponse.json(
        { error: 'Aset tidak ditemukan atau bukan milik Anda.' },
        { status: 404 }
      );
    }

    const updatedAssetResult = await db.update(assets).set({
        name: name.trim(),
        tickerSymbol: ticker_symbol,
        unitName: unit_name,
        updatedAt: new Date(),
    }).where(eq(assets.id, id)).returning();
    const updatedAsset = updatedAssetResult[0];

    return NextResponse.json(
      { success: true, message: 'Aset berhasil diupdate!', data: updatedAsset },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Gagal mengubah aset:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ticker sudah terpakai!' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate.' },
      { status: 500 }
    );
  }
}

// DELETE: Permanently delete an asset
// Usage: DELETE /api/assets?id=<id>
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
        { error: 'ID Aset wajib dikirim!' },
        { status: 400 }
      );
    }

    await db.delete(assets).where(and(eq(assets.id, id), eq(assets.userId, user.sub)));

    return NextResponse.json(
      { success: true, message: 'Aset berhasil dihapus!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal menghapus aset:', error);
    return NextResponse.json(
      {
        error:
          'Gagal menghapus aset. Pastikan aset ini tidak terikat dengan data penting.',
      },
      { status: 500 }
    );
  }
}

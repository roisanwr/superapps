// app/api/assets/route.ts
import { NextResponse } from "next/server";
import {
  getUserAssets,
  getGlobalAssets,
  createCustomAsset,
  updateCustomAsset,
  getAssetById,
} from "@woilaa/db-mykanz";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { assets } from "@woilaa/db-mykanz/schema/schema";
import { eq, and } from "drizzle-orm";
import type { assetTypeEnum } from "@woilaa/db-mykanz";

type AssetType = typeof assetTypeEnum.enumValues[number];

export async function GET() {
  try {
    const user = await requireUser();
    
    // As in the original implementation, returning just user custom assets? 
    // Or normally we want to return both global and user assets? 
    // We will return user specific assets and global assets to keep it simple, but let's just get user assets as the original Prisma query only checked user_id = session.user.id
    
    const userSpecificAssets = await getUserAssets(user.sub);
    const globalSpecificAssets = await getGlobalAssets();
    
    // Combining them as a simple fallback if needed by frontend
    const allAvailableAssets = [...globalSpecificAssets, ...userSpecificAssets];

    return NextResponse.json({ success: true, data: allAvailableAssets }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const {
      name,
      asset_type: type,
      ticker_symbol: rawTicker,
      unit_name = "unit",
      currency = "IDR",
    } = body as {
      name: string;
      asset_type: AssetType;
      ticker_symbol?: string;
      unit_name?: string;
      currency?: string;
    };

    const ticker_symbol = rawTicker ? rawTicker.trim().toUpperCase() : undefined;

    if (!name || name.trim() === "" || !type) {
      return NextResponse.json(
        { error: "Nama Aset & Jenis Aset wajib diisi!" },
        { status: 400 }
      );
    }

    try {
      const newAsset = await createCustomAsset(user.sub, {
        name: name.trim(),
        assetType: type,
        tickerSymbol: ticker_symbol,
        unitName: unit_name,
        currency,
        priceSource: "MANUAL",
      });

      return NextResponse.json(
        { success: true, message: "Aset berhasil dibuat!", data: newAsset },
        { status: 201 }
      );
    } catch (e: any) {
        if (e.code === '23505') { // Postgres Unique Constraint Violation
           return NextResponse.json(
             { error: `Ticker ${ticker_symbol} sudah ada untuk aset jenis ${type}!` },
             { status: 409 }
           );
        }
        throw e;
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal membuat aset:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { id, name, ticker_symbol: rawTicker, unit_name } = body;

    if (!id || !name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama Aset wajib diisi!" },
        { status: 400 }
      );
    }

    const ticker_symbol = rawTicker ? rawTicker.trim().toUpperCase() : undefined;

    const asset = await getAssetById(id, user.sub);

    if (!asset || asset.userId !== user.sub) {
      return NextResponse.json(
        { error: "Aset tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    try {
       const updatedAsset = await updateCustomAsset(id, user.sub, {
        name: name.trim(),
        tickerSymbol: ticker_symbol,
        unitName: unit_name,
      });

      return NextResponse.json(
        { success: true, message: "Aset berhasil diupdate!", data: updatedAsset },
        { status: 200 }
      );
    } catch(e: any) {
       if (e.code === '23505') {
           return NextResponse.json({ error: "Ticker sudah terpakai!" }, { status: 409 });
       }
       throw e;
    }
   
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal mengubah aset:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengupdate." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID Aset wajib dikirim!" },
        { status: 400 }
      );
    }
    
    // Check ownership
    const asset = await getAssetById(id, user.sub);
    if (!asset || asset.userId !== user.sub) {
        return NextResponse.json(
          { error: "Aset tidak ditemukan atau bukan milik Anda." },
          { status: 404 }
        );
    }

    await db.delete(assets).where(and(eq(assets.id, id), eq(assets.userId, user.sub)));

    return NextResponse.json(
      { success: true, message: "Aset berhasil dihapus!" },
      { status: 200 }
    );
  } catch (error: unknown) {
     if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal menghapus aset:", error);
    return NextResponse.json(
      {
        error: "Gagal menghapus aset. Pastikan aset ini tidak terikat dengan data penting.",
      },
      { status: 500 }
    );
  }
}

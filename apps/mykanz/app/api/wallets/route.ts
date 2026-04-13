// app/api/wallets/route.ts
import { NextResponse } from "next/server";
import {
  createWallet,
  getWalletsByUserId,
  updateWallet,
  deleteWallet,
  validateWalletOwnership,
} from "@woilaa/db-mykanz";
import { requireUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { name, type, currency = "IDR" } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Nama dan Tipe dompet wajib diisi!" },
        { status: 400 }
      );
    }

    const newWallet = await createWallet({
      userId: user.sub,
      name,
      type,
      currency,
    });

    return NextResponse.json(
      { success: true, message: "Dompet berhasil dibuat!", data: newWallet },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal membuat dompet:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const wallets = await getWalletsByUserId(user.sub);
    return NextResponse.json({ success: true, data: wallets });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { id, name, type } = body;

    if (!id || !name || !type) {
      return NextResponse.json(
        { error: "Semua field wajib diisi!" },
        { status: 400 }
      );
    }

    const isOwner = await validateWalletOwnership(id, user.sub);
    if (!isOwner) {
      return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });
    }

    const updated = await updateWallet(id, { name, type });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID Dompet wajib dikirim!" }, { status: 400 });
    }

    const isOwner = await validateWalletOwnership(id, user.sub);
    if (!isOwner) {
      return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 });
    }

    await deleteWallet(id);
    return NextResponse.json({ success: true, message: "Dompet berhasil dihapus!" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

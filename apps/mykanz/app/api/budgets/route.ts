// app/api/budgets/route.ts
import { NextResponse } from "next/server";
import {
  createBudget,
  getBudgetsByUserId,
  deleteBudget,
  getBudgetById
} from "@woilaa/db-mykanz";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const budgets = await getBudgetsByUserId(user.sub);
    return NextResponse.json({ success: true, data: budgets });
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
    const { amount, period, date, category_ids, wallet_ids } = body;

    if (!amount || !period || !date || !category_ids) {
      return NextResponse.json(
        { error: "Mohon lengkapi semua data wajib!" },
        { status: 400 }
      );
    }

    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return NextResponse.json(
        { error: "Harap pilih minimal 1 kategori!" },
        { status: 400 }
      );
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Limit Anggaran harus lebih dari 0!" },
        { status: 400 }
      );
    }

    const bDate = new Date(date);
    let startDate = new Date(bDate);
    let endDate = new Date(bDate);

    if (period === "BULANAN") {
      startDate = new Date(bDate.getFullYear(), bDate.getMonth(), 1);
      endDate = new Date(
        bDate.getFullYear(),
        bDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    } else if (period === "MINGGUAN") {
      const day = bDate.getDay();
      const diff = bDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(bDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      return NextResponse.json(
        { error: "Periode tidak valid. Gunakan BULANAN atau MINGGUAN." },
        { status: 400 }
      );
    }

    await createBudget(
      {
        userId: user.sub,
        amount: String(amount),
        period,
        startDate,
        endDate,
      },
      category_ids,
      wallet_ids || []
    );

    return NextResponse.json(
      { success: true, message: "Anggaran berhasil dibuat!" },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal membuat anggaran:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat menyimpan anggaran." },
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
        { error: "ID Anggaran wajib dikirim!" },
        { status: 400 }
      );
    }

    const budget = await getBudgetById(id);

    if (!budget || budget.userId !== user.sub) {
      return NextResponse.json(
        { error: "Anggaran tidak ditemukan." },
        { status: 404 }
      );
    }

    await deleteBudget(id);

    return NextResponse.json(
      { success: true, message: "Anggaran berhasil dihapus!" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal menghapus anggaran:", error);
    return NextResponse.json(
      { error: "Gagal menghapus anggaran." },
      { status: 500 }
    );
  }
}

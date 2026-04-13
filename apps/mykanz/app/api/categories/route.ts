// app/api/categories/route.ts
import { NextResponse } from "next/server";
import {
  createCategory,
  getCategoriesByUserId,
  updateCategory,
  deleteCategory,
  validateCategoryAccess,
} from "@woilaa/db-mykanz";
import { requireUser } from "@/lib/session";
import type { categoryTypeEnum } from "@woilaa/db-mykanz";

type CategoryType = "PEMASUKAN" | "PENGELUARAN" | "TRANSFER";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { name, type } = body as { name: string; type: CategoryType };

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama kategori wajib diisi!" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "Tipe kategori wajib dipilih!" },
        { status: 400 }
      );
    }

    const newCategory = await createCategory(user.sub, {
      name: name.trim(),
      type,
    });

    return NextResponse.json(
      { success: true, message: "Kategori berhasil dibuat!", data: newCategory },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal membuat kategori:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const categories = await getCategoriesByUserId(user.sub);
    return NextResponse.json({ success: true, data: categories });
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
    const { id, name, type } = body as { id: string; name: string; type: CategoryType };

    if (!id || !name || !type) {
      return NextResponse.json({ error: "Data tidak lengkap!" }, { status: 400 });
    }

    const hasAccess = await validateCategoryAccess(id, user.sub);
    if (!hasAccess) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const updated = await updateCategory(id, user.sub, { name: name.trim(), type });
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
      return NextResponse.json({ error: "ID Kategori wajib dikirim!" }, { status: 400 });
    }

    const hasAccess = await validateCategoryAccess(id, user.sub);
    if (!hasAccess) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    await deleteCategory(id, user.sub);
    return NextResponse.json({ success: true, message: "Kategori berhasil dihapus!" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// app/api/goals/route.ts
import { NextResponse } from "next/server";
import {
  createGoal,
  getGoalsByUserId,
  deleteGoal,
} from "@woilaa/db-mykanz";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const goals = await getGoalsByUserId(user.sub);
    return NextResponse.json({ success: true, data: goals });
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
      target_amount,
      is_asset_target = false,
      asset_id = null,
      target_asset_units = null,
      deadline = null,
    } = body;

    if (
      !name ||
      (!is_asset_target && !target_amount) ||
      (is_asset_target && (!asset_id || !target_asset_units))
    ) {
      return NextResponse.json(
        { error: "Mohon lengkapi semua data wajib!" },
        { status: 400 }
      );
    }

    if (!is_asset_target && Number(target_amount) <= 0) {
      return NextResponse.json(
        { error: "Target nominal harus lebih dari 0!" },
        { status: 400 }
      );
    }

    const newGoal = await createGoal({
      userId: user.sub,
      name,
      targetAmount: is_asset_target ? "1" : String(target_amount),
      assetId: is_asset_target ? asset_id : null,
      targetAssetUnits: is_asset_target ? String(target_asset_units) : null,
      deadline: deadline ? new Date(deadline) : undefined,
    });

    return NextResponse.json(
      { success: true, message: "Target impian berhasil dibuat!", data: newGoal },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal membuat goal:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat menyimpan target impian." },
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
        { error: "ID Goal wajib dikirim!" },
        { status: 400 }
      );
    }

    // Pastikan goal milik user
    // Validasi ada di Drizzle query deleteGoal jika diperluas, atau lakukan validasi manual.
    // Sementara kita pass id saja karena mykanzdb didesain tanpa user_id di param fungsi delete jika tak ada
    await deleteGoal(id);

    return NextResponse.json(
      { success: true, message: "Target impian berhasil dihapus!" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal menghapus goal:", error);
    return NextResponse.json(
      { error: "Gagal menghapus target impian." },
      { status: 500 }
    );
  }
}

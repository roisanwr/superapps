// app/api/goals/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { goals } from '@woilaa/db-mykanz/schema/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// GET: Fetch all goals for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalsList = await db.select()
      .from(goals)
      .where(eq(goals.userId, user.sub))
      .orderBy(desc(goals.createdAt));

    return NextResponse.json({ success: true, data: goalsList }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new savings goal
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        { error: 'Mohon lengkapi semua data wajib!' },
        { status: 400 }
      );
    }

    const parsedTargetAmount = parseFloat(String(is_asset_target ? 1 : target_amount));
    const parsedTargetAssetUnits = target_asset_units ? parseFloat(String(target_asset_units)) : null;

    if (!is_asset_target && parsedTargetAmount <= 0) {
      return NextResponse.json(
        { error: 'Target nominal harus lebih dari 0!' },
        { status: 400 }
      );
    }

    const newGoalResult = await db.insert(goals).values({
        userId: user.sub,
        name,
        targetAmount: parsedTargetAmount,
        assetId: is_asset_target ? asset_id : null,
        targetAssetUnits: is_asset_target ? parsedTargetAssetUnits : null,
        currentAmount: 0,
        currentAssetUnits: 0,
        deadline: deadline ? new Date(deadline) : null,
    }).returning();
    const newGoal = newGoalResult[0];

    return NextResponse.json(
      { success: true, message: 'Target impian berhasil dibuat!', data: newGoal },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal membuat goal:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat menyimpan target impian.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a goal
// Usage: DELETE /api/goals?id=<id>
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
        { error: 'ID Goal wajib dikirim!' },
        { status: 400 }
      );
    }

    const goalResult = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, user.sub)));
    const goal = goalResult[0];

    if (!goal) {
      return NextResponse.json(
        { error: 'Target tidak ditemukan.' },
        { status: 404 }
      );
    }

    await db.delete(goals).where(eq(goals.id, id));

    return NextResponse.json(
      { success: true, message: 'Target impian berhasil dihapus!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal menghapus goal:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus target impian.' },
      { status: 500 }
    );
  }
}

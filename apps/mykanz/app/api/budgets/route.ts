// app/api/budgets/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { budgets, budgetCategories, categories } from '@woilaa/db-mykanz/schema/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// GET: Fetch all budgets for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const budgetsDataRaw = await db.select({
      id: budgets.id,
      amount: budgets.amount,
      period: budgets.period,
      start_date: budgets.startDate,
      end_date: budgets.endDate,
      user_id: budgets.userId,
      created_at: budgets.createdAt,
      budget_categories: {
        category_id: categories.id,
        category_name: categories.name,
      }
    })
    .from(budgets)
    .leftJoin(budgetCategories, eq(budgets.id, budgetCategories.budgetId))
    .leftJoin(categories, eq(budgetCategories.categoryId, categories.id))
    .where(eq(budgets.userId, user.sub))
    .orderBy(desc(budgets.createdAt));

    // group by budget.id so that budget_categories becomes an array
    const budgetsMap = new Map();
    for (const raw of budgetsDataRaw) {
      if (!budgetsMap.has(raw.id)) {
        budgetsMap.set(raw.id, {
          id: raw.id,
          amount: Number(raw.amount),
          period: raw.period,
          start_date: raw.start_date,
          end_date: raw.end_date,
          user_id: raw.user_id,
          created_at: raw.created_at,
          budget_categories: []
        });
      }
      if (raw.budget_categories.category_id) {
        budgetsMap.get(raw.id).budget_categories.push({
          categories: {
            id: raw.budget_categories.category_id,
            name: raw.budget_categories.category_name
          }
        });
      }
    }
    const budgetsList = Array.from(budgetsMap.values());

    return NextResponse.json({ success: true, data: budgetsList }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new budget
// Body: { amount, period, date, category_ids: string[] }
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.sub;
    const body = await req.json();
    const { amount, period, date, category_ids } = body;

    if (!amount || !period || !date || !category_ids) {
      return NextResponse.json(
        { error: 'Mohon lengkapi semua data wajib!' },
        { status: 400 }
      );
    }

    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return NextResponse.json(
        { error: 'Harap pilih minimal 1 kategori!' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(String(amount));

    if (parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Limit Anggaran harus lebih dari 0!' },
        { status: 400 }
      );
    }

    const bDate = new Date(date);
    let startDate = new Date(bDate);
    let endDate = new Date(bDate);

    if (period === 'BULANAN') {
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
    } else if (period === 'MINGGUAN') {
      const day = bDate.getDay();
      const diff = bDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(bDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      return NextResponse.json(
        { error: 'Periode tidak valid. Gunakan BULANAN atau MINGGUAN.' },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      const budgetResult = await tx.insert(budgets).values({
          userId: userId,
          amount: parsedAmount,
          period,
          startDate,
          endDate,
      }).returning();
      
      const bgt = budgetResult[0];

      if (category_ids && category_ids.length > 0) {
        const catInserts = category_ids.map((catId: string) => ({
            budgetId: bgt.id,
            categoryId: catId
        }));
        await tx.insert(budgetCategories).values(catInserts);
      }
    });

    return NextResponse.json(
      { success: true, message: 'Anggaran berhasil dibuat!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal membuat anggaran:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat menyimpan anggaran.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a budget
// Usage: DELETE /api/budgets?id=<id>
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
        { error: 'ID Anggaran wajib dikirim!' },
        { status: 400 }
      );
    }

    const budgetResult = await db.select().from(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, user.sub)));
    const budget = budgetResult[0];

    if (!budget) {
      return NextResponse.json(
        { error: 'Anggaran tidak ditemukan.' },
        { status: 404 }
      );
    }

    await db.delete(budgets).where(eq(budgets.id, id));

    return NextResponse.json(
      { success: true, message: 'Anggaran berhasil dihapus!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gagal menghapus anggaran:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus anggaran.' },
      { status: 500 }
    );
  }
}

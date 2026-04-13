// app/api/investments/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assetTransactions, userPortfolios, assets, categories, fiatTransactions } from '@woilaa/db-mykanz/schema/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// GET: Fetch all investment transactions for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await db.select({
      id: assetTransactions.id,
      transaction_date: assetTransactions.transactionDate,
      transaction_type: assetTransactions.transactionType,
      units: assetTransactions.units,
      price_per_unit: assetTransactions.pricePerUnit,
      total_amount: assetTransactions.totalAmount,
      notes: assetTransactions.notes,
      user_portfolios: {
        id: userPortfolios.id,
        assets: {
          name: assets.name,
          ticker_symbol: assets.tickerSymbol,
          asset_type: assets.assetType,
          unit_name: assets.unitName,
        }
      }
    })
    .from(assetTransactions)
    .leftJoin(userPortfolios, eq(assetTransactions.portfolioId, userPortfolios.id))
    .leftJoin(assets, eq(userPortfolios.assetId, assets.id))
    .where(eq(assetTransactions.userId, user.sub))
    .orderBy(desc(assetTransactions.transactionDate));

    return NextResponse.json({ success: true, data: transactions }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Record an investment transaction (BUY or SELL)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.sub;
    const body = await req.json();
    const {
      transaction_type,
      asset_id,
      units,
      price_per_unit,
      transaction_date,
      notes = null,
      save_to_wallet = false,
      wallet_id = null,
    } = body;

    if (!transaction_type || !asset_id || !units || !transaction_date) {
      return NextResponse.json(
        { error: 'Data wajib (Aset, Tipe, Unit, Tanggal) harus diisi!' },
        { status: 400 }
      );
    }

    if (save_to_wallet && !wallet_id) {
      return NextResponse.json(
        {
          error:
            'Harap pilih dompet jika opsi hubungkan dengan dompet diaktifkan!',
        },
        { status: 400 }
      );
    }

    const type = transaction_type;
    const parsedUnits = parseFloat(String(units));
    const parsedPrice = parseFloat(String(price_per_unit || 0));
    const totalAmount = parsedUnits * parsedPrice;
    const txDate = new Date(transaction_date);

    if (parsedUnits <= 0 || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Unit harus lebih dari 0 dan Harga tidak boleh negatif!' },
        { status: 400 }
      );
    }

    // Get or create portfolio entry
    let portfolioResult = await db.select().from(userPortfolios).where(and(eq(userPortfolios.userId, userId), eq(userPortfolios.assetId, asset_id)));
    let portfolio = portfolioResult[0];

    if (!portfolio) {
      if (type === 'JUAL') {
        return NextResponse.json(
          { error: 'Tidak bisa menjual aset yang belum dimiliki!' },
          { status: 400 }
        );
      }
      const newPortfolioRes = await db.insert(userPortfolios).values({
        userId, assetId: asset_id, totalUnits: 0, averageBuyPrice: 0
      }).returning();
      portfolio = newPortfolioRes[0];
    }

    const currentUnits = Number(portfolio.totalUnits || 0);
    const currentAvgPrice = Number(portfolio.averageBuyPrice || 0);

    if (type === 'JUAL' && parsedUnits > currentUnits) {
      return NextResponse.json(
        { error: 'Unit yang dijual melebihi total unit yang dimiliki!' },
        { status: 400 }
      );
    }

    const getOrCreateCategory = async (
      name: string,
      catType: any,
      txCtx?: any
    ) => {
      const q = (txCtx || db);
      let cat = await q.select().from(categories).where(and(eq(categories.userId, userId), eq(categories.name, name), eq(categories.type, catType)));
      if (cat.length === 0) {
         cat = await q.insert(categories).values({ userId, name, type: catType }).returning();
      }
      return cat[0].id;
    };

    await db.transaction(async (tx) => {
      let linkedFiatTxId: string | null = null;
      let newUnits = currentUnits;
      let newAvgPrice = currentAvgPrice;

      if (type === 'BELI') {
        const totalPreviousCost = currentUnits * currentAvgPrice;
        const totalNewCost = parsedUnits * parsedPrice;
        newUnits = currentUnits + parsedUnits;
        if (newUnits > 0) {
          newAvgPrice = (totalPreviousCost + totalNewCost) / newUnits;
        }

        if (save_to_wallet && wallet_id) {
          const catId = await getOrCreateCategory('Berinvestasi', 'PENGELUARAN', tx);
          const fiatTxRes = await tx.insert(fiatTransactions).values({
              userId,
              walletId: wallet_id,
              categoryId: catId,
              transactionType: 'PENGELUARAN',
              amount: totalAmount,
              description: `Beli Aset${notes ? ' - ' + notes : ''}`,
              transactionDate: txDate,
          }).returning();
          linkedFiatTxId = fiatTxRes[0].id;
        }
      } else if (type === 'JUAL') {
        newUnits = currentUnits - parsedUnits;

        if (save_to_wallet && wallet_id) {
          const catId = await getOrCreateCategory('Realisasi Investasi', 'PEMASUKAN', tx);
          const fiatTxRes = await tx.insert(fiatTransactions).values({
              userId,
              walletId: wallet_id,
              categoryId: catId,
              transactionType: 'PEMASUKAN',
              amount: totalAmount,
              description: `Jual Aset${notes ? ' - ' + notes : ''}`,
              transactionDate: txDate,
          }).returning();
          linkedFiatTxId = fiatTxRes[0].id;
        }
      }

      await tx.update(userPortfolios).set({
          totalUnits: newUnits,
          averageBuyPrice: newAvgPrice,
          updatedAt: new Date(),
      }).where(eq(userPortfolios.id, portfolio!.id));

      await tx.insert(assetTransactions).values({
          userId,
          portfolioId: portfolio!.id,
          transactionType: type,
          units: parsedUnits,
          pricePerUnit: parsedPrice,
          totalAmount: totalAmount,
          notes,
          transactionDate: txDate,
          linkedFiatTransactionId: linkedFiatTxId,
      });
    });

    return NextResponse.json(
      { success: true, message: 'Investasi berhasil dicatat!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal mencatat investasi:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat menyimpan.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an investment transaction and revert portfolio
// Usage: DELETE /api/investments?id=<transactionId>
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
        { error: 'ID Transaksi wajib dikirim!' },
        { status: 400 }
      );
    }

    const investTxRes = await db.select({
      id: assetTransactions.id,
      transactionType: assetTransactions.transactionType,
      units: assetTransactions.units,
      linkedFiatTransactionId: assetTransactions.linkedFiatTransactionId,
      user_portfolios: userPortfolios
    })
    .from(assetTransactions)
    .leftJoin(userPortfolios, eq(assetTransactions.portfolioId, userPortfolios.id))
    .where(and(eq(assetTransactions.id, id), eq(assetTransactions.userId, user.sub)));

    const investTx = investTxRes[0];

    if (!investTx) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan.' },
        { status: 404 }
      );
    }

    await db.transaction(async (ptx) => {
      const p = investTx.user_portfolios;
      const currentUnits = Number(p?.totalUnits || 0);
      let newUnits = currentUnits;

      const txUnits = Number(investTx.units);

      if (investTx.transactionType === 'BELI') {
        newUnits = currentUnits - txUnits;
        if (newUnits < 0) {
          throw new Error(
            'Penghapusan ini akan membuat unit portofolio menjadi minus. Hapus transaksi penjualan terlebih dahulu.'
          );
        }
      } else if (investTx.transactionType === 'JUAL') {
        newUnits = currentUnits + txUnits;
        if (investTx.linkedFiatTransactionId) {
          await ptx.delete(fiatTransactions).where(eq(fiatTransactions.id, investTx.linkedFiatTransactionId as string));
        }
      }

      await ptx.update(userPortfolios).set({ totalUnits: newUnits }).where(eq(userPortfolios.id, p!.id));

      await ptx.delete(assetTransactions).where(eq(assetTransactions.id, id));
    });

    return NextResponse.json(
      { success: true, message: 'Transaksi investasi berhasil dihapus!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Gagal menghapus investasi:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus transaksi.' },
      { status: 500 }
    );
  }
}

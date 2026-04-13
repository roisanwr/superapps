// app/api/transactions/route.ts
import { NextResponse } from "next/server";
import {
  createFiatTransaction,
  createTransferTransaction,
  getFiatTransactions,
  getFiatTransactionById,
  deleteFiatTransaction,
} from "@woilaa/db-mykanz";
import { requireUser } from "@/lib/session";

type FiatTxType = "PEMASUKAN" | "PENGELUARAN" | "TRANSFER";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("type") as FiatTxType | "SEMUA" | null;
    const filterWalletId = searchParams.get("walletId") || undefined;

    const transactions = await getFiatTransactions(user.sub, {
      type: filterType && filterType !== "SEMUA" ? filterType : undefined,
      walletId: filterWalletId,
      limit: 100,
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal fetch transaksi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const {
      transaction_type,
      wallet_id,
      amount,
      description = null,
      transaction_date,
      category_id,
      to_wallet_id,
    } = body;

    if (!transaction_type || !wallet_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Data tidak lengkap atau jumlah tidak valid!" },
        { status: 400 }
      );
    }

    const txDate = transaction_date ? new Date(transaction_date) : new Date();

    if (transaction_type === "TRANSFER") {
      if (!to_wallet_id || wallet_id === to_wallet_id) {
        return NextResponse.json(
          { error: "Dompet tujuan tidak valid!" },
          { status: 400 }
        );
      }

      await createTransferTransaction(user.sub, {
        fromWalletId: wallet_id,
        toWalletId: to_wallet_id,
        amount: String(amount),
        description,
        transactionDate: txDate,
      });
    } else {
      await createFiatTransaction(user.sub, {
        walletId: wallet_id,
        categoryId: category_id || null,
        transactionType: transaction_type,
        amount: String(amount),
        description,
        transactionDate: txDate,
      });
    }

    return NextResponse.json(
      { success: true, message: "Transaksi berhasil dicatat!" },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal membuat transaksi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID Transaksi wajib dikirim!" },
        { status: 400 }
      );
    }

    // Pastikan transaksi milik user ini
    const tx = await getFiatTransactionById(id, user.sub);
    if (!tx || tx.userId !== user.sub) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await deleteFiatTransaction(id, user.sub);
    return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus!" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gagal menghapus transaksi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

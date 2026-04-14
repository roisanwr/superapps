import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  Sword,
  LogOut,
  ExternalLink,
  ArrowRight,
  User,
  Flame,
  TrendingUp,
  Target,
} from "lucide-react";

export const metadata = {
  title: "Dashboard | roisanwr Platform",
  description: "Command Center — pantau keuangan dan perjalanan fitness-mu dalam satu tempat.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const mykanzUrl = process.env.MYKANZ_URL || "http://localhost:3001";
  const bitmoveUrl = process.env.BITMOVE_URL || "http://localhost:3002";

  // Fetch summary data dari kedua app secara paralel
  const [financeRes, questRes] = await Promise.allSettled([
    fetch(`${mykanzUrl}/api/dashboard/summary`, {
      headers: { Cookie: `access_token=${user.sub}` },
      next: { revalidate: 60 },
    }).then((r) => (r.ok ? r.json() : null)),
    fetch(`${bitmoveUrl}/api/dashboard/summary`, {
      headers: { Cookie: `access_token=${user.sub}` },
      next: { revalidate: 60 },
    }).then((r) => (r.ok ? r.json() : null)),
  ]);

  const finance = financeRes.status === "fulfilled" ? financeRes.value : null;
  const quest = questRes.status === "fulfilled" ? questRes.value : null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 17) return "Selamat Siang";
    return "Selamat Malam";
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* Top Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">R</div>
            <span className="text-white font-black text-lg tracking-tight">roisanwr</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">Portfolio</Link>
            <span className="text-slate-700">|</span>
            <span className="text-sm text-slate-400">{user.email}</span>
            <form action="/api/auth/logout" method="POST">
              <button
                id="dashboard-logout"
                type="submit"
                className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{greeting()},</p>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {user.name} <span className="text-indigo-400">👋</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* MyKanz Finance Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-lg tracking-tight">MyKanz</h2>
                    <p className="text-xs text-slate-500 font-medium">Finance Manager</p>
                  </div>
                </div>
                <Link
                  href={mykanzUrl}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors group/link"
                >
                  Buka App <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </Link>
              </div>

              {finance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 font-medium mb-1">Total Aset</p>
                      <p className="text-lg font-black text-white">{formatRupiah(finance.netWorth || 0)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 font-medium mb-1">Pengeluaran Bulan Ini</p>
                      <p className="text-lg font-black text-red-400">{formatRupiah(finance.monthlyExpense || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span>Pemasukan: <span className="text-emerald-400 font-semibold">{formatRupiah(finance.monthlyIncome || 0)}</span></span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  <p className="text-xs text-slate-600 text-center">Koneksi ke MyKanz...</p>
                </div>
              )}

              <Link
                id="dashboard-mykanz-link"
                href={mykanzUrl}
                target="_blank"
                className="mt-5 flex items-center justify-between w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl px-4 py-3 text-sm text-emerald-400 font-semibold transition-all group/btn"
              >
                Kelola Keuangan
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* BitMove Quests Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Sword className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-lg tracking-tight">BitMove</h2>
                    <p className="text-xs text-slate-500 font-medium">RPG Fitness Tracker</p>
                  </div>
                </div>
                <Link
                  href={bitmoveUrl}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors group/link"
                >
                  Buka App <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </Link>
              </div>

              {quest ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 font-medium mb-1">Level</p>
                      <p className="text-lg font-black text-white">LVL {quest.level || 1}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" /> Winstreak
                      </p>
                      <p className="text-lg font-black text-orange-400">{quest.streak || 0} hari</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Target className="w-3 h-3 text-blue-500" />
                    <span>Quest hari ini: <span className="text-blue-400 font-semibold">{quest.completedToday || 0}/{quest.totalToday || 0} selesai</span></span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  <p className="text-xs text-slate-600 text-center">Koneksi ke BitMove...</p>
                </div>
              )}

              <Link
                id="dashboard-bitmove-link"
                href={bitmoveUrl}
                target="_blank"
                className="mt-5 flex items-center justify-between w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-xl px-4 py-3 text-sm text-blue-400 font-semibold transition-all group/btn"
              >
                Mulai Quest
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="font-black text-white text-base mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Info Akun
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Nama</p>
              <p className="text-sm text-white font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Username</p>
              <p className="text-sm text-white font-semibold">@{user.username}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Email</p>
              <p className="text-sm text-white font-semibold truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Akses App</p>
              <div className="flex gap-1.5 flex-wrap">
                {user.apps?.map((app) => (
                  <span key={app} className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/" className="bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3 transition-all group">
            <LayoutDashboard className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <div>
              <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Portfolio</p>
              <p className="text-xs text-slate-600">Lihat halaman publik</p>
            </div>
          </Link>
          <Link href={`${mykanzUrl}/portfolios`} target="_blank" className="bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3 transition-all group">
            <TrendingUp className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            <div>
              <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Portofolio Aset</p>
              <p className="text-xs text-slate-600">Kelola investasi</p>
            </div>
          </Link>
          <Link href={`${bitmoveUrl}/training`} target="_blank" className="bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3 transition-all group">
            <Target className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            <div>
              <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Training Ground</p>
              <p className="text-xs text-slate-600">Mulai sesi workout</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

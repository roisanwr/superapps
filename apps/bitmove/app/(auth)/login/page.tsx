"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import Link from "next/link";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#131313] p-8 border-l-4 border-[#8eff71] shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-[#8eff71] mb-2">
            System Login
          </h1>
          <p className="text-xs text-[#ababab] uppercase tracking-widest font-bold">
            Authorize to access Command Center
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#ababab] tracking-widest mb-1">
              Codename (Username or Email)
            </label>
            <input
              type="text"
              name="identifier"
              required
              className="w-full bg-[#1f1f1f] border border-[#484848] px-4 py-3 text-sm focus:border-[#8eff71] focus:outline-none transition-colors"
              placeholder="E.G. SHADOW_ACT"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#ababab] tracking-widest mb-1">
              Passcode
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full bg-[#1f1f1f] border border-[#484848] px-4 py-3 text-sm focus:border-[#8eff71] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="bg-[#b92902]/20 border border-[#b92902]/30 p-3 text-xs text-[#ff7351] font-bold uppercase tracking-widest">
              Error: {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#8eff71] text-black font-black uppercase tracking-widest py-4 hover:shadow-[0_0_15px_#8eff71] transition-all disabled:opacity-50"
          >
            {isPending ? "Authenticating..." : "Initiate Link"}
          </button>
        </form>

        <div className="mt-6 border-t border-[#484848]/30 pt-4 text-center">
          <p className="text-xs text-[#ababab]">
            No access clearance?{" "}
            <Link href="/register" className="text-[#8eff71] hover:underline uppercase font-bold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

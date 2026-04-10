"use client";

import { useActionState } from "react";
import { registerAction } from "../actions";
import Link from "next/link";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#131313] p-8 border-l-4 border-[#d575ff] shadow-[0_0_20px_rgba(213,117,255,0.1)]">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-[#d575ff] mb-2">
            New Operative
          </h1>
          <p className="text-xs text-[#ababab] uppercase tracking-widest font-bold">
            Register for system access
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#ababab] tracking-widest mb-1">
              Username (Codename)
            </label>
            <input
              type="text"
              name="username"
              required
              className="w-full bg-[#1f1f1f] border border-[#484848] px-4 py-3 text-sm focus:border-[#d575ff] focus:outline-none transition-colors"
              placeholder="E.G. SHADOW_ACT"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#ababab] tracking-widest mb-1">
              Full Name (Optional)
            </label>
            <input
              type="text"
              name="fullName"
              className="w-full bg-[#1f1f1f] border border-[#484848] px-4 py-3 text-sm focus:border-[#d575ff] focus:outline-none transition-colors"
              placeholder="JOHN DOE"
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
              minLength={6}
              className="w-full bg-[#1f1f1f] border border-[#484848] px-4 py-3 text-sm focus:border-[#d575ff] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="bg-[#b92902]/20 border border-[#b92902]/30 p-3 text-xs text-[#ff7351] font-bold uppercase tracking-widest mt-4">
              Error: {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#d575ff] text-black font-black uppercase tracking-widest py-4 hover:shadow-[0_0_15px_#d575ff] transition-all disabled:opacity-50 mt-6"
          >
            {isPending ? "Generating Profile..." : "Register"}
          </button>
        </form>

        <div className="mt-6 border-t border-[#484848]/30 pt-4 text-center">
          <p className="text-xs text-[#ababab]">
            Already have clearance?{" "}
            <Link href="/login" className="text-[#d575ff] hover:underline uppercase font-bold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

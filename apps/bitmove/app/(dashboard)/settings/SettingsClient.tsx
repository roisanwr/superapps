"use client";

import { useTransition, useState } from "react";
import { updateProfile, logOutAction } from "./actions";
import { Save, LogOut, ShieldAlert } from "lucide-react";

export function SettingsClient({ profile }: { profile: any }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res?.error) {
        setMsg({ type: "error", text: res.error });
      } else {
        setMsg({ type: "success", text: "PROFILE CALIBRATION SUCCESSFUL." });
      }
    });
  };

  return (
    <div className="max-w-3xl animate-in fade-in duration-500">
      <div className="bg-surface-container border-l-4 border-primary p-6 md:p-8 mb-8">
        <h2 className="font-headline font-black text-2xl uppercase tracking-tighter text-white mb-6 border-b border-outline-variant/30 pb-4">
          OPERATIVE DOSSIER
        </h2>

        {msg.text && (
          <div className={`mb-6 p-4 border flex items-center gap-3 font-headline font-bold text-xs uppercase tracking-widest ${msg.type === "error" ? "bg-error/20 border-error text-error" : "bg-primary/20 border-primary text-primary"}`}>
            {msg.type === "error" && <ShieldAlert className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        <form action={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">
                Codename (Login Identity)
              </label>
              <input 
                name="username" 
                defaultValue={profile?.username || ""} 
                required
                className="w-full bg-surface-container-high border border-outline-variant px-4 py-3 text-sm focus:border-primary focus:outline-none text-white font-headline transition-colors" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">
                Full Name (Alias)
              </label>
              <input 
                name="fullName" 
                defaultValue={profile?.fullName || ""} 
                className="w-full bg-surface-container-high border border-outline-variant px-4 py-3 text-sm focus:border-primary focus:outline-none text-white font-headline transition-colors" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">
                Operational Timezone
              </label>
              <select 
                name="timezone" 
                defaultValue={profile?.timezone || "Asia/Jakarta"}
                className="w-full bg-surface-container-high border border-outline-variant px-4 py-3 text-sm focus:border-primary focus:outline-none text-primary font-headline font-bold appearance-none transition-colors"
              >
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                <option value="UTC">Universal Time (UTC)</option>
              </select>
              <p className="font-body text-[10px] text-on-surface-variant mt-2 italic">
                * Used for Daily and Weekly reset calculations in cron-jobs.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/30 flex justify-end">
            <button 
              type="submit" 
              disabled={isPending}
              className="bg-primary text-black font-headline font-black uppercase text-xs px-8 py-3 tracking-widest flex items-center gap-2 hover:shadow-[0_0_15px_#8eff71] transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isPending ? "UPLOADING..." : "SAVE DOSSIER"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface-container-low border border-error/30 p-6 md:p-8">
         <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-error mb-2">
          SYSTEM DISCONNECT
        </h2>
        <p className="font-body text-xs text-on-surface-variant mb-6">
          Sever connection to the Bitmove network. You will be required to input your credentials upon your return.
        </p>

        <form action={logOutAction}>
          <button 
            type="submit" 
            className="bg-transparent border border-error text-error hover:bg-error hover:text-black font-headline font-black uppercase text-xs px-8 py-3 tracking-widest flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            DISCONNECT NEURAL LINK (LOGOUT)
          </button>
        </form>
      </div>
    </div>
  );
}

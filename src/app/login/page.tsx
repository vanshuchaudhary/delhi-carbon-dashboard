'use client';

import { SignIn } from "@clerk/nextjs";
import { Shield, Sparkles } from "lucide-react";
import { dark } from "@clerk/themes";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 mb-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-slate-900 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)] p-3 overflow-hidden">
          <img src="/sentinel-logo.png" alt="Sentinel Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Quantum Sentinel</h1>
        <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Regional Carbon Decarbonization Hub</p>
      </div>

      <div className="relative z-10">
        <SignIn 
          appearance={{
            baseTheme: dark,
            elements: {
              card: "bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl",
              headerTitle: "text-white font-black uppercase text-xl",
              headerSubtitle: "text-slate-400 text-sm",
              socialButtonsBlockButton: "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white",
              socialButtonsBlockButtonText: "text-slate-300 font-bold",
              formButtonPrimary: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest py-3",
              footerActionLink: "text-emerald-400 hover:text-emerald-300",
              formFieldInput: "bg-slate-950/50 border-slate-800 focus:border-emerald-500/50 text-white",
              formFieldLabel: "text-slate-400 uppercase text-[10px] font-black tracking-widest",
              dividerLine: "bg-slate-800",
              dividerText: "text-slate-500 uppercase text-[10px] font-black",
              identityPreviewText: "text-white",
              identityPreviewEditButtonIcon: "text-emerald-500",
            }
          }}
          routing="path"
          path="/login"
        />
      </div>

      {/* Trust Footer */}
      <div className="mt-12 text-center text-slate-500 text-[9px] uppercase tracking-widest flex items-center gap-4 opacity-50 relative z-10">
        <span className="flex items-center gap-1.5"><Shield className="w-3 h-3"/> SSL Encrypted</span>
        <span className="w-1 h-1 bg-slate-700 rounded-full" />
        <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> AI Verified</span>
      </div>
    </div>
  );
}

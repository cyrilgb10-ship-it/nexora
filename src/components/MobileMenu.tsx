"use client";

import { useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-2xl text-white transition hover:border-cyan-500 hover:text-cyan-400"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-[85%] max-w-sm border-r border-slate-800 bg-slate-950 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                  NEXORA
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Menu
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-xl text-slate-300 transition hover:border-red-500 hover:text-red-400"
              >
                ×
              </button>
            </div>

            <nav className="mt-8 space-y-2">
              <a
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-400 transition hover:bg-cyan-500/20"
              >
                <span>🏠</span>
                Dashboard
              </a>

              <a
                href="/referrals"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-cyan-400"
              >
                <span>👥</span>
                Parrainage
              </a>

              <a
                href="/missions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-cyan-400"
              >
                <span>🎯</span>
                Missions
              </a>

              <a
                href="/transactions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-cyan-400"
              >
                <span>💳</span>
                Transactions
              </a>

              <a
                href="/withdrawal"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-cyan-400"
              >
                <span>💸</span>
                Retirer mes gains
              </a>

              <a
                href="/withdrawal-history"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-cyan-400"
              >
                <span>📋</span>
                Historique des retraits
              </a>
            </nav>

            <div className="mt-8 border-t border-slate-800 pt-5">
              <form action="/api/logout" method="POST">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-red-400 transition hover:bg-red-500/10"
                >
                  <span>🚪</span>
                  Déconnexion
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
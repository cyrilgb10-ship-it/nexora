"use client";

import { useEffect, useState } from "react";

type Mission = {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  completed: boolean;
  rewardCredited: boolean;
};

type MissionsResponse = {
  success: boolean;
  balance: number;
  activeReferrals: number;
  missions: Mission[];
};

export default function MissionsPage() {
  const [data, setData] = useState<MissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadMissions() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/missions", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message || "Impossible de charger les missions."
        );
        return;
      }

      setData(result);
    } catch {
      setError(
        "Une erreur est survenue lors du chargement des missions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMissions();
  }, []);

  async function claimMission(missionId: string) {
    try {
      setClaimingId(missionId);
      setMessage("");
      setError("");

      const response = await fetch("/api/missions/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          missionId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Impossible de réclamer cette récompense."
        );
        return;
      }

      setMessage(result.message);

      await loadMissions();
    } catch {
      setError(
        "Une erreur est survenue lors de la réclamation."
      );
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Mes missions
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Parrainez des membres actifs et gagnez des récompenses.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            ← Dashboard
          </a>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
            <p className="font-semibold text-green-400">
              ✓ {message}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="font-semibold text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* SOLDE ET FILLEULS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Solde disponible
            </p>

            <p className="mt-2 text-3xl font-black text-cyan-400">
              {loading
                ? "..."
                : `${data?.balance.toLocaleString("fr-FR")} FCFA`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Filleuls actifs
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {loading ? "..." : data?.activeReferrals}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Seuls les comptes activés sont comptabilisés.
            </p>
          </div>
        </section>

        {/* MISSIONS */}
        <section className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
              <p className="text-slate-400">
                Chargement des missions...
              </p>
            </div>
          ) : data?.missions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-2xl">
                🎯
              </div>

              <h2 className="mt-4 text-xl font-bold">
                Aucune mission disponible
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Les nouvelles missions apparaîtront ici dès qu'elles
                seront disponibles.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {data?.missions.map((mission) => {
                const activeReferrals = data.activeReferrals;

                const progress = Math.min(
                  100,
                  Math.round(
                    (activeReferrals / mission.target) * 100
                  )
                );

                const targetReached =
                  activeReferrals >= mission.target;

                const isClaiming =
                  claimingId === mission.id;

                return (
                  <article
                    key={mission.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-500/40"
                  >
                    {/* TITRE */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-2xl">
                        👥
                      </div>

                      {mission.rewardCredited ? (
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                          Récompense reçue
                        </span>
                      ) : targetReached ? (
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                          Objectif atteint
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400">
                          En cours
                        </span>
                      )}
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-white">
                      {mission.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {mission.description}
                    </p>

                    {/* PROGRESSION */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-300">
                          Progression
                        </p>

                        <p className="text-sm font-black text-cyan-400">
                          {Math.min(
                            activeReferrals,
                            mission.target
                          )}{" "}
                          / {mission.target}
                        </p>
                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {targetReached
                          ? "Objectif atteint !"
                          : `Encore ${
                              mission.target - activeReferrals
                            } filleul${
                              mission.target - activeReferrals > 1
                                ? "s"
                                : ""
                            } actif${
                              mission.target - activeReferrals > 1
                                ? "s"
                                : ""
                            } pour atteindre l'objectif.`}
                      </p>
                    </div>

                    {/* RECOMPENSE */}
                    <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <p className="text-xs text-slate-500">
                        Récompense
                      </p>

                      <p className="mt-1 text-2xl font-black text-cyan-400">
                        +{mission.reward.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>

                    {/* ACTION */}
                    {mission.rewardCredited ? (
                      <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                        <p className="font-semibold text-green-400">
                          ✓ Récompense déjà créditée
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Cette mission ne peut être récompensée
                          qu'une seule fois.
                        </p>
                      </div>
                    ) : targetReached ? (
                      <button
                        type="button"
                        onClick={() => claimMission(mission.id)}
                        disabled={isClaiming}
                        className="mt-5 w-full rounded-xl bg-cyan-500 px-5 py-3.5 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isClaiming
                          ? "Traitement..."
                          : `🎁 Réclamer ${mission.reward.toLocaleString(
                              "fr-FR"
                            )} FCFA`}
                      </button>
                    ) : (
                      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-sm font-semibold text-slate-300">
                          Mission en cours
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Continuez à parrainer des personnes et
                          faites activer leurs comptes pour débloquer
                          votre récompense.
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* LIENS */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a
            href="/referrals"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            👥 Mon parrainage
          </a>

          <a
            href="/transactions"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            💳 Mes transactions
          </a>

          <a
            href="/withdrawal"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            💸 Retirer mes gains
          </a>
        </div>
      </div>
    </main>
  );
}

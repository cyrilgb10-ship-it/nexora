"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  dayOfWeek: number;
  reward: number;
  completed: boolean;
  started: boolean;
  startedAt: string | null;
};

type TasksResponse = {
  success: boolean;
  hasTask: boolean;
  balance: number;
  date: string;
  dayOfWeek: number;
  task?: Task;
  message?: string;
};

const DAYS: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

export default function TasksPage() {
  const [data, setData] = useState<TasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);

  async function loadTask() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tasks", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Impossible de charger la tâche.");
        return;
      }

      setData(result);

      if (result.task?.startedAt && !result.task.completed) {
        const startedAt = new Date(result.task.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, 20 - elapsed);

        setSeconds(remaining);
      }
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTask();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  async function startTask() {
    if (!data?.task) return;

    try {
      setStarting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/tasks/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: data.task.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Impossible de commencer la tâche.");
        return;
      }

      const startedAt = new Date(result.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);

      setSeconds(Math.max(0, 20 - elapsed));

      await loadTask();
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setStarting(false);
    }
  }

  async function claimTask() {
    if (!data?.task) return;

    try {
      setStarting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/tasks/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: data.task.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Impossible de récupérer la récompense.");
        return;
      }

      setMessage(result.message);
      setSeconds(0);

      await loadTask();
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Tâche quotidienne
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Effectuez la tâche du jour et gagnez votre récompense.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            ← Dashboard
          </a>
        </header>

        <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Solde disponible
              </p>

              <p className="mt-1 text-2xl font-black text-cyan-400">
                {(data?.balance ?? 0).toLocaleString("fr-FR")} FCFA
              </p>
            </div>

            <div className="rounded-xl bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400">
              +100 FCFA
            </div>
          </div>
        </section>

        {loading && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-slate-400">
              Chargement de la tâche...
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="font-semibold text-red-400">{error}</p>
          </section>
        )}

        {!loading && !error && data && !data.hasTask && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="text-5xl">📅</div>

            <h2 className="mt-4 text-2xl font-black">
              Aucune tâche aujourd'hui
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Les tâches quotidiennes sont disponibles du lundi au vendredi.
            </p>
          </section>
        )}

        {!loading && data?.task && (
          <section className="mt-6 rounded-2xl border border-purple-500/20 bg-slate-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400">
                {DAYS[data.dayOfWeek]}
              </span>

              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                +{data.task.reward.toLocaleString("fr-FR")} FCFA
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-black">
              {data.task.title}
            </h2>

            <p className="mt-3 leading-7 text-slate-400">
              {data.task.description}
            </p>

            {data.task.completed ? (
              <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                <p className="font-bold text-green-400">
                  ✓ Tâche terminée
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Votre récompense a déjà été créditée aujourd'hui.
                </p>
              </div>
            ) : (
              <>
                {!data.task.started && (
                  <button
                    type="button"
                    onClick={startTask}
                    disabled={starting}
                    className="mt-6 w-full rounded-xl bg-cyan-500 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {starting
                      ? "Démarrage..."
                      : "Commencer la tâche"}
                  </button>
                )}

                {data.task.started && seconds > 0 && (
                  <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
                    <p className="text-sm font-semibold text-yellow-400">
                      Tâche en cours
                    </p>

                    <p className="mt-3 text-5xl font-black text-white">
                      {seconds}s
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Veuillez attendre la fin du compte à rebours.
                    </p>
                  </div>
                )}

                {data.task.started && seconds === 0 && (
                  <button
                    type="button"
                    onClick={claimTask}
                    disabled={starting}
                    className="mt-6 w-full rounded-xl bg-green-500 px-5 py-4 font-black text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {starting
                      ? "Validation..."
                      : `Réclamer ${data.task.reward.toLocaleString(
                          "fr-FR"
                        )} FCFA`}
                  </button>
                )}
              </>
            )}
          </section>
        )}

        {message && (
          <section className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <p className="font-bold text-green-400">
              {message}
            </p>
          </section>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a
            href="/missions"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            🎯 Mes missions
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
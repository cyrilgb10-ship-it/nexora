"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TaskBalance = {
  taskId: string;
  title: string;
  description: string;
  balance: number;
};

type WithdrawalMethod =
  | "TMONEY"
  | "FLOOZ"
  | "MTN_MOBILE_MONEY"
  | "WAVE";

const methods: {
  value: WithdrawalMethod;
  label: string;
}[] = [
  {
    value: "TMONEY",
    label: "TMoney",
  },
  {
    value: "FLOOZ",
    label: "Flooz",
  },
  {
    value: "MTN_MOBILE_MONEY",
    label: "MTN Mobile Money",
  },
  {
    value: "WAVE",
    label: "Wave",
  },
];

const MIN_WITHDRAWAL = 1500;
const WITHDRAWAL_FEE = 500;

export default function TaskWithdrawalPage() {
  const [tasks, setTasks] = useState<TaskBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] =
    useState<TaskBalance | null>(null);

  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<WithdrawalMethod>("TMONEY");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadBalances();
  }, []);

  async function loadBalances() {
    try {
      setLoading(true);

      const response = await fetch("/api/task-balances", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible de charger les soldes.");
        return;
      }

      setTasks(data.tasks || []);
    } catch {
      setError("Impossible de charger les soldes.");
    } finally {
      setLoading(false);
    }
  }

  function openWithdrawal(task: TaskBalance) {
    setSelectedTask(task);
    setAmount("");
    setMethod("TMONEY");
    setPhone("");
    setMessage("");
    setError("");
  }

  function closeWithdrawal() {
    setSelectedTask(null);
    setAmount("");
    setPhone("");
    setMessage("");
    setError("");
  }

  async function submitWithdrawal(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedTask) {
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/task-withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: selectedTask.taskId,
          amount: Number(amount),
          method,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Le retrait a échoué.");
        return;
      }

      setMessage(
        `Retrait demandé avec succès. ${data.amount.toLocaleString(
          "fr-FR"
        )} FCFA seront versés après validation.`
      );

      await loadBalances();

      setTimeout(() => {
        closeWithdrawal();
      }, 1800);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  const numericAmount = Number(amount) || 0;

  const totalDeducted =
    numericAmount > 0
      ? numericAmount + WITHDRAWAL_FEE
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Retour au tableau de bord
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Retrait des gains
            </h1>

            <p className="mt-2 text-slate-600">
              Chaque tâche possède son propre solde de retrait.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-900">
            Conditions de retrait
          </h2>

          <div className="mt-3 space-y-1 text-sm text-amber-800">
            <p>• Montant minimum : 1 500 FCFA</p>
            <p>• Frais de retrait : 500 FCFA</p>
            <p>
              • Le solde doit couvrir le montant retiré + les frais.
            </p>
            <p>• Validation manuelle par l'administration.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              Chargement des soldes...
            </p>
          </div>
        ) : error && tasks.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {tasks.map((task) => (
              <div
                key={task.taskId}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {task.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {task.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Solde disponible
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {task.balance.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openWithdrawal(task)}
                  disabled={task.balance < MIN_WITHDRAWAL + WITHDRAWAL_FEE}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {task.balance >= MIN_WITHDRAWAL + WITHDRAWAL_FEE
                    ? "Retirer mes gains"
                    : "Solde insuffisant"}
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Retirer — {selectedTask.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Solde disponible :{" "}
                    {selectedTask.balance.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    FCFA
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeWithdrawal}
                  className="text-2xl text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={submitWithdrawal}
                className="mt-6 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Montant à retirer
                  </label>

                  <input
                    type="number"
                    min={MIN_WITHDRAWAL}
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Exemple : 1500"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {numericAmount > 0 && (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span>Montant du retrait</span>
                      <strong>
                        {numericAmount.toLocaleString("fr-FR")} FCFA
                      </strong>
                    </div>

                    <div className="mt-2 flex justify-between">
                      <span>Frais</span>
                      <strong>
                        {WITHDRAWAL_FEE.toLocaleString("fr-FR")} FCFA
                      </strong>
                    </div>

                    <div className="mt-3 border-t pt-3">
                      <div className="flex justify-between font-bold">
                        <span>Total déduit du solde</span>
                        <span>
                          {totalDeducted.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Méthode de paiement
                  </label>

                  <select
                    value={method}
                    onChange={(e) =>
                      setMethod(
                        e.target.value as WithdrawalMethod
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    {methods.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Numéro de paiement
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Exemple : 90 XX XX XX"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !amount ||
                    numericAmount < MIN_WITHDRAWAL ||
                    totalDeducted > selectedTask.balance
                  }
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting
                    ? "Enregistrement..."
                    : "Confirmer le retrait"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
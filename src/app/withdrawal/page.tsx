"use client";

import { FormEvent, useEffect, useState } from "react";

const MIN_WITHDRAWAL = 1500;
const WITHDRAWAL_FEE = 500;

const methods = [
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

export default function WithdrawalPage() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("TMONEY");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const numericAmount = Number(amount) || 0;
  const total = numericAmount + WITHDRAWAL_FEE;

  useEffect(() => {
    setMessage("");
    setSuccess(false);
  }, [amount, method, phone]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!numericAmount || numericAmount < MIN_WITHDRAWAL) {
      setMessage(
        `Le montant minimum de retrait est de ${MIN_WITHDRAWAL.toLocaleString(
          "fr-FR"
        )} FCFA.`
      );
      return;
    }

    if (!phone.trim()) {
      setMessage("Veuillez renseigner votre numéro de paiement.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numericAmount,
          method,
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Impossible d'envoyer la demande de retrait."
        );
        return;
      }

      setSuccess(true);
      setMessage(data.message || "Demande envoyée.");

      setAmount("");
      setPhone("");
    } catch {
      setMessage(
        "Une erreur de connexion est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Retirer mes gains
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Demandez le retrait de vos gains disponibles.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            ← Dashboard
          </a>
        </div>

        {/* Information */}
        <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <p className="font-bold text-yellow-400">
            Informations importantes
          </p>

          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              • Montant minimum :{" "}
              <strong className="text-white">
                {MIN_WITHDRAWAL.toLocaleString("fr-FR")} FCFA
              </strong>
            </li>

            <li>
              • Frais de retrait :{" "}
              <strong className="text-white">
                {WITHDRAWAL_FEE.toLocaleString("fr-FR")} FCFA
              </strong>
            </li>

            <li>
              • Les demandes sont vérifiées et traitées manuellement.
            </li>

            <li>
              • Le montant demandé est distinct des frais de retrait.
            </li>
          </ul>
        </div>

        {/* Form */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">
            Nouvelle demande
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Montant à retirer
              </label>

              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  min={MIN_WITHDRAWAL}
                  step="1"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="Exemple : 1500"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  required
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                  FCFA
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Minimum :{" "}
                {MIN_WITHDRAWAL.toLocaleString("fr-FR")} FCFA
              </p>
            </div>

            {/* Method */}
            <div>
              <label
                htmlFor="method"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Méthode de paiement
              </label>

              <select
                id="method"
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
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

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Numéro de paiement
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Exemple : 90 XX XX XX"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                required
              />

              <p className="mt-2 text-xs text-slate-500">
                Indiquez le numéro sur lequel vous souhaitez recevoir
                votre paiement.
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-bold text-white">
                Résumé
              </h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Montant du retrait
                  </span>

                  <span className="font-bold text-white">
                    {numericAmount.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Frais de retrait
                  </span>

                  <span className="font-bold text-yellow-400">
                    {WITHDRAWAL_FEE.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="font-semibold text-slate-300">
                      Total déduit du solde
                    </span>

                    <span className="text-lg font-black text-cyan-400">
                      {total.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  success
                    ? "border-green-500/20 bg-green-500/5 text-green-400"
                    : "border-red-500/20 bg-red-500/5 text-red-400"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 px-5 py-3.5 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Envoi en cours..."
                : "Demander mon retrait"}
            </button>
          </form>
        </section>

        {/* Navigation */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a
            href="/transactions"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            Historique
          </a>

          <a
            href="/referrals"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            Parrainage
          </a>

          <a
            href="/missions"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            Missions
          </a>
        </div>
      </div>
    </main>
  );
}
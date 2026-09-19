import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function getMethodLabel(method: string) {
  switch (method) {
    case "TMONEY":
      return "TMoney";
    case "FLOOZ":
      return "Flooz";
    case "MTN_MOBILE_MONEY":
      return "MTN Mobile Money";
    case "WAVE":
      return "Wave";
    default:
      return method;
  }
}

function getStatusInfo(status: string) {
  switch (status) {
    case "APPROVED":
      return {
        label: "Approuvé",
        className: "bg-green-500/10 text-green-400",
      };

    case "REJECTED":
      return {
        label: "Rejeté",
        className: "bg-red-500/10 text-red-400",
      };

    case "PENDING":
    default:
      return {
        label: "En attente",
        className: "bg-yellow-500/10 text-yellow-400",
      };
  }
}

export default async function WithdrawalHistoryPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("nexora_user_id")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      activationStatus: true,
      balance: true,
      lockedBalance: true,
      withdrawals: {
        select: {
          id: true,
          amount: true,
          method: true,
          phone: true,
          status: true,
          adminNote: true,
          processedAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.activationStatus !== "ACTIVE") {
    redirect("/activation");
  }

  const totalWithdrawals = user.withdrawals.length;

  const pendingWithdrawals = user.withdrawals.filter(
    (withdrawal) => withdrawal.status === "PENDING"
  ).length;

  const approvedWithdrawals = user.withdrawals.filter(
    (withdrawal) => withdrawal.status === "APPROVED"
  ).length;

  const totalApprovedAmount = user.withdrawals
    .filter((withdrawal) => withdrawal.status === "APPROVED")
    .reduce((total, withdrawal) => total + withdrawal.amount, 0);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Mes retraits
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Consultez l'état de vos demandes de retrait.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            ← Dashboard
          </a>
        </div>

        {/* Balance */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Solde disponible
            </p>

            <p className="mt-2 text-3xl font-black text-cyan-400">
              {user.balance.toLocaleString("fr-FR")} FCFA
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Montant en attente
            </p>

            <p className="mt-2 text-3xl font-black text-yellow-400">
              {user.lockedBalance.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total demandes
            </p>

            <p className="mt-2 text-2xl font-black text-white">
              {totalWithdrawals}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              En attente
            </p>

            <p className="mt-2 text-2xl font-black text-yellow-400">
              {pendingWithdrawals}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Approuvés
            </p>

            <p className="mt-2 text-2xl font-black text-green-400">
              {approvedWithdrawals}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total reçu
            </p>

            <p className="mt-2 text-2xl font-black text-cyan-400">
              {totalApprovedAmount.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        </section>

        {/* New withdrawal */}
        <div className="mt-6">
          <a
            href="/withdrawal"
            className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3.5 font-black text-slate-950 transition hover:bg-cyan-400 sm:w-auto"
          >
            + Demander un retrait
          </a>
        </div>

        {/* History */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Historique des demandes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Retrouvez ici toutes vos demandes de retrait.
              </p>
            </div>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-slate-300">
              {totalWithdrawals}
            </span>
          </div>

          {user.withdrawals.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-2xl">
                💸
              </div>

              <p className="mt-4 font-semibold text-slate-300">
                Aucun retrait pour le moment.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Vos demandes de retrait apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {user.withdrawals.map((withdrawal) => {
                const status = getStatusInfo(withdrawal.status);

                return (
                  <article
                    key={withdrawal.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white">
                            Retrait de{" "}
                            {withdrawal.amount.toLocaleString(
                              "fr-FR"
                            )}{" "}
                            FCFA
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                          <p>
                            <span className="text-slate-600">
                              Méthode :
                            </span>{" "}
                            {getMethodLabel(withdrawal.method)}
                          </p>

                          <p>
                            <span className="text-slate-600">
                              Numéro :
                            </span>{" "}
                            {withdrawal.phone}
                          </p>
                        </div>

                        <p className="mt-3 text-xs text-slate-600">
                          Demandé le{" "}
                          {new Date(
                            withdrawal.createdAt
                          ).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        {withdrawal.processedAt && (
                          <p className="mt-1 text-xs text-slate-600">
                            Traité le{" "}
                            {new Date(
                              withdrawal.processedAt
                            ).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}

                        {withdrawal.adminNote && (
                          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-3">
                            <p className="text-xs font-semibold text-slate-500">
                              Note
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {withdrawal.adminNote}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 lg:text-right">
                        <p className="text-xs text-slate-500">
                          Montant reçu
                        </p>

                        <p className="mt-1 text-xl font-black text-cyan-400">
                          {withdrawal.amount.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          FCFA
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Hors frais de retrait
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Navigation */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a
            href="/transactions"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            Historique transactions
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
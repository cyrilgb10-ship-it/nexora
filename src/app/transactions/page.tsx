import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function getTransactionLabel(type: string) {
  switch (type) {
    case "ACTIVATION":
      return "Activation du compte";
    case "REFERRAL_REWARD":
      return "Gain de parrainage";
    case "MISSION_REWARD":
      return "Gain de mission";
    case "WITHDRAWAL":
      return "Retrait";
    case "WITHDRAWAL_REFUND":
      return "Remboursement de retrait";
    default:
      return "Transaction";
  }
}

function getTransactionStyle(type: string) {
  switch (type) {
    case "REFERRAL_REWARD":
    case "MISSION_REWARD":
    case "WITHDRAWAL_REFUND":
      return {
        badge: "bg-green-500/10 text-green-400",
        amount: "text-green-400",
        sign: "+",
      };

    case "WITHDRAWAL":
      return {
        badge: "bg-red-500/10 text-red-400",
        amount: "text-red-400",
        sign: "-",
      };

    case "ACTIVATION":
      return {
        badge: "bg-yellow-500/10 text-yellow-400",
        amount: "text-yellow-400",
        sign: "-",
      };

    default:
      return {
        badge: "bg-slate-800 text-slate-300",
        amount: "text-slate-300",
        sign: "",
      };
  }
}

export default async function TransactionsPage() {
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
      transactions: {
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
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

  const totalTransactions = user.transactions.length;

  const totalCredits = user.transactions
    .filter(
      (transaction) =>
        transaction.type === "REFERRAL_REWARD" ||
        transaction.type === "MISSION_REWARD" ||
        transaction.type === "WITHDRAWAL_REFUND"
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalWithdrawals = user.transactions
    .filter((transaction) => transaction.type === "WITHDRAWAL")
    .reduce((total, transaction) => total + transaction.amount, 0);

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
              Mes transactions
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Consultez l'historique de toutes vos opérations.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            ← Retour au dashboard
          </a>
        </div>

        {/* Statistics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Transactions
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {totalTransactions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total des gains
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              {totalCredits.toLocaleString("fr-FR")} FCFA
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total retiré
            </p>

            <p className="mt-2 text-3xl font-black text-red-400">
              {totalWithdrawals.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        </section>

        {/* Current balance */}
        <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
          <p className="text-sm font-medium text-slate-400">
            Solde disponible actuel
          </p>

          <p className="mt-2 text-4xl font-black text-cyan-400">
            {user.balance.toLocaleString("fr-FR")} FCFA
          </p>
        </section>

        {/* Transaction history */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Historique
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Toutes vos opérations sont affichées ici.
              </p>
            </div>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-slate-300">
              {totalTransactions}
            </span>
          </div>

          {user.transactions.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
              <p className="font-semibold text-slate-300">
                Aucune transaction pour le moment.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Vos prochaines opérations apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {user.transactions.map((transaction) => {
                const style = getTransactionStyle(transaction.type);

                return (
                  <div
                    key={transaction.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white">
                            {getTransactionLabel(transaction.type)}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${style.badge}`}
                          >
                            {transaction.type}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          {transaction.description}
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          {new Date(
                            transaction.createdAt
                          ).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p
                          className={`text-xl font-black ${style.amount}`}
                        >
                          {style.sign}
                          {transaction.amount.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          FCFA
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
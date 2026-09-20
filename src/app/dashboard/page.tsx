import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("nexora_user_id")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      referrals: {
        where: {
          activationStatus: "ACTIVE",
        },
        select: {
          id: true,
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

  const referralCount = user.referrals.length;

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  const transactionLabels: Record<string, string> = {
    ACTIVATION: "Activation du compte",
    REFERRAL_REWARD: "Récompense de parrainage",
    MISSION_REWARD: "Récompense de mission",
    DAILY_TASK_REWARD: "Récompense tâche quotidienne",
    WITHDRAWAL: "Retrait",
    WITHDRAWAL_REFUND: "Remboursement du retrait",
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-400">
              Bienvenue sur Nexora
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Bonjour, {user.name} 👋
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Gérez vos missions, tâches quotidiennes et gains depuis votre
              tableau de bord.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              Compte actif
            </span>

            <Link
              href="/api/logout"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-500/40 hover:text-red-400"
            >
              Déconnexion
            </Link>
          </div>
        </header>

        {/* SOLDES PRINCIPAUX */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-6 shadow-xl">
            <p className="text-sm text-slate-400">Solde disponible</p>

            <p className="mt-2 text-3xl font-bold text-cyan-300">
              {user.balance.toLocaleString("fr-FR")} FCFA
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Solde général disponible pour les opérations classiques.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-slate-900 p-6 shadow-xl">
            <p className="text-sm text-slate-400">Solde en traitement</p>

            <p className="mt-2 text-3xl font-bold text-amber-300">
              {user.lockedBalance.toLocaleString("fr-FR")} FCFA
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Montant actuellement associé aux retraits en attente.
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-6 shadow-xl">
            <p className="text-sm text-slate-400">Filleuls actifs</p>

            <p className="mt-2 text-3xl font-bold text-purple-300">
              {referralCount}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Utilisateurs actifs parrainés par votre compte.
            </p>
          </div>
        </section>

        {/* ACTIONS PRINCIPALES */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Gagner de l'argent</h2>

            <p className="mt-1 text-sm text-slate-400">
              Choisissez une activité disponible sur votre compte.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* TÂCHES QUOTIDIENNES */}
            <Link
              href="/tasks"
              className="group rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-slate-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-2xl">
                🎯
              </div>

              <h3 className="font-bold text-white group-hover:text-cyan-300">
                Tâches quotidiennes
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Effectuez la tâche du jour et gagnez votre récompense.
              </p>

              <div className="mt-4 text-sm font-semibold text-cyan-400">
                Voir la tâche →
              </div>
            </Link>

            {/* MISSIONS */}
            <Link
              href="/missions"
              className="group rounded-2xl border border-purple-500/20 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-purple-400/50 hover:bg-slate-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                🏆
              </div>

              <h3 className="font-bold text-white group-hover:text-purple-300">
                Missions
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Accomplissez vos missions de parrainage et réclamez vos
                récompenses.
              </p>

              <div className="mt-4 text-sm font-semibold text-purple-400">
                Voir les missions →
              </div>
            </Link>

            {/* PARRAINAGE */}
            <Link
              href="/referrals"
              className="group rounded-2xl border border-emerald-500/20 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-emerald-400/50 hover:bg-slate-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
                👥
              </div>

              <h3 className="font-bold text-white group-hover:text-emerald-300">
                Parrainage
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Invitez de nouveaux utilisateurs et développez votre réseau.
              </p>

              <div className="mt-4 text-sm font-semibold text-emerald-400">
                Mon parrainage →
              </div>
            </Link>

            {/* RETRAIT CLASSIQUE */}
            <Link
              href="/withdrawal"
              className="group rounded-2xl border border-amber-500/20 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-amber-400/50 hover:bg-slate-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
                💰
              </div>

              <h3 className="font-bold text-white group-hover:text-amber-300">
                Retirer mes gains
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Demandez un retrait de votre solde général disponible.
              </p>

              <div className="mt-4 text-sm font-semibold text-amber-400">
                Effectuer un retrait →
              </div>
            </Link>

            {/* RETRAIT DES TÂCHES */}
            <Link
              href="/task-withdrawal"
              className="group rounded-2xl border border-blue-500/20 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-blue-400/50 hover:bg-slate-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                🏦
              </div>

              <h3 className="font-bold text-white group-hover:text-blue-300">
                Gains des tâches
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Consultez le solde de chaque tâche et demandez un retrait
                séparément.
              </p>

              <div className="mt-4 text-sm font-semibold text-blue-400">
                Retirer mes gains →
              </div>
            </Link>
          </div>
        </section>

        {/* NAVIGATION */}
        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* TRANSACTIONS */}
            <Link
              href="/transactions"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/30"
            >
              <div className="text-2xl">📊</div>

              <h3 className="mt-3 font-bold">Transactions</h3>

              <p className="mt-1 text-sm text-slate-400">
                Consultez l'historique de vos opérations.
              </p>
            </Link>

            {/* HISTORIQUE RETRAITS */}
            <Link
              href="/withdrawal-history"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-amber-500/30"
            >
              <div className="text-2xl">📋</div>

              <h3 className="mt-3 font-bold">Historique des retraits</h3>

              <p className="mt-1 text-sm text-slate-400">
                Consultez vos demandes de retrait classiques.
              </p>
            </Link>

            {/* GAINS DES TÂCHES */}
            <Link
              href="/task-withdrawal"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500/30"
            >
              <div className="text-2xl">🏦</div>

              <h3 className="mt-3 font-bold">Gains des tâches</h3>

              <p className="mt-1 text-sm text-slate-400">
                Consultez vos soldes par tâche et effectuez vos retraits.
              </p>
            </Link>

            {/* PARRAINAGE */}
            <Link
              href="/referrals"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-emerald-500/30"
            >
              <div className="text-2xl">🔗</div>

              <h3 className="mt-3 font-bold">Mon lien de parrainage</h3>

              <p className="mt-1 text-sm text-slate-400">
                Partagez votre lien et suivez vos filleuls.
              </p>
            </Link>

            {/* TÂCHE DU JOUR */}
            <Link
              href="/tasks"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/30"
            >
              <div className="text-2xl">📅</div>

              <h3 className="mt-3 font-bold">Tâche du jour</h3>

              <p className="mt-1 text-sm text-slate-400">
                Revenez chaque jour pour effectuer la tâche disponible.
              </p>
            </Link>
          </div>
        </section>

        {/* TRANSACTIONS RÉCENTES */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Activité récente</h2>

              <p className="mt-1 text-sm text-slate-400">
                Vos cinq dernières opérations.
              </p>
            </div>

            <Link
              href="/transactions"
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Tout voir →
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Aucune transaction pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentTransactions.map((transaction) => {
                  const isPositive =
                    transaction.type === "ACTIVATION" ||
                    transaction.type === "REFERRAL_REWARD" ||
                    transaction.type === "MISSION_REWARD" ||
                    transaction.type === "DAILY_TASK_REWARD" ||
                    transaction.type === "WITHDRAWAL_REFUND";

                  return (
                    <div
                      key={transaction.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {transactionLabels[transaction.type] ??
                            transaction.description}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>

                      <div
                        className={`text-sm font-bold ${
                          isPositive
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
                        {transaction.amount.toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* INFORMATIONS */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-lg font-bold">Informations</h2>

          <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-950 p-4">
              <span className="text-slate-500">Nom</span>

              <p className="mt-1 font-medium text-white">
                {user.name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <span className="text-slate-500">Téléphone</span>

              <p className="mt-1 font-medium text-white">
                {user.phone}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <span className="text-slate-500">Email</span>

              <p className="mt-1 break-all font-medium text-white">
                {user.email}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <span className="text-slate-500">
                Code de parrainage
              </span>

              <p className="mt-1 font-medium text-cyan-300">
                {user.referralCode}
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 pb-6 text-center text-xs text-slate-600">
          Nexora © {new Date().getFullYear()} — Tous droits réservés.
        </footer>
      </div>
    </main>
  );
}

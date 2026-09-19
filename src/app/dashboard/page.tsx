import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MobileMenu from "@/components/MobileMenu";

export default async function DashboardPage() {
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
      phone: true,
      email: true,
      referralCode: true,
      activationStatus: true,
      balance: true,
      lockedBalance: true,
      createdAt: true,
      _count: {
        select: {
          referrals: true,
          transactions: true,
          withdrawals: true,
          missionCompletions: true,
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

  const referralLink = `/register?ref=${user.referralCode}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-1 truncate text-2xl font-black sm:text-3xl">
              Bonjour {user.name} 👋
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Bienvenue dans votre espace personnel.
            </p>
          </div>

          <MobileMenu />
        </header>

        {/* STATUT */}
        <section className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-400">
                ✓ Compte actif
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Votre compte Nexora est actuellement actif.
              </p>
            </div>

            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
              ACTIVE
            </span>
          </div>
        </section>

        {/* SOLDE */}
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Solde disponible
                </p>

                <p className="mt-2 text-4xl font-black text-cyan-400 sm:text-5xl">
                  {user.balance.toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-2xl">
                💰
              </div>
            </div>

            <a
              href="/withdrawal"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
            >
              💸 Retirer mes gains
            </a>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Solde bloqué
                </p>

                <p className="mt-2 text-4xl font-black text-yellow-400 sm:text-5xl">
                  {user.lockedBalance.toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-2xl">
                ⏳
              </div>
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-500">
              Montant temporairement bloqué pendant le traitement de vos
              demandes de retrait.
            </p>
          </div>
        </section>

        {/* ACTIONS RAPIDES */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Accès rapides</h2>
            <p className="mt-1 text-sm text-slate-500">
              Accédez rapidement aux principales fonctionnalités.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/referrals"
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/50 hover:bg-slate-900/80"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-2xl">
                  👥
                </div>

                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400">
                    Parrainage
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Inviter et suivre vos filleuls
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/missions"
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/50 hover:bg-slate-900/80"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                  🎯
                </div>

                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400">
                    Missions
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Consultez vos missions disponibles
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/transactions"
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/50 hover:bg-slate-900/80"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                  💳
                </div>

                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400">
                    Transactions
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Consultez votre historique financier
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/withdrawal"
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/50 hover:bg-slate-900/80"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-2xl">
                  💸
                </div>

                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400">
                    Faire un retrait
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Demander le retrait de vos gains
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/withdrawal-history"
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/50 hover:bg-slate-900/80"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-2xl">
                  📋
                </div>

                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400">
                    Historique des retraits
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Suivre vos demandes de retrait
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/dashboard"
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/50 hover:bg-slate-900/80"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                  🏠
                </div>

                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400">
                    Mon dashboard
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Vue générale de votre compte
                  </p>
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* PARRAINAGE */}
        <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-400">
                PROGRAMME DE PARRAINAGE
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Invitez vos proches
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Partagez votre code de parrainage et suivez vos filleuls
                directement depuis votre espace.
              </p>
            </div>

            <a
              href="/referrals"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 font-bold text-cyan-400 transition hover:bg-cyan-500/20"
            >
              Voir mon parrainage →
            </a>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Votre code
              </p>

              <p className="mt-2 break-all text-xl font-black text-white">
                {user.referralCode}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Votre lien
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-cyan-400">
                {referralLink}
              </p>
            </div>
          </div>
        </section>

        {/* STATISTIQUES */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Statistiques de votre compte
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Résumé de votre activité sur Nexora.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">
                Filleuls
              </p>

              <p className="mt-2 text-3xl font-black text-cyan-400">
                {user._count.referrals}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">
                Transactions
              </p>

              <p className="mt-2 text-3xl font-black text-white">
                {user._count.transactions}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">
                Retraits
              </p>

              <p className="mt-2 text-3xl font-black text-yellow-400">
                {user._count.withdrawals}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">
                Missions terminées
              </p>

              <p className="mt-2 text-3xl font-black text-green-400">
                {user._count.missionCompletions}
              </p>
            </div>
          </div>
        </section>

        {/* INFORMATIONS DU COMPTE */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Informations du compte
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Vos informations personnelles.
              </p>
            </div>

            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
              Actif
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nom
              </p>

              <p className="mt-2 font-semibold text-white">
                {user.name}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Téléphone
              </p>

              <p className="mt-2 font-semibold text-white">
                {user.phone}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </p>

              <p className="mt-2 break-all font-semibold text-white">
                {user.email}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Membre depuis
              </p>

              <p className="mt-2 font-semibold text-white">
                {new Date(user.createdAt).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </p>
            </div>
          </div>
        </section>

        {/* DECONNEXION */}
        <section className="mt-6">
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3.5 font-bold text-red-400 transition hover:bg-red-500/10"
            >
              🚪 Se déconnecter
            </button>
          </form>
        </section>

        <footer className="mt-8 pb-4 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Nexora. Tous droits réservés.
        </footer>
      </div>
    </main>
  );
}

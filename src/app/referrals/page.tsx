import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CopyReferralButton from "@/components/CopyReferralButton";

export default async function ReferralsPage() {
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
      referralCode: true,
      referrals: {
        select: {
          id: true,
          name: true,
          phone: true,
          activationStatus: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      transactions: {
        where: {
          type: "REFERRAL_REWARD",
        },
        select: {
          id: true,
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

  const totalReferrals = user.referrals.length;

  const activeReferrals = user.referrals.filter(
    (referral) => referral.activationStatus === "ACTIVE"
  ).length;

  const pendingReferrals = user.referrals.filter(
    (referral) => referral.activationStatus === "PENDING"
  ).length;

  const rejectedReferrals = user.referrals.filter(
    (referral) => referral.activationStatus === "REJECTED"
  ).length;

  const totalRewards = user.transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const referralLink = `https://nexoraearning.netlify.app/register?ref=${user.referralCode}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Mon parrainage
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Invitez vos proches et développez votre réseau.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            ← Dashboard
          </a>
        </div>

        {/* STATISTIQUES */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total filleuls
            </p>

            <p className="mt-2 text-3xl font-black text-cyan-400">
              {totalReferrals}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Filleuls actifs
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              {activeReferrals}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              En attente
            </p>

            <p className="mt-2 text-3xl font-black text-yellow-400">
              {pendingReferrals}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Gains de parrainage
            </p>

            <p className="mt-2 text-3xl font-black text-purple-400">
              {totalRewards.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        </section>

        {/* LIEN DE PARRAINAGE */}
        <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
          <div>
            <p className="text-sm font-semibold text-cyan-400">
              VOTRE LIEN DE PARRAINAGE
            </p>

            <h2 className="mt-1 text-xl font-black">
              Invitez vos proches
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Partagez ce lien pour permettre à vos filleuls de
              s'inscrire directement avec votre code.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="break-all text-sm font-semibold text-cyan-400">
                {referralLink}
              </p>
            </div>

            <CopyReferralButton
              value={referralLink}
              label="Copier le lien"
            />
          </div>

          <p className="mt-3 text-xs text-slate-600">
            Le lien sera automatiquement complété avec l'adresse
            actuelle du site lors de son utilisation dans le navigateur.
          </p>
        </section>

        {/* CODE DE PARRAINAGE */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Votre code de parrainage
              </p>

              <p className="mt-2 text-3xl font-black tracking-wider text-white">
                {user.referralCode}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Vos filleuls peuvent également utiliser ce code
                lors de leur inscription.
              </p>
            </div>

            <CopyReferralButton
              value={user.referralCode}
              label="Copier le code"
            />
          </div>
        </section>

        {/* OBJECTIFS */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <p className="text-sm font-semibold text-cyan-400">
              RÉCOMPENSES DE PARRAINAGE
            </p>

            <h2 className="mt-1 text-xl font-black">
              Vos objectifs
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Les récompenses sont basées sur le nombre de filleuls
              ayant activé leur compte.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {/* 5 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-slate-300">
                5 filleuls actifs
              </p>

              <p className="mt-2 text-2xl font-black text-cyan-400">
                +1 000 FCFA
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {Math.min(activeReferrals, 5)} / 5
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeReferrals / 5) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* 10 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-slate-300">
                10 filleuls actifs
              </p>

              <p className="mt-2 text-2xl font-black text-cyan-400">
                +2 000 FCFA
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {Math.min(activeReferrals, 10)} / 10
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeReferrals / 10) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* 30 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-slate-300">
                30 filleuls actifs
              </p>

              <p className="mt-2 text-2xl font-black text-cyan-400">
                +5 000 FCFA
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {Math.min(activeReferrals, 30)} / 30
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeReferrals / 30) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4">
            <p className="text-xs leading-5 text-slate-400">
              Les récompenses sont réclamées depuis la section
              <span className="font-semibold text-cyan-400">
                {" "}
                Missions
              </span>
              . Chaque objectif ne peut être récompensé qu'une seule
              fois.
            </p>
          </div>
        </section>

        {/* FILLEULS */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Mes filleuls
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consultez les personnes inscrites avec votre code.
              </p>
            </div>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-slate-300">
              {totalReferrals}
            </span>
          </div>

          {user.referrals.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-2xl">
                👥
              </div>

              <p className="mt-4 font-semibold text-slate-300">
                Aucun filleul pour le moment.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Partagez votre lien de parrainage pour commencer.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {user.referrals.map((referral) => {
                const isActive =
                  referral.activationStatus === "ACTIVE";

                const isPending =
                  referral.activationStatus === "PENDING";

                return (
                  <div
                    key={referral.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-white">
                          {referral.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {referral.phone}
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Inscrit le{" "}
                          {new Date(
                            referral.createdAt
                          ).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {isActive ? (
                        <span className="w-fit rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                          ✓ Actif
                        </span>
                      ) : isPending ? (
                        <span className="w-fit rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400">
                          En attente
                        </span>
                      ) : (
                        <span className="w-fit rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                          Rejeté
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* GAINS */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Gains de parrainage
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Historique de vos récompenses de parrainage.
              </p>
            </div>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-slate-300">
              {user.transactions.length}
            </span>
          </div>

          {user.transactions.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
              <p className="font-semibold text-slate-300">
                Aucun gain de parrainage pour le moment.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Vos prochaines récompenses apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {user.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {transaction.description}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
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

                    <p className="text-xl font-black text-green-400">
                      +{transaction.amount.toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* NAVIGATION */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <a
            href="/dashboard"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            🏠 Dashboard
          </a>

          <a
            href="/missions"
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            🎯 Missions
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

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ActivationPage() {
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
      name: true,
      phone: true,
      email: true,
      referralCode: true,
      activationStatus: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.activationStatus === "ACTIVE") {
    redirect("/dashboard");
  }

  const isRejected = user.activationStatus === "REJECTED";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-lg">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl font-black tracking-tight">
            Nexora
          </div>

          <h1 className="text-2xl font-bold">
            Activation de votre compte
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Activez votre compte pour accéder aux fonctionnalités de Nexora.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          {/* Statut */}
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-300">
              {isRejected
                ? "Votre précédente demande d'activation a été rejetée. Vous pouvez effectuer une nouvelle tentative de paiement."
                : "Votre compte est actuellement en attente d'activation."}
            </p>
          </div>

          {/* Montant */}
          <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-950 p-5 text-center">
            <p className="text-sm text-slate-400">
              Frais d'activation
            </p>

            <p className="mt-2 text-4xl font-black text-cyan-400">
              1 000 FCFA
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Paiement sécurisé via PayGate Global
            </p>
          </div>

          {/* Informations utilisateur */}
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Nom
              </p>

              <p className="mt-1 font-medium">
                {user.name}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Téléphone
              </p>

              <p className="mt-1 font-medium">
                {user.phone}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-500">
                Adresse e-mail
              </p>

              <p className="mt-1 break-all font-medium">
                {user.email}
              </p>
            </div>
          </div>

          {/* Fonctionnement */}
          <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-sm font-semibold text-cyan-300">
              Comment ça fonctionne ?
            </p>

            <ol className="mt-3 space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="font-bold text-cyan-400">1.</span>
                <span>
                  Cliquez sur le bouton d'activation.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="font-bold text-cyan-400">2.</span>
                <span>
                  Vous serez redirigé vers PayGate pour effectuer le paiement
                  de 1 000 FCFA.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="font-bold text-cyan-400">3.</span>
                <span>
                  Choisissez votre moyen de paiement disponible et effectuez
                  le paiement.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="font-bold text-cyan-400">4.</span>
                <span>
                  Après confirmation du paiement, votre compte est activé
                  automatiquement.
                </span>
              </li>
            </ol>
          </div>

          {/* Bouton PayGate */}
          <a
            href="/api/payment/paygate"
            className="mt-6 block w-full rounded-xl bg-cyan-500 px-4 py-4 text-center font-black text-slate-950 transition hover:bg-cyan-400 active:scale-[0.99]"
          >
            ACTIVER MON COMPTE — 1 000 FCFA
          </a>

          {/* Sécurité */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
            <p className="text-xs leading-5 text-slate-500">
              Le paiement est traité par PayGate Global. Nexora vérifie
              automatiquement la confirmation du paiement avant d'activer
              votre compte.
            </p>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-6 text-center">
            <p className="text-xs text-slate-600">
              Une fois votre paiement confirmé, vous pourrez accéder à votre
              espace Nexora.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
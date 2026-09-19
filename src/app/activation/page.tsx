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

  const whatsappMessage = encodeURIComponent(
    `Bonjour Nexora,

Je souhaite activer mon compte.

Nom : ${user.name}
Téléphone : ${user.phone}
E-mail : ${user.email}
Code de parrainage : ${user.referralCode}

Montant de l'activation : 1 000 FCFA

Je vais effectuer le paiement et envoyer la preuve de paiement pour validation.

Merci.`
  );

  const whatsappUrl = `https://wa.me/22898126142?text=${whatsappMessage}`;

  const isRejected = user.activationStatus === "REJECTED";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl font-black tracking-tight">
            Nexora
          </div>

          <h1 className="text-2xl font-bold">
            Activation de votre compte
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Activez votre compte pour accéder à toutes les fonctionnalités
            de Nexora.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-300">
              {isRejected
                ? "Votre précédente demande d'activation a été rejetée. Veuillez contacter WhatsApp Business pour effectuer une nouvelle demande."
                : "Votre compte est actuellement en attente d'activation."}
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-950 p-5 text-center">
            <p className="text-sm text-slate-400">
              Montant de l'activation
            </p>

            <p className="mt-2 text-4xl font-black text-cyan-400">
              1 000 FCFA
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Activation manuelle après vérification du paiement.
            </p>
          </div>

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
              <p className="mt-1 font-medium break-all">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-sm font-semibold text-cyan-300">
              Comment activer votre compte ?
            </p>

            <ol className="mt-3 space-y-2 text-sm text-slate-300">
              <li>1. Effectuez le paiement de 1 000 FCFA.</li>
              <li>2. Cliquez sur le bouton WhatsApp Business.</li>
              <li>3. Envoyez votre preuve de paiement.</li>
              <li>4. Attendez la validation de votre compte.</li>
            </ol>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block w-full rounded-xl bg-cyan-500 px-4 py-3.5 text-center font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            ACTIVER MON COMPTE
          </a>

          <p className="mt-4 text-center text-xs text-slate-500">
            WhatsApp Business : +228 98 12 61 42
          </p>

          <div className="mt-6 border-t border-slate-800 pt-6 text-center">
            <p className="text-xs text-slate-500">
              Votre compte sera activé après vérification de votre preuve de
              paiement.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
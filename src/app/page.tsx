import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Créez votre compte",
    text: "Inscrivez-vous gratuitement et obtenez votre espace personnel Nexora.",
  },
  {
    number: "02",
    title: "Activez votre compte",
    text: "Effectuez l'activation de votre compte pour accéder aux fonctionnalités de la plateforme.",
  },
  {
    number: "03",
    title: "Participez",
    text: "Invitez votre communauté et participez aux missions disponibles.",
  },
  {
    number: "04",
    title: "Demandez votre retrait",
    text: "Lorsque votre solde atteint le minimum requis, vous pouvez effectuer une demande de retrait.",
  },
];

const advantages = [
  {
    icon: "↗",
    title: "Parrainage",
    text: "Développez votre réseau et recevez des récompenses lorsque vos filleuls activent leur compte.",
  },
  {
    icon: "✓",
    title: "Missions",
    text: "Participez aux missions proposées sur Nexora et recevez les récompenses correspondantes.",
  },
  {
    icon: "₣",
    title: "Retraits",
    text: "Demandez vos gains via les moyens de paiement disponibles sur la plateforme.",
  },
  {
    icon: "◉",
    title: "Espace personnel",
    text: "Suivez vos gains, vos filleuls, vos transactions et vos demandes depuis un seul espace.",
  },
];

const faqs = [
  {
    question: "Qu'est-ce que Nexora ?",
    answer:
      "Nexora est une plateforme qui permet à ses membres de participer à des missions et de développer leur réseau grâce au système de parrainage.",
  },
  {
    question: "Combien coûte l'activation ?",
    answer:
      "L'activation du compte Nexora coûte 1 000 FCFA. La validation de l'activation est effectuée manuellement.",
  },
  {
    question: "Comment fonctionne le parrainage ?",
    answer:
      "Chaque membre dispose d'un lien et d'un code de parrainage. Lorsqu'une personne s'inscrit avec votre code et active son compte, une récompense de 500 FCFA est attribuée au parrain.",
  },
  {
    question: "Quel est le montant minimum pour retirer ?",
    answer:
      "Le montant minimum d'une demande de retrait est de 1 500 FCFA. Des frais de 500 FCFA s'appliquent aux retraits.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070711] text-white">
      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070711]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-black shadow-lg shadow-violet-500/20">
              N
            </div>

            <span className="text-xl font-black tracking-tight">
              Nexora
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#fonctionnement"
              className="text-sm text-white/65 transition hover:text-white"
            >
              Fonctionnement
            </a>

            <a
              href="#avantages"
              className="text-sm text-white/65 transition hover:text-white"
            >
              Avantages
            </a>

            <a
              href="#faq"
              className="text-sm text-white/65 transition hover:text-white"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/5 hover:text-white sm:block"
            >
              Connexion
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-white/90"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-32">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="absolute right-0 top-64 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              Bienvenue sur Nexora
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-8xl">
              Transformez votre
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                réseau en opportunités.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
              Nexora vous permet de développer votre réseau, de participer à
              des missions et de suivre vos récompenses depuis un espace
              personnel simple et moderne.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-4 text-sm font-bold shadow-xl shadow-violet-500/20 transition hover:scale-[1.02]"
              >
                Commencer maintenant →
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Se connecter
              </Link>
            </div>
          </div>

          {/* HERO CARD */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-violet-950/30">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#0d0d19] p-6 sm:p-8">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40">APERÇU DE VOTRE ESPACE</p>
                    <h2 className="mt-2 text-xl font-bold">Votre activité</h2>
                  </div>

                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    Compte actif
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <p className="text-xs text-white/40">SOLDE</p>
                    <p className="mt-3 text-3xl font-black">2 500 F</p>
                    <p className="mt-2 text-xs text-emerald-400">
                      Disponible
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <p className="text-xs text-white/40">FILLEULS ACTIFS</p>
                    <p className="mt-3 text-3xl font-black">12</p>
                    <p className="mt-2 text-xs text-violet-300">
                      Votre réseau
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <p className="text-xs text-white/40">RÉCOMPENSES</p>
                    <p className="mt-3 text-3xl font-black">500 F</p>
                    <p className="mt-2 text-xs text-fuchsia-300">
                      Parrainage
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 sm:grid-cols-4 px-5 lg:px-8">
          <div className="px-4 py-8 text-center">
            <p className="text-2xl font-black sm:text-3xl">1 000 F</p>
            <p className="mt-1 text-xs text-white/40">Activation</p>
          </div>

          <div className="px-4 py-8 text-center">
            <p className="text-2xl font-black sm:text-3xl">500 F</p>
            <p className="mt-1 text-xs text-white/40">Bonus parrainage</p>
          </div>

          <div className="border-t border-white/10 px-4 py-8 text-center sm:border-t-0">
            <p className="text-2xl font-black sm:text-3xl">1 500 F</p>
            <p className="mt-1 text-xs text-white/40">Minimum retrait</p>
          </div>

          <div className="border-t border-white/10 px-4 py-8 text-center sm:border-t-0">
            <p className="text-2xl font-black sm:text-3xl">24/7</p>
            <p className="mt-1 text-xs text-white/40">Accès à votre espace</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="fonctionnement" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-400">
            Simple et accessible
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Comment fonctionne Nexora ?
          </h2>

          <p className="mt-5 text-white/55">
            Quelques étapes simples pour commencer à utiliser votre espace
            Nexora.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="group rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.045]"
            >
              <span className="text-sm font-black text-violet-400">
                {feature.number}
              </span>

              <h3 className="mt-8 text-lg font-bold">{feature.title}</h3>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ADVANTAGES */}
      <section
        id="avantages"
        className="border-y border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-400">
              L'univers Nexora
            </p>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Un espace pensé pour votre activité
            </h2>

            <p className="mt-5 text-white/55">
              Retrouvez les principales fonctionnalités dont vous avez besoin
              dans une seule plateforme.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((advantage) => (
              <div
                key={advantage.title}
                className="rounded-3xl border border-white/10 bg-[#0b0b15] p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-xl text-violet-300">
                  {advantage.icon}
                </div>

                <h3 className="mt-6 text-lg font-bold">
                  {advantage.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  {advantage.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-transparent p-8 sm:p-12 lg:p-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[90px]" />

          <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">
                Programme de parrainage
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Développez votre réseau avec Nexora.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-white/60">
                Partagez votre lien personnel avec votre communauté. Lorsqu'un
                filleul active son compte, vous recevez une récompense de
                parrainage de 500 FCFA.
              </p>

              <Link
                href="/register"
                className="mt-8 inline-flex rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-white/90"
              >
                Rejoindre Nexora
              </Link>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 backdrop-blur">
              <p className="text-xs font-semibold text-white/40">
                EXEMPLE DE RÉCOMPENSE
              </p>

              <div className="mt-6 flex items-end justify-between border-b border-white/10 pb-6">
                <div>
                  <p className="text-sm text-white/40">1 filleul actif</p>
                  <p className="mt-2 text-4xl font-black">+500 F</p>
                </div>

                <div className="text-4xl text-emerald-400">↗</div>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-sm text-white/40">10 filleuls actifs</p>
                  <p className="mt-2 text-3xl font-black">+5 000 F</p>
                </div>

                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Parrainage
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-5 py-24 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-400">
              FAQ
            </p>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Questions fréquentes
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6"
              >
                <summary className="cursor-pointer list-none pr-8 text-base font-bold">
                  {faq.question}
                </summary>

                <p className="mt-4 text-sm leading-6 text-white/50">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] px-6 py-16 text-center sm:px-12">
          <h2 className="text-4xl font-black sm:text-5xl">
            Prêt à rejoindre Nexora ?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-white/50">
            Créez votre compte et découvrez votre nouvel espace Nexora.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 text-sm font-bold shadow-xl shadow-violet-500/20 transition hover:scale-[1.02]"
          >
            Créer mon compte →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-black">
                N
              </div>

              <span className="font-black">Nexora</span>
            </div>

            <p className="mt-3 text-xs text-white/35">
              Une plateforme pour développer votre réseau et participer à des
              missions.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-xs text-white/40">
            <Link href="/login" className="transition hover:text-white">
              Connexion
            </Link>

            <Link href="/register" className="transition hover:text-white">
              Inscription
            </Link>

            <Link href="/activation" className="transition hover:text-white">
              Activation
            </Link>

            <span>© 2026 Nexora</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
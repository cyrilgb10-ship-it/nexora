import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("nexora_user_id")?.value;

  if (!userId) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activationStatus: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    rejectedUsers,
    pendingWithdrawals,
    totalMissions,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.count({
      where: {
        activationStatus: "ACTIVE",
      },
    }),

    prisma.user.count({
      where: {
        activationStatus: "PENDING",
      },
    }),

    prisma.user.count({
      where: {
        activationStatus: "REJECTED",
      },
    }),

    prisma.withdrawal.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.mission.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              NEXORA ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Tableau de bord
            </h1>

            <p className="mt-2 text-slate-400">
              Bienvenue, {admin.name}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
            >
              Espace utilisateur
            </a>

            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Utilisateurs"
            value={totalUsers}
            icon="👥"
            href="/admin/users"
          />

          <StatCard
            title="Comptes actifs"
            value={activeUsers}
            icon="🟢"
            href="/admin/users?status=ACTIVE"
          />

          <StatCard
            title="Activations en attente"
            value={pendingUsers}
            icon="🟠"
            href="/admin/users?status=PENDING"
            highlight
          />

          <StatCard
            title="Comptes rejetés"
            value={rejectedUsers}
            icon="🔴"
            href="/admin/users?status=REJECTED"
          />

          <StatCard
            title="Retraits en attente"
            value={pendingWithdrawals}
            icon="💸"
            href="/admin/withdrawals"
            highlight
          />

          <StatCard
            title="Missions actives"
            value={totalMissions}
            icon="🎯"
            href="/admin/missions"
          />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AdminLink
            href="/admin/users"
            icon="👥"
            title="Gestion des utilisateurs"
            description="Consulter les comptes et gérer les activations."
          />

          <AdminLink
            href="/admin/withdrawals"
            icon="💸"
            title="Gestion des retraits"
            description="Traiter les demandes de retrait des utilisateurs."
          />

          <AdminLink
            href="/admin/missions"
            icon="🎯"
            title="Gestion des missions"
            description="Consulter et gérer les missions disponibles."
          />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-black">Compte administrateur</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info label="Nom" value={admin.name} />
            <Info label="Email" value={admin.email} />
            <Info label="Rôle" value="ADMIN" />
            <Info label="Statut" value={admin.activationStatus} />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
  highlight = false,
}: {
  title: string;
  value: number;
  icon: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-2xl border p-5 transition ${
        highlight
          ? "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-400"
          : "border-slate-800 bg-slate-900/70 hover:border-slate-600"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>

        <span className="text-3xl font-black text-white">
          {value}
        </span>
      </div>

      <p className="mt-4 font-semibold text-slate-300">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Voir les détails →
      </p>
    </a>
  );
}

function AdminLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-cyan-500/50 hover:bg-slate-900"
    >
      <div className="text-3xl">{icon}</div>

      <h2 className="mt-4 text-lg font-black text-white">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </a>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
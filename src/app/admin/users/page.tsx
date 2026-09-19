import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  status?: string;
  search?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("nexora_user_id")?.value;

  if (!adminId) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const status =
    params.status === "ACTIVE" ||
    params.status === "PENDING" ||
    params.status === "REJECTED"
      ? params.status
      : undefined;

  const search = params.search?.trim() || "";

  const users = await prisma.user.findMany({
    where: {
      ...(status
        ? {
            activationStatus: status,
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: search,
                },
              },
              {
                referralCode: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
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
      referredBy: {
        select: {
          name: true,
          phone: true,
        },
      },
      _count: {
        select: {
          referrals: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              NEXORA ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Gestion des utilisateurs
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Activation et gestion des comptes utilisateurs.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-center text-sm font-bold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            ← Dashboard Admin
          </a>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <form
            method="GET"
            action="/admin/users"
            className="flex flex-col gap-3 lg:flex-row"
          >
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Rechercher par nom, téléphone, email ou code..."
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
            />

            {status && (
              <input
                type="hidden"
                name="status"
                value={status}
              />
            )}

            <button
              type="submit"
              className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400"
            >
              Rechercher
            </button>

            <a
              href="/admin/users"
              className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-center text-sm font-bold text-slate-300 transition hover:border-slate-500"
            >
              Réinitialiser
            </a>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterLink
              href="/admin/users"
              label="Tous"
              active={!status}
            />

            <FilterLink
              href="/admin/users?status=PENDING"
              label="🟠 En attente"
              active={status === "PENDING"}
            />

            <FilterLink
              href="/admin/users?status=ACTIVE"
              label="🟢 Actifs"
              active={status === "ACTIVE"}
            />

            <FilterLink
              href="/admin/users?status=REJECTED"
              label="🔴 Rejetés"
              active={status === "REJECTED"}
            />
          </div>
        </section>

        <div className="mb-4 text-sm text-slate-500">
          {users.length} utilisateur{users.length !== 1 ? "s" : ""}
          {status ? ` — ${status}` : ""}
        </div>

        <section className="space-y-4">
          {users.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
              <p className="text-lg font-bold text-white">
                Aucun utilisateur trouvé.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Modifie ta recherche ou le filtre sélectionné.
              </p>
            </div>
          ) : (
            users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function UserCard({
  user,
}: {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
    referralCode: string;
    activationStatus: "PENDING" | "ACTIVE" | "REJECTED";
    balance: number;
    lockedBalance: number;
    createdAt: Date;
    referredBy: {
      name: string;
      phone: string;
    } | null;
    _count: {
      referrals: number;
    };
  };
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-white">
              {user.name}
            </h2>

            <StatusBadge status={user.activationStatus} />
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Téléphone" value={user.phone} />
            <Info label="Email" value={user.email} />
            <Info label="Code parrainage" value={user.referralCode} />

            <Info
              label="Solde"
              value={`${user.balance.toLocaleString("fr-FR")} FCFA`}
            />

            <Info
              label="Solde verrouillé"
              value={`${user.lockedBalance.toLocaleString("fr-FR")} FCFA`}
            />

            <Info
              label="Filleuls"
              value={String(user._count.referrals)}
            />

            <Info
              label="Parrain"
              value={
                user.referredBy
                  ? `${user.referredBy.name} (${user.referredBy.phone})`
                  : "Aucun"
              }
            />

            <Info
              label="Inscription"
              value={user.createdAt.toLocaleString("fr-FR")}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 xl:w-56">
          {user.activationStatus !== "ACTIVE" && (
            <form action="/api/admin/users/status" method="POST">
              <input
                type="hidden"
                name="userId"
                value={user.id}
              />

              <input
                type="hidden"
                name="status"
                value="ACTIVE"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
              >
                ✓ Activer le compte
              </button>
            </form>
          )}

          {user.activationStatus !== "REJECTED" && (
            <form action="/api/admin/users/status" method="POST">
              <input
                type="hidden"
                name="userId"
                value={user.id}
              />

              <input
                type="hidden"
                name="status"
                value="REJECTED"
              />

              <button
                type="submit"
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-400 transition hover:bg-red-500/20"
              >
                ✕ Rejeter le compte
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: "PENDING" | "ACTIVE" | "REJECTED";
}) {
  const config = {
    PENDING: {
      label: "En attente",
      className:
        "border-orange-500/30 bg-orange-500/10 text-orange-400",
    },
    ACTIVE: {
      label: "Actif",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    },
    REJECTED: {
      label: "Rejeté",
      className: "border-red-500/30 bg-red-500/10 text-red-400",
    },
  }[status];

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
        active
          ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
          : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white"
      }`}
    >
      {label}
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
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}
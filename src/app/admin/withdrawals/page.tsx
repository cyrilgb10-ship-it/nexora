import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  status?: string;
  taskStatus?: string;
}>;

export default async function AdminWithdrawalsPage({
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
    where: {
      id: adminId,
    },
    select: {
      role: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const status =
    params.status === "PENDING" ||
    params.status === "APPROVED" ||
    params.status === "REJECTED"
      ? params.status
      : undefined;

  const taskStatus =
    params.taskStatus === "PENDING" ||
    params.taskStatus === "APPROVED" ||
    params.taskStatus === "REJECTED"
      ? params.taskStatus
      : undefined;

  // =========================================================
  // RETRAITS CLASSIQUES
  // =========================================================

  const withdrawals = await prisma.withdrawal.findMany({
    where: status
      ? {
          status,
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      amount: true,
      method: true,
      phone: true,
      status: true,
      adminNote: true,
      processedAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          balance: true,
          lockedBalance: true,
        },
      },
    },
  });

  const pendingCount = await prisma.withdrawal.count({
    where: {
      status: "PENDING",
    },
  });

  const approvedCount = await prisma.withdrawal.count({
    where: {
      status: "APPROVED",
    },
  });

  const rejectedCount = await prisma.withdrawal.count({
    where: {
      status: "REJECTED",
    },
  });

  // =========================================================
  // RETRAITS DES TÂCHES
  // =========================================================

  const taskWithdrawals =
    await prisma.dailyTaskWithdrawal.findMany({
      where: taskStatus
        ? {
            status: taskStatus,
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        method: true,
        phone: true,
        status: true,
        adminNote: true,
        processedAt: true,
        createdAt: true,
        task: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

  const taskPendingCount =
    await prisma.dailyTaskWithdrawal.count({
      where: {
        status: "PENDING",
      },
    });

  const taskApprovedCount =
    await prisma.dailyTaskWithdrawal.count({
      where: {
        status: "APPROVED",
      },
    });

  const taskRejectedCount =
    await prisma.dailyTaskWithdrawal.count({
      where: {
        status: "REJECTED",
      },
    });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              NEXORA ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Gestion des retraits
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Gérez les retraits classiques et les retraits liés
              aux tâches quotidiennes.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-center text-sm font-bold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            ← Dashboard Admin
          </a>
        </header>

        {/* ================================================= */}
        {/* RETRAITS CLASSIQUES */}
        {/* ================================================= */}

        <section className="mb-12">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              Retraits généraux
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Retraits classiques
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Retraits provenant du solde général de l'utilisateur.
            </p>
          </div>

          {/* STATISTIQUES */}

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <Stat
              label="En attente"
              value={pendingCount}
              href="/admin/withdrawals?status=PENDING"
              active={status === "PENDING"}
            />

            <Stat
              label="Approuvés"
              value={approvedCount}
              href="/admin/withdrawals?status=APPROVED"
              active={status === "APPROVED"}
            />

            <Stat
              label="Rejetés"
              value={rejectedCount}
              href="/admin/withdrawals?status=REJECTED"
              active={status === "REJECTED"}
            />
          </section>

          {/* FILTRES */}

          <div className="mb-6 flex flex-wrap gap-2">
            <Filter
              href="/admin/withdrawals"
              label="Tous"
              active={!status}
            />

            <Filter
              href="/admin/withdrawals?status=PENDING"
              label="🟠 En attente"
              active={status === "PENDING"}
            />

            <Filter
              href="/admin/withdrawals?status=APPROVED"
              label="🟢 Approuvés"
              active={status === "APPROVED"}
            />

            <Filter
              href="/admin/withdrawals?status=REJECTED"
              label="🔴 Rejetés"
              active={status === "REJECTED"}
            />
          </div>

          {/* LISTE */}

          <section className="space-y-4">
            {withdrawals.length === 0 ? (
              <EmptyState message="Aucune demande de retrait classique." />
            ) : (
              withdrawals.map((withdrawal) => (
                <WithdrawalCard
                  key={withdrawal.id}
                  withdrawal={withdrawal}
                />
              ))
            )}
          </section>
        </section>

        {/* ================================================= */}
        {/* RETRAITS DES TÂCHES */}
        {/* ================================================= */}

        <section className="border-t border-slate-800 pt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
              Gains des tâches
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Retraits des tâches quotidiennes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Les retraits sont liés séparément au solde de chaque
              tâche.
            </p>
          </div>

          {/* STATISTIQUES TÂCHES */}

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <Stat
              label="En attente"
              value={taskPendingCount}
              href="/admin/withdrawals?taskStatus=PENDING"
              active={taskStatus === "PENDING"}
            />

            <Stat
              label="Approuvés"
              value={taskApprovedCount}
              href="/admin/withdrawals?taskStatus=APPROVED"
              active={taskStatus === "APPROVED"}
            />

            <Stat
              label="Rejetés"
              value={taskRejectedCount}
              href="/admin/withdrawals?taskStatus=REJECTED"
              active={taskStatus === "REJECTED"}
            />
          </section>

          {/* FILTRES TÂCHES */}

          <div className="mb-6 flex flex-wrap gap-2">
            <Filter
              href="/admin/withdrawals"
              label="Tous"
              active={!taskStatus}
            />

            <Filter
              href="/admin/withdrawals?taskStatus=PENDING"
              label="🟠 En attente"
              active={taskStatus === "PENDING"}
            />

            <Filter
              href="/admin/withdrawals?taskStatus=APPROVED"
              label="🟢 Approuvés"
              active={taskStatus === "APPROVED"}
            />

            <Filter
              href="/admin/withdrawals?taskStatus=REJECTED"
              label="🔴 Rejetés"
              active={taskStatus === "REJECTED"}
            />
          </div>

          {/* LISTE DES RETRAITS DE TÂCHES */}

          <section className="space-y-4">
            {taskWithdrawals.length === 0 ? (
              <EmptyState message="Aucune demande de retrait de tâche." />
            ) : (
              taskWithdrawals.map((withdrawal) => (
                <TaskWithdrawalCard
                  key={withdrawal.id}
                  withdrawal={withdrawal}
                />
              ))
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

// =========================================================
// CARTE RETRAIT CLASSIQUE
// =========================================================

function WithdrawalCard({
  withdrawal,
}: {
  withdrawal: {
    id: string;
    amount: number;
    method: string;
    phone: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    adminNote: string | null;
    processedAt: Date | null;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      phone: string;
      email: string;
      balance: number;
      lockedBalance: number;
    };
  };
}) {
  const fee = 500;
  const totalDeduction = withdrawal.amount + fee;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-6 xl:flex-row xl:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black">
              {withdrawal.user.name}
            </h2>

            <StatusBadge status={withdrawal.status} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info
              label="Montant à payer"
              value={`${withdrawal.amount.toLocaleString(
                "fr-FR"
              )} FCFA`}
            />

            <Info
              label="Frais"
              value={`${fee.toLocaleString("fr-FR")} FCFA`}
            />

            <Info
              label="Total déduit"
              value={`${totalDeduction.toLocaleString(
                "fr-FR"
              )} FCFA`}
            />

            <Info
              label="Méthode"
              value={formatMethod(withdrawal.method)}
            />

            <Info
              label="Numéro de paiement"
              value={withdrawal.phone}
            />

            <Info
              label="Téléphone utilisateur"
              value={withdrawal.user.phone}
            />

            <Info
              label="Email"
              value={withdrawal.user.email}
            />

            <Info
              label="Solde actuel"
              value={`${withdrawal.user.balance.toLocaleString(
                "fr-FR"
              )} FCFA`}
            />

            <Info
              label="Solde verrouillé"
              value={`${withdrawal.user.lockedBalance.toLocaleString(
                "fr-FR"
              )} FCFA`}
            />

            <Info
              label="Demande créée"
              value={withdrawal.createdAt.toLocaleString(
                "fr-FR"
              )}
            />

            {withdrawal.processedAt && (
              <Info
                label="Traitée le"
                value={withdrawal.processedAt.toLocaleString(
                  "fr-FR"
                )}
              />
            )}
          </div>

          {withdrawal.adminNote && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Note admin
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {withdrawal.adminNote}
              </p>
            </div>
          )}
        </div>

        {withdrawal.status === "PENDING" && (
          <div className="flex w-full flex-col gap-3 xl:w-64">
            <form
              action="/api/admin/withdrawals/status"
              method="POST"
            >
              <input
                type="hidden"
                name="withdrawalId"
                value={withdrawal.id}
              />

              <input
                type="hidden"
                name="status"
                value="APPROVED"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950 transition hover:bg-emerald-400"
              >
                ✓ Approuver et payer
              </button>
            </form>

            <form
              action="/api/admin/withdrawals/status"
              method="POST"
              className="space-y-2"
            >
              <input
                type="hidden"
                name="withdrawalId"
                value={withdrawal.id}
              />

              <input
                type="hidden"
                name="status"
                value="REJECTED"
              />

              <textarea
                name="adminNote"
                rows={3}
                placeholder="Motif du rejet..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-500"
              />

              <button
                type="submit"
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-black text-red-400 transition hover:bg-red-500/20"
              >
                ✕ Rejeter et rembourser
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}

// =========================================================
// CARTE RETRAIT TÂCHE
// =========================================================

function TaskWithdrawalCard({
  withdrawal,
}: {
  withdrawal: {
    id: string;
    amount: number;
    method: string;
    phone: string;
    status: string;
    adminNote: string | null;
    processedAt: Date | null;
    createdAt: Date;
    task: {
      id: string;
      title: string;
      description: string;
    };
    user: {
      id: string;
      name: string;
      phone: string;
      email: string;
    };
  };
}) {
  const fee = 500;
  const totalDeduction = withdrawal.amount + fee;

  const status =
    withdrawal.status === "PENDING" ||
    withdrawal.status === "APPROVED" ||
    withdrawal.status === "REJECTED"
      ? withdrawal.status
      : "PENDING";

  return (
    <article className="rounded-2xl border border-violet-500/20 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-6 xl:flex-row xl:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Retrait de tâche
              </p>

              <h2 className="mt-1 text-xl font-black">
                {withdrawal.user.name}
              </h2>
            </div>

            <StatusBadge status={status} />
          </div>

          {/* TÂCHE */}

          <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Tâche concernée
            </p>

            <p className="mt-1 text-lg font-black">
              {withdrawal.task.title}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {withdrawal.task.description}
            </p>
          </div>

          {/* INFORMATIONS */}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info
              label="Montant demandé"
              value={`${withdrawal.amount.toLocaleString(
                "fr-FR"
              )} FCFA`}
            />

            <Info
              label="Frais"
              value={`${fee.toLocaleString("fr-FR")} FCFA`}
            />

            <Info
              label="Total débité"
              value={`${totalDeduction.toLocaleString(
                "fr-FR"
              )} FCFA`}
            />

            <Info
              label="Méthode"
              value={formatMethod(withdrawal.method)}
            />

            <Info
              label="Numéro de paiement"
              value={withdrawal.phone}
            />

            <Info
              label="Téléphone utilisateur"
              value={withdrawal.user.phone}
            />

            <Info
              label="Email"
              value={withdrawal.user.email}
            />

            <Info
              label="Demande créée"
              value={withdrawal.createdAt.toLocaleString(
                "fr-FR"
              )}
            />

            {withdrawal.processedAt && (
              <Info
                label="Traitée le"
                value={withdrawal.processedAt.toLocaleString(
                  "fr-FR"
                )}
              />
            )}
          </div>

          {withdrawal.adminNote && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Note admin
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {withdrawal.adminNote}
              </p>
            </div>
          )}
        </div>

        {/* ACTIONS */}

        {status === "PENDING" && (
          <div className="flex w-full flex-col gap-3 xl:w-64">
            <form
              action="/api/admin/task-withdrawals/status"
              method="POST"
            >
              <input
                type="hidden"
                name="withdrawalId"
                value={withdrawal.id}
              />

              <input
                type="hidden"
                name="status"
                value="APPROVED"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950 transition hover:bg-emerald-400"
              >
                ✓ Approuver et payer
              </button>
            </form>

            <form
              action="/api/admin/task-withdrawals/status"
              method="POST"
              className="space-y-2"
            >
              <input
                type="hidden"
                name="withdrawalId"
                value={withdrawal.id}
              />

              <input
                type="hidden"
                name="status"
                value="REJECTED"
              />

              <textarea
                name="adminNote"
                rows={3}
                placeholder="Motif du rejet..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-500"
              />

              <button
                type="submit"
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-black text-red-400 transition hover:bg-red-500/20"
              >
                ✕ Rejeter et rembourser
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}

// =========================================================
// STAT
// =========================================================

function Stat({
  label,
  value,
  href,
  active,
}: {
  label: string;
  value: number;
  href: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-2xl border p-5 transition ${
        active
          ? "border-cyan-500 bg-cyan-500/10"
          : "border-slate-800 bg-slate-900/70 hover:border-slate-600"
      }`}
    >
      <p className="text-sm font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
    </a>
  );
}

// =========================================================
// FILTRE
// =========================================================

function Filter({
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
          : "border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </a>
  );
}

// =========================================================
// BADGE STATUT
// =========================================================

function StatusBadge({
  status,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED";
}) {
  const config = {
    PENDING: {
      label: "En attente",
      className:
        "border-orange-500/30 bg-orange-500/10 text-orange-400",
    },
    APPROVED: {
      label: "Approuvé",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    },
    REJECTED: {
      label: "Rejeté",
      className:
        "border-red-500/30 bg-red-500/10 text-red-400",
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

// =========================================================
// INFO
// =========================================================

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

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
      <p className="text-lg font-bold">
        {message}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        Les nouvelles demandes apparaîtront ici.
      </p>
    </div>
  );
}

// =========================================================
// MÉTHODES DE PAIEMENT
// =========================================================

function formatMethod(method: string) {
  const methods: Record<string, string> = {
    TMONEY: "TMoney",
    FLOOZ: "Flooz",
    MTN_MOBILE_MONEY: "MTN Mobile Money",
    WAVE: "Wave",
  };

  return methods[method] ?? method;
}
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const MIN_WITHDRAWAL = 1500;
const WITHDRAWAL_FEE = 500;

const ALLOWED_METHODS = [
  "TMONEY",
  "FLOOZ",
  "MTN_MOBILE_MONEY",
  "WAVE",
] as const;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nexora_user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Vous devez être connecté." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const taskId = String(body.taskId || "").trim();
    const amount = Number(body.amount);
    const method = String(body.method || "").trim();
    const phone = String(body.phone || "").trim();

    if (!taskId) {
      return NextResponse.json(
        { error: "Tâche invalide." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        { error: "Le montant doit être un nombre entier." },
        { status: 400 }
      );
    }

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        {
          error: `Le montant minimum de retrait est de ${MIN_WITHDRAWAL.toLocaleString(
            "fr-FR"
          )} FCFA.`,
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_METHODS.includes(
        method as (typeof ALLOWED_METHODS)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Méthode de paiement invalide." },
        { status: 400 }
      );
    }

    if (!phone || phone.length < 8) {
      return NextResponse.json(
        { error: "Veuillez saisir un numéro de paiement valide." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    if (user.activationStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "Votre compte n'est pas encore actif." },
        { status: 403 }
      );
    }

    const task = await prisma.dailyTask.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tâche introuvable." },
        { status: 404 }
      );
    }

    const totalToDeduct = amount + WITHDRAWAL_FEE;

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.dailyTaskBalance.findUnique({
        where: {
          userId_taskId: {
            userId,
            taskId,
          },
        },
      });

      if (!balance || balance.balance < totalToDeduct) {
        throw new Error("SOLDE_INSUFFISANT");
      }

      const updatedBalance = await tx.dailyTaskBalance.update({
        where: {
          userId_taskId: {
            userId,
            taskId,
          },
        },
        data: {
          balance: {
            decrement: totalToDeduct,
          },
        },
      });

      const withdrawal = await tx.dailyTaskWithdrawal.create({
        data: {
          userId,
          taskId,
          amount,
          method,
          phone,
          status: "PENDING",
        },
      });

      return {
        withdrawal,
        balance: updatedBalance,
      };
    });

    return NextResponse.json({
      success: true,
      message:
        "Votre demande de retrait a été enregistrée et sera traitée manuellement.",
      withdrawalId: result.withdrawal.id,
      taskId,
      taskTitle: task.title,
      amount,
      fee: WITHDRAWAL_FEE,
      totalDeducted: totalToDeduct,
      remainingBalance: result.balance.balance,
      status: "PENDING",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SOLDE_INSUFFISANT"
    ) {
      return NextResponse.json(
        {
          error:
            "Solde insuffisant. Le solde doit couvrir le montant du retrait et les frais de 500 FCFA.",
        },
        { status: 400 }
      );
    }

    console.error("Erreur retrait tâche:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de l'enregistrement du retrait.",
      },
      { status: 500 }
    );
  }
}
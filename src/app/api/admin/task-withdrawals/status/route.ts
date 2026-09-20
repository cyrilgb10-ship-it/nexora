import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const WITHDRAWAL_FEE = 500;

const ALLOWED_STATUSES = ["APPROVED", "REJECTED"] as const;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("nexora_user_id")?.value;

    if (!adminId) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
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
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    const formData = await request.formData();

    const withdrawalId = String(
      formData.get("withdrawalId") ?? ""
    ).trim();

    const status = String(
      formData.get("status") ?? ""
    ).trim();

    const adminNote = String(
      formData.get("adminNote") ?? ""
    ).trim();

    if (!withdrawalId) {
      return NextResponse.json(
        {
          success: false,
          message: "Demande de retrait introuvable.",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_STATUSES.includes(
        status as (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Statut invalide.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const withdrawal =
        await tx.dailyTaskWithdrawal.findUnique({
          where: {
            id: withdrawalId,
          },
          select: {
            id: true,
            userId: true,
            taskId: true,
            amount: true,
            status: true,
          },
        });

      if (!withdrawal) {
        throw new Error("TASK_WITHDRAWAL_NOT_FOUND");
      }

      if (withdrawal.status !== "PENDING") {
        throw new Error("TASK_WITHDRAWAL_ALREADY_PROCESSED");
      }

      const totalRefund =
        withdrawal.amount + WITHDRAWAL_FEE;

      // ==========================================
      // APPROBATION
      // ==========================================
      //
      // Le montant + les frais ont déjà été retirés
      // du DailyTaskBalance lors de la demande.
      //
      // Donc aucune nouvelle déduction ici.
      //
      if (status === "APPROVED") {
        await tx.dailyTaskWithdrawal.update({
          where: {
            id: withdrawal.id,
          },
          data: {
            status: "APPROVED",
            processedAt: new Date(),
            adminNote: adminNote || null,
          },
        });

        return "APPROVED";
      }

      // ==========================================
      // REJET + REMBOURSEMENT
      // ==========================================

      await tx.dailyTaskBalance.upsert({
        where: {
          userId_taskId: {
            userId: withdrawal.userId,
            taskId: withdrawal.taskId,
          },
        },
        create: {
          userId: withdrawal.userId,
          taskId: withdrawal.taskId,
          balance: totalRefund,
        },
        update: {
          balance: {
            increment: totalRefund,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: "WITHDRAWAL_REFUND",
          amount: totalRefund,
          description:
            `Remboursement du retrait de tâche rejeté : ` +
            `${withdrawal.amount.toLocaleString("fr-FR")} FCFA ` +
            `+ frais de ${WITHDRAWAL_FEE.toLocaleString("fr-FR")} FCFA`,
        },
      });

      await tx.dailyTaskWithdrawal.update({
        where: {
          id: withdrawal.id,
        },
        data: {
          status: "REJECTED",
          processedAt: new Date(),
          adminNote: adminNote || "Retrait de tâche rejeté.",
        },
      });

      return "REJECTED";
    });

    return NextResponse.redirect(
      new URL(
        `/admin/withdrawals?taskStatus=${result}`,
        request.url
      )
    );
  } catch (error) {
    console.error(
      "ADMIN_TASK_WITHDRAWAL_STATUS_ERROR:",
      error
    );

    if (error instanceof Error) {
      if (
        error.message ===
        "TASK_WITHDRAWAL_NOT_FOUND"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Demande de retrait de tâche introuvable.",
          },
          { status: 404 }
        );
      }

      if (
        error.message ===
        "TASK_WITHDRAWAL_ALREADY_PROCESSED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Cette demande de retrait de tâche a déjà été traitée.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur est survenue lors du traitement du retrait de tâche.",
      },
      { status: 500 }
    );
  }
}
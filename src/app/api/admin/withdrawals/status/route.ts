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
      const withdrawal = await tx.withdrawal.findUnique({
        where: {
          id: withdrawalId,
        },
        select: {
          id: true,
          userId: true,
          amount: true,
          status: true,
        },
      });

      if (!withdrawal) {
        throw new Error("WITHDRAWAL_NOT_FOUND");
      }

      if (withdrawal.status !== "PENDING") {
        throw new Error("WITHDRAWAL_ALREADY_PROCESSED");
      }

      const totalDeduction =
        withdrawal.amount + WITHDRAWAL_FEE;

      const user = await tx.user.findUnique({
        where: {
          id: withdrawal.userId,
        },
        select: {
          id: true,
          balance: true,
          lockedBalance: true,
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (user.lockedBalance < totalDeduction) {
        throw new Error("LOCKED_BALANCE_ERROR");
      }

      // ==========================================
      // APPROBATION DU RETRAIT
      // ==========================================
      if (status === "APPROVED") {
        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            lockedBalance: {
              decrement: totalDeduction,
            },
          },
        });

        await tx.withdrawal.update({
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
      // REJET DU RETRAIT + REMBOURSEMENT
      // ==========================================

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          balance: {
            increment: totalDeduction,
          },
          lockedBalance: {
            decrement: totalDeduction,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL_REFUND",
          amount: totalDeduction,
          description:
            `Remboursement du retrait rejeté de ` +
            `${withdrawal.amount.toLocaleString("fr-FR")} FCFA ` +
            `+ frais de ${WITHDRAWAL_FEE.toLocaleString("fr-FR")} FCFA`,
        },
      });

      await tx.withdrawal.update({
        where: {
          id: withdrawal.id,
        },
        data: {
          status: "REJECTED",
          processedAt: new Date(),
          adminNote: adminNote || "Retrait rejeté.",
        },
      });

      return "REJECTED";
    });

    return NextResponse.redirect(
      new URL(
        `/admin/withdrawals?status=${result}`,
        request.url
      )
    );
  } catch (error) {
    console.error(
      "ADMIN_WITHDRAWAL_STATUS_ERROR:",
      error
    );

    if (error instanceof Error) {
      if (error.message === "WITHDRAWAL_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Demande de retrait introuvable.",
          },
          { status: 404 }
        );
      }

      if (
        error.message ===
        "WITHDRAWAL_ALREADY_PROCESSED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Cette demande de retrait a déjà été traitée.",
          },
          { status: 400 }
        );
      }

      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Utilisateur introuvable.",
          },
          { status: 404 }
        );
      }

      if (
        error.message ===
        "LOCKED_BALANCE_ERROR"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Le solde verrouillé de l'utilisateur est incohérent.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur est survenue lors du traitement du retrait.",
      },
      { status: 500 }
    );
  }
}
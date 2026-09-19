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
        {
          success: false,
          message: "Vous devez être connecté.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const amount = Number(body.amount);
    const method = String(body.method ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        {
          success: false,
          message: "Le montant du retrait est invalide.",
        },
        { status: 400 }
      );
    }

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        {
          success: false,
          message: `Le montant minimum de retrait est de ${MIN_WITHDRAWAL.toLocaleString(
            "fr-FR"
          )} FCFA.`,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_METHODS.includes(
      method as (typeof ALLOWED_METHODS)[number]
    )) {
      return NextResponse.json(
        {
          success: false,
          message: "La méthode de retrait sélectionnée est invalide.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Veuillez renseigner le numéro de paiement.",
        },
        { status: 400 }
      );
    }

    if (phone.length < 8 || phone.length > 20) {
      return NextResponse.json(
        {
          success: false,
          message: "Le numéro de paiement est invalide.",
        },
        { status: 400 }
      );
    }

    const totalDeduction = amount + WITHDRAWAL_FEE;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          activationStatus: true,
          balance: true,
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (user.activationStatus !== "ACTIVE") {
        throw new Error("ACCOUNT_NOT_ACTIVE");
      }

      if (user.balance < totalDeduction) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          method: method as
            | "TMONEY"
            | "FLOOZ"
            | "MTN_MOBILE_MONEY"
            | "WAVE",
          phone,
          status: "PENDING",
        },
        select: {
          id: true,
          amount: true,
          method: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          balance: {
            decrement: totalDeduction,
          },
          lockedBalance: {
            increment: totalDeduction,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount: totalDeduction,
          description: `Demande de retrait de ${amount.toLocaleString(
            "fr-FR"
          )} FCFA + frais de retrait de ${WITHDRAWAL_FEE.toLocaleString(
            "fr-FR"
          )} FCFA`,
        },
      });

      return withdrawal;
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Votre demande de retrait a été envoyée. Elle sera traitée manuellement.",
        withdrawal: result,
        fee: WITHDRAWAL_FEE,
        totalDeduction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("WITHDRAWAL_ERROR:", error);

    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Utilisateur introuvable.",
          },
          { status: 404 }
        );
      }

      if (error.message === "ACCOUNT_NOT_ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            message: "Votre compte doit être activé avant de demander un retrait.",
          },
          { status: 403 }
        );
      }

      if (error.message === "INSUFFICIENT_BALANCE") {
        return NextResponse.json(
          {
            success: false,
            message: `Solde insuffisant. Le retrait demandé nécessite ${(
              MIN_WITHDRAWAL + WITHDRAWAL_FEE
            ).toLocaleString("fr-FR")} FCFA minimum, frais compris.`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur est survenue lors de la demande de retrait.",
      },
      { status: 500 }
    );
  }
}
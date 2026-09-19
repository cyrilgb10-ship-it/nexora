import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["ACTIVE", "REJECTED"] as const;
const REFERRAL_REWARD = 500;

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

    const userId = String(formData.get("userId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Utilisateur introuvable.",
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

    if (userId === adminId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Vous ne pouvez pas modifier votre propre compte administrateur.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          activationStatus: true,
          referredById: true,
        },
      });

      if (!user) {
        throw new Error("UTILISATEUR_INTROUVABLE");
      }

      const previousStatus = user.activationStatus;

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          activationStatus: status as "ACTIVE" | "REJECTED",
        },
      });

      /*
       * Le bonus est attribué uniquement lorsqu'un compte
       * qui n'était pas encore ACTIVE devient ACTIVE.
       */
      const becameActive =
        status === "ACTIVE" &&
        previousStatus !== "ACTIVE";

      if (!becameActive || !user.referredById) {
        return;
      }

      const referrer = await tx.user.findUnique({
        where: {
          id: user.referredById,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!referrer) {
        return;
      }

      await tx.user.update({
        where: {
          id: referrer.id,
        },
        data: {
          balance: {
            increment: REFERRAL_REWARD,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: referrer.id,
          type: "REFERRAL_REWARD",
          amount: REFERRAL_REWARD,
          description: `Bonus de parrainage pour ${user.name}`,
        },
      });
    });

    return NextResponse.redirect(
      new URL("/admin/users", request.url)
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UTILISATEUR_INTROUVABLE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Utilisateur introuvable.",
        },
        { status: 404 }
      );
    }

    console.error("ADMIN_USER_STATUS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur est survenue lors de la modification du compte.",
      },
      { status: 500 }
    );
  }
}

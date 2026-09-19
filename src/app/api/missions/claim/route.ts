import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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
    const missionId = String(body.missionId ?? "").trim();

    if (!missionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Mission invalide.",
        },
        { status: 400 }
      );
    }

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

      const mission = await tx.mission.findUnique({
        where: {
          id: missionId,
        },
        select: {
          id: true,
          title: true,
          target: true,
          reward: true,
          isActive: true,
        },
      });

      if (!mission || !mission.isActive) {
        throw new Error("MISSION_NOT_FOUND");
      }

      const existingCompletion = await tx.missionCompletion.findUnique({
        where: {
          userId_missionId: {
            userId: user.id,
            missionId: mission.id,
          },
        },
        select: {
          id: true,
          rewardCredited: true,
        },
      });

      if (existingCompletion?.rewardCredited) {
        throw new Error("ALREADY_REWARDED");
      }

      const activeReferrals = await tx.user.count({
        where: {
          referredById: user.id,
          activationStatus: "ACTIVE",
        },
      });

      if (activeReferrals < mission.target) {
        throw new Error("TARGET_NOT_REACHED");
      }

      let completion;

      if (existingCompletion) {
        completion = await tx.missionCompletion.update({
          where: {
            id: existingCompletion.id,
          },
          data: {
            rewardCredited: true,
          },
        });
      } else {
        completion = await tx.missionCompletion.create({
          data: {
            userId: user.id,
            missionId: mission.id,
            rewardCredited: true,
          },
        });
      }

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          balance: {
            increment: mission.reward,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "MISSION_REWARD",
          amount: mission.reward,
          description: `Récompense de mission : ${mission.title}`,
        },
      });

      return {
        missionTitle: mission.title,
        reward: mission.reward,
        balance: user.balance + mission.reward,
        completionId: completion.id,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: `Félicitations ! Vous avez reçu ${result.reward.toLocaleString(
          "fr-FR"
        )} FCFA.`,
        reward: result.reward,
        balance: result.balance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("MISSION_CLAIM_ERROR:", error);

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
            message: "Votre compte doit être activé.",
          },
          { status: 403 }
        );
      }

      if (error.message === "MISSION_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Cette mission n'est pas disponible.",
          },
          { status: 404 }
        );
      }

      if (error.message === "ALREADY_REWARDED") {
        return NextResponse.json(
          {
            success: false,
            message: "La récompense de cette mission a déjà été créditée.",
          },
          { status: 400 }
        );
      }

      if (error.message === "TARGET_NOT_REACHED") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Vous n'avez pas encore atteint l'objectif de cette mission.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur est survenue lors de la validation de la mission.",
      },
      { status: 500 }
    );
  }
}
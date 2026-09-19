import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        activationStatus: true,
        balance: true,
        referrals: {
          where: {
            activationStatus: "ACTIVE",
          },
          select: {
            id: true,
          },
        },
        missionCompletions: {
          select: {
            missionId: true,
            rewardCredited: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Utilisateur introuvable.",
        },
        { status: 404 }
      );
    }

    if (user.activationStatus !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Votre compte doit être activé.",
        },
        { status: 403 }
      );
    }

    const missions = await prisma.mission.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        target: true,
        reward: true,
      },
      orderBy: {
        target: "asc",
      },
    });

    const completions = new Map(
      user.missionCompletions.map((completion) => [
        completion.missionId,
        completion,
      ])
    );

    return NextResponse.json({
      success: true,
      balance: user.balance,
      activeReferrals: user.referrals.length,
      missions: missions.map((mission) => {
        const completion = completions.get(mission.id);

        return {
          id: mission.id,
          title: mission.title,
          description: mission.description,
          target: mission.target,
          reward: mission.reward,
          completed:
            user.referrals.length >= mission.target,
          rewardCredited:
            completion?.rewardCredited === true,
        };
      }),
    });
  } catch (error) {
    console.error("MISSIONS_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur est survenue lors du chargement des missions.",
      },
      { status: 500 }
    );
  }
}
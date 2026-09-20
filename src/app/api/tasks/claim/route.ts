import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const TASK_DURATION_SECONDS = 20;

function getTogoDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getTogoDayOfWeek() {
  const date = getTogoDate();
  const [year, month, day] = date.split("-").map(Number);

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return utcDate.getUTCDay();
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nexora_user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Vous devez être connecté." },
        { status: 401 }
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

    const today = getTogoDate();
    const dayOfWeek = getTogoDayOfWeek();

    const task = await prisma.dailyTask.findFirst({
      where: {
        dayOfWeek,
        isActive: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          error: "Aucune tâche n'est disponible aujourd'hui.",
        },
        { status: 404 }
      );
    }

    const existingCompletion =
      await prisma.dailyTaskCompletion.findUnique({
        where: {
          userId_taskId_completionDate: {
            userId,
            taskId: task.id,
            completionDate: today,
          },
        },
      });

    if (existingCompletion?.rewardCredited) {
      return NextResponse.json(
        {
          error: "Vous avez déjà récupéré la récompense de cette tâche aujourd'hui.",
        },
        { status: 400 }
      );
    }

    const attempt = await prisma.dailyTaskAttempt.findUnique({
      where: {
        userId_taskId_taskDate: {
          userId,
          taskId: task.id,
          taskDate: today,
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        {
          error: "Vous devez d'abord commencer la tâche.",
        },
        { status: 400 }
      );
    }

    const elapsedSeconds =
      (Date.now() - attempt.startedAt.getTime()) / 1000;

    if (elapsedSeconds < TASK_DURATION_SECONDS) {
      const remaining = Math.ceil(
        TASK_DURATION_SECONDS - elapsedSeconds
      );

      return NextResponse.json(
        {
          error: `Veuillez attendre encore ${remaining} seconde${
            remaining > 1 ? "s" : ""
          }.`,
          remaining,
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.dailyTaskBalance.upsert({
        where: {
          userId_taskId: {
            userId,
            taskId: task.id,
          },
        },
        create: {
          userId,
          taskId: task.id,
          balance: task.reward,
        },
        update: {
          balance: {
            increment: task.reward,
          },
        },
      });

      const completion = await tx.dailyTaskCompletion.create({
        data: {
          userId,
          taskId: task.id,
          completionDate: today,
          rewardCredited: true,
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "DAILY_TASK_REWARD",
          amount: task.reward,
          description: `Récompense de la tâche ${task.title}`,
        },
      });

      return {
        balance: balance.balance,
        completionId: completion.id,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Félicitations ! Vous avez gagné ${task.reward} FCFA.`,
      reward: task.reward,
      taskId: task.id,
      taskTitle: task.title,
      taskBalance: result.balance,
    });
  } catch (error) {
    console.error("Erreur validation tâche:", error);

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la validation de la tâche.",
      },
      { status: 500 }
    );
  }
}

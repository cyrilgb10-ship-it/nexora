import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function getTogoDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getTogoDayOfWeek() {
  const dateString = getTogoDate();
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCDay();
}

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

    const today = getTogoDate();
    const dayOfWeek = getTogoDayOfWeek();

    const task = await prisma.dailyTask.findFirst({
      where: {
        dayOfWeek,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        dayOfWeek: true,
        reward: true,
      },
    });

    if (!task) {
      return NextResponse.json({
        success: true,
        hasTask: false,
        balance: user.balance,
        date: today,
        dayOfWeek,
      });
    }

    const completion = await prisma.dailyTaskCompletion.findUnique({
      where: {
        userId_taskId_completionDate: {
          userId,
          taskId: task.id,
          completionDate: today,
        },
      },
      select: {
        id: true,
        rewardCredited: true,
        completedAt: true,
      },
    });

    const attempt = await prisma.dailyTaskAttempt.findUnique({
      where: {
        userId_taskId_taskDate: {
          userId,
          taskId: task.id,
          taskDate: today,
        },
      },
      select: {
        id: true,
        startedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      hasTask: true,
      balance: user.balance,
      date: today,
      dayOfWeek,
      task: {
        ...task,
        completed: Boolean(completion?.rewardCredited),
        started: Boolean(attempt),
        startedAt: attempt?.startedAt ?? null,
      },
    });
  } catch (error) {
    console.error("DAILY_TASK_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de charger la tâche du jour.",
      },
      { status: 500 }
    );
  }
}
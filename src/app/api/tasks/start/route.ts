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
    const taskId = String(body.taskId ?? "").trim();

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Tâche invalide.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        activationStatus: true,
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

    const task = await prisma.dailyTask.findUnique({
      where: {
        id: taskId,
      },
      select: {
        id: true,
        title: true,
        dayOfWeek: true,
        reward: true,
        isActive: true,
      },
    });

    if (!task || !task.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette tâche n'est pas disponible.",
        },
        { status: 404 }
      );
    }

    if (task.dayOfWeek !== dayOfWeek) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette tâche n'est pas disponible aujourd'hui.",
        },
        { status: 400 }
      );
    }

    const completion = await prisma.dailyTaskCompletion.findUnique({
      where: {
        userId_taskId_completionDate: {
          userId,
          taskId,
          completionDate: today,
        },
      },
    });

    if (completion?.rewardCredited) {
      return NextResponse.json(
        {
          success: false,
          message: "Vous avez déjà terminé cette tâche aujourd'hui.",
        },
        { status: 400 }
      );
    }

    const existingAttempt = await prisma.dailyTaskAttempt.findUnique({
      where: {
        userId_taskId_taskDate: {
          userId,
          taskId,
          taskDate: today,
        },
      },
      select: {
        startedAt: true,
      },
    });

    if (existingAttempt) {
      return NextResponse.json({
        success: true,
        alreadyStarted: true,
        startedAt: existingAttempt.startedAt,
        duration: 20,
      });
    }

    const attempt = await prisma.dailyTaskAttempt.create({
      data: {
        userId,
        taskId,
        taskDate: today,
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      alreadyStarted: false,
      startedAt: attempt.startedAt,
      duration: 20,
      task: {
        id: task.id,
        title: task.title,
        reward: task.reward,
      },
    });
  } catch (error) {
    console.error("DAILY_TASK_START_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de démarrer la tâche.",
      },
      { status: 500 }
    );
  }
}
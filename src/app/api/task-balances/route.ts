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
          error: "Vous devez être connecté.",
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
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Utilisateur introuvable.",
        },
        { status: 404 }
      );
    }

    if (user.activationStatus !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Votre compte n'est pas encore actif.",
        },
        { status: 403 }
      );
    }

    // Récupération des tâches actives
    const tasks = await prisma.dailyTask.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    // Récupération séparée des soldes de l'utilisateur
    const balances = await prisma.dailyTaskBalance.findMany({
      where: {
        userId,
      },
      select: {
        taskId: true,
        balance: true,
      },
    });

    const balanceMap = new Map(
      balances.map((item) => [item.taskId, item.balance])
    );

    const result = tasks.map((task) => ({
      taskId: task.id,
      title: task.title,
      description: task.description,
      balance: balanceMap.get(task.id) ?? 0,
    }));

    return NextResponse.json({
      success: true,
      tasks: result,
    });
  } catch (error) {
    console.error("=================================");
    console.error("ERREUR API /api/task-balances");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        error: "Erreur serveur lors du chargement des soldes.",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

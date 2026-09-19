import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const identifier = String(body.identifier ?? "")
      .trim()
      .toLowerCase();

    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Veuillez remplir tous les champs.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: identifier,
          },
          {
            phone: identifier,
          },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        password: true,
        referralCode: true,
        activationStatus: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiants incorrects.",
        },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiants incorrects.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Connexion réussie.",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          referralCode: user.referralCode,
          activationStatus: user.activationStatus,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set("nexora_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de la connexion.",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateReferralCode(name: string): string {
  const cleanName = name
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);

  const random = Math.floor(1000 + Math.random() * 9000);

  return `${cleanName || "NEXORA"}${random}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const referralCode = String(body.referralCode ?? "").trim();

    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Veuillez remplir tous les champs obligatoires.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom doit contenir au moins 2 caractères.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Le mot de passe doit contenir au moins 6 caractères.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { email }],
      },
      select: {
        phone: true,
        email: true,
      },
    });

    if (existingUser?.phone === phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Ce numéro de téléphone est déjà utilisé.",
        },
        { status: 409 }
      );
    }

    if (existingUser?.email === email) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette adresse e-mail est déjà utilisée.",
        },
        { status: 409 }
      );
    }

    let referredById: string | null = null;

    if (referralCode) {
      const sponsor = await prisma.user.findUnique({
        where: {
          referralCode,
        },
        select: {
          id: true,
        },
      });

      if (!sponsor) {
        return NextResponse.json(
          {
            success: false,
            message: "Le code de parrainage est invalide.",
          },
          { status: 400 }
        );
      }

      referredById = sponsor.id;
    }

    let generatedReferralCode = generateReferralCode(name);

    let referralCodeExists = await prisma.user.findUnique({
      where: {
        referralCode: generatedReferralCode,
      },
      select: {
        id: true,
      },
    });

    while (referralCodeExists) {
      generatedReferralCode = generateReferralCode(name);

      referralCodeExists = await prisma.user.findUnique({
        where: {
          referralCode: generatedReferralCode,
        },
        select: {
          id: true,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        referralCode: generatedReferralCode,
        referredById,
        activationStatus: "PENDING",
        balance: 0,
        lockedBalance: 0,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        referralCode: true,
        activationStatus: true,
      },
    });

    // Créer la réponse de succès
    const response = NextResponse.json(
      {
        success: true,
        message: "Inscription réussie.",
        user,
      },
      { status: 201 }
    );

    // Mémoriser immédiatement le nouvel utilisateur.
    // Cela permet à /activation de récupérer le bon compte.
    response.cookies.set("nexora_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("REGISTER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de l'inscription.",
      },
      { status: 500 }
    );
  }
}

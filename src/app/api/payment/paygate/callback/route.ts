import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const ACTIVATION_AMOUNT = 1000;

type PayGateCallback = {
  tx_reference?: string;
  identifier?: string;
  payment_reference?: string;
  amount?: number | string;
  datetime?: string;
  payment_method?: string;
  phone_number?: string;
};

type PayGateStatusResponse = {
  tx_reference?: string;
  identifier?: string;
  payment_reference?: string;
  status?: number | string;
  amount?: number | string;
  datetime?: string;
  payment_method?: string;
};

export async function GET() {
  // Si PayGate redirige le navigateur vers cette URL,
  // on renvoie simplement l'utilisateur vers la page d'activation.
  redirect("/activation");
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as PayGateCallback;

    const identifier = data.identifier;

    if (!identifier) {
      return Response.json(
        {
          success: false,
          message: "Identifier manquant",
        },
        { status: 400 }
      );
    }

    if (!identifier.startsWith("NEXORA-ACT-")) {
      return Response.json(
        {
          success: false,
          message: "Identifier invalide",
        },
        { status: 400 }
      );
    }

    // Recherche du paiement créé avant la redirection vers PayGate.
    const payment = await prisma.payment.findUnique({
      where: {
        identifier,
      },
      select: {
        id: true,
        userId: true,
        identifier: true,
        amount: true,
        status: true,
      },
    });

    if (!payment) {
      return Response.json(
        {
          success: false,
          message: "Paiement Nexora introuvable",
        },
        { status: 404 }
      );
    }

    // Si le paiement a déjà été traité, on ne recrédite rien.
    if (payment.status === "SUCCESS") {
      return Response.json({
        success: true,
        message: "Paiement déjà traité",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payment.userId,
      },
      select: {
        id: true,
        activationStatus: true,
      },
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Utilisateur introuvable",
        },
        { status: 404 }
      );
    }

    if (user.activationStatus === "ACTIVE") {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "SUCCESS",
          txReference: data.tx_reference,
          paymentReference: data.payment_reference,
          paymentMethod: data.payment_method,
          phoneNumber: data.phone_number,
          paidAt: new Date(),
        },
      });

      return Response.json({
        success: true,
        message: "Compte déjà activé",
      });
    }

    const callbackAmount =
      data.amount !== undefined
        ? Number(data.amount)
        : null;

    if (
      callbackAmount !== null &&
      callbackAmount !== ACTIVATION_AMOUNT
    ) {
      return Response.json(
        {
          success: false,
          message: "Montant du paiement incorrect",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.PAYGATE_API_KEY;

    if (!apiKey) {
      console.error("PAYGATE_API_KEY manquante");

      return Response.json(
        {
          success: false,
          message: "Configuration PayGate manquante",
        },
        { status: 500 }
      );
    }

    // Vérification serveur auprès de PayGate.
    const statusResponse = await fetch(
      "https://paygateglobal.com/api/v2/status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_token: apiKey,
          identifier,
        }),
        cache: "no-store",
      }
    );

    if (!statusResponse.ok) {
      console.error(
        "Erreur PayGate:",
        statusResponse.status,
        await statusResponse.text()
      );

      return Response.json(
        {
          success: false,
          message:
            "Impossible de vérifier le paiement auprès de PayGate",
        },
        { status: 502 }
      );
    }

    const statusData =
      (await statusResponse.json()) as PayGateStatusResponse;

    const paymentStatus = Number(statusData.status);

    // PayGate : 0 = paiement réussi.
    if (paymentStatus !== 0) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status:
            paymentStatus === 2
              ? "PENDING"
              : paymentStatus === 4
                ? "EXPIRED"
                : paymentStatus === 6
                  ? "CANCELLED"
                  : "PENDING",
        },
      });

      return Response.json({
        success: false,
        message: "Paiement non confirmé",
        status: paymentStatus,
      });
    }

    await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: {
          id: payment.id,
        },
        select: {
          id: true,
          userId: true,
          amount: true,
          status: true,
        },
      });

      if (!currentPayment) {
        throw new Error("Paiement introuvable");
      }

      // Protection contre les doubles traitements.
      if (currentPayment.status === "SUCCESS") {
        return;
      }

      const currentUser = await tx.user.findUnique({
        where: {
          id: currentPayment.userId,
        },
        select: {
          id: true,
          activationStatus: true,
        },
      });

      if (!currentUser) {
        throw new Error("Utilisateur introuvable");
      }

      if (currentUser.activationStatus !== "ACTIVE") {
        await tx.user.update({
          where: {
            id: currentPayment.userId,
          },
          data: {
            activationStatus: "ACTIVE",
          },
        });

        await tx.transaction.create({
          data: {
            userId: currentPayment.userId,
            type: "ACTIVATION",
            amount: ACTIVATION_AMOUNT,
            description: `Activation Nexora - PayGate ${
              data.tx_reference ?? identifier
            }`,
          },
        });
      }

      await tx.payment.update({
        where: {
          id: currentPayment.id,
        },
        data: {
          status: "SUCCESS",
          txReference: data.tx_reference,
          paymentReference: data.payment_reference,
          paymentMethod: data.payment_method,
          phoneNumber: data.phone_number,
          paidAt: new Date(),
        },
      });
    });

    return Response.json({
      success: true,
      message: "Compte Nexora activé avec succès",
    });
  } catch (error) {
    console.error("Erreur callback PayGate:", error);

    return Response.json(
      {
        success: false,
        message: "Erreur interne",
      },
      { status: 500 }
    );
  }
}
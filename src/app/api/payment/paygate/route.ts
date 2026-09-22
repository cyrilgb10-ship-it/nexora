import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const ACTIVATION_AMOUNT = 1000;

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("nexora_user_id")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      activationStatus: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.activationStatus === "ACTIVE") {
    redirect("/dashboard");
  }

  const apiKey = process.env.PAYGATE_API_KEY;

  if (!apiKey) {
    return new Response("PAYGATE_API_KEY manquante", {
      status: 500,
    });
  }

  const identifier = `NEXORA-ACT-${user.id}-${Date.now()}`;

  // On enregistre d'abord le paiement dans notre base.
  await prisma.payment.create({
    data: {
      userId: user.id,
      identifier,
      amount: ACTIVATION_AMOUNT,
      status: "PENDING",
      phoneNumber: user.phone,
    },
  });

  const paymentUrl = new URL(
    "https://paygateglobal.com/v1/page"
  );

  paymentUrl.searchParams.set("token", apiKey);
  paymentUrl.searchParams.set(
    "amount",
    String(ACTIVATION_AMOUNT)
  );
  paymentUrl.searchParams.set(
    "description",
    "Activation compte Nexora"
  );
  paymentUrl.searchParams.set("identifier", identifier);

  // Après le paiement, PayGate peut revenir ici.
  paymentUrl.searchParams.set(
    "url",
    "https://nexoraearning.netlify.app/api/payment/paygate/callback"
  );

  paymentUrl.searchParams.set("phone", user.phone);

  return Response.redirect(paymentUrl.toString());
}
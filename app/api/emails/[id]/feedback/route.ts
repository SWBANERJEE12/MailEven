import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordExplicitCorrection } from "@/lib/personalization";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const emailId = params.id;

  try {
    const body = await req.json();
    const { correctedPriority, correctedAction, reason } = body;

    if (!correctedPriority && !correctedAction) {
      return NextResponse.json(
        { error: "Either correctedPriority or correctedAction is required" },
        { status: 400 }
      );
    }

    // Verify email belongs to user
    const email = await prisma.email.findFirst({
      where: { id: emailId, userId },
    });

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const previousPriority = email.priority || "medium";
    const previousAction = email.actionType || "none";

    // Update the email's immediate attributes
    const updatedEmail = await prisma.email.update({
      where: { id: emailId },
      data: {
        priority: correctedPriority || email.priority,
        actionType: correctedAction || email.actionType,
        personalizationReason: reason || `Updated to ${correctedPriority || email.priority} priority based on your explicit feedback.`,
        personalizationConfidence: 1.0,
      },
    });

    // Feed back into user preference learning engine
    const updateResult = await recordExplicitCorrection(
      userId,
      emailId,
      email.category || "General",
      email.sender,
      previousPriority,
      previousAction,
      correctedPriority || previousPriority,
      correctedAction || previousAction,
      reason
    );

    return NextResponse.json({
      success: true,
      email: updatedEmail,
      feedback: updateResult,
      message: `Preferences updated for ${email.category || "General"}. AI will prioritize similar emails accordingly.`,
    });
  } catch (error: any) {
    console.error("Error saving email feedback:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

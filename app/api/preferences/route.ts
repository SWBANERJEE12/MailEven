import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRequestOrigin, invalidOriginResponse } from "@/lib/security";

// GET /api/preferences - Fetch user's learned preferences and interaction stats
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const [preferences, recentHistory] = await Promise.all([
      prisma.userPreference.findMany({
        where: { userId },
        orderBy: [{ confidence: "desc" }, { score: "desc" }],
      }),
      prisma.interactionHistory.findMany({
        where: { userId },
        take: 15,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          category: true,
          sender: true,
          aiPredictedPriority: true,
          aiPredictedAction: true,
          userFeedback: true,
          feedbackType: true,
          explanation: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      preferences,
      recentHistory,
      stats: {
        totalRules: preferences.length,
        highPriorityCategories: preferences
          .filter((p) => p.type === "category" && p.score >= 0.65)
          .map((p) => p.key),
        deprioritizedCategories: preferences
          .filter((p) => p.type === "category" && p.score <= 0.35)
          .map((p) => p.key),
        totalInteractions: preferences.reduce((acc, p) => acc + p.interactionCount, 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/preferences - Delete a specific learned preference or reset all
export async function DELETE(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const resetAll = searchParams.get("all") === "true";

    if (resetAll) {
      await prisma.userPreference.deleteMany({ where: { userId } });
      await prisma.interactionHistory.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true, message: "All learned AI preferences reset successfully." });
    }

    if (!id) {
      return NextResponse.json({ error: "Preference ID or all=true is required" }, { status: 400 });
    }

    // Verify ownership
    const pref = await prisma.userPreference.findFirst({
      where: { id, userId },
    });

    if (!pref) {
      return NextResponse.json({ error: "Preference not found" }, { status: 404 });
    }

    await prisma.userPreference.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Preference rule removed.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/preferences - Manually tweak or override a preference
export async function PUT(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return invalidOriginResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { id, score, preferredAction } = body;

    if (!id) {
      return NextResponse.json({ error: "Preference ID is required" }, { status: 400 });
    }

    const pref = await prisma.userPreference.findFirst({
      where: { id, userId },
    });

    if (!pref) {
      return NextResponse.json({ error: "Preference not found" }, { status: 404 });
    }

    const updated = await prisma.userPreference.update({
      where: { id },
      data: {
        score: typeof score === "number" ? Math.max(0, Math.min(1, score)) : pref.score,
        preferredAction: preferredAction !== undefined ? preferredAction : pref.preferredAction,
        confidence: 1.0, // Manual override gives 100% confidence
      },
    });

    return NextResponse.json({ success: true, preference: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stats?month=2026-05
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const sessions = await prisma.studySession.findMany({
    where: { date: { startsWith: month } },
    include: { subjects: { include: { subject: true } } },
  });

  const allSessions = await prisma.studySession.findMany({
    include: { subjects: true },
  });

  // 累計
  const totalDays = allSessions.length;
  const totalPages = allSessions.reduce(
    (sum, s) => sum + s.subjects.reduce((ps, r) => ps + r.pages, 0),
    0
  );
  const totalMinutes = allSessions.reduce((sum, s) => sum + s.totalMinutes, 0);

  // 今月
  const monthDays = sessions.length;
  const monthPages = sessions.reduce(
    (sum, s) => sum + s.subjects.reduce((ps, r) => ps + r.pages, 0),
    0
  );
  const monthMinutes = sessions.reduce((sum, s) => sum + s.totalMinutes, 0);

  // 科目別（今月）
  const subjectMap: Record<string, { name: string; workName: string | null; sessions: number; pages: number }> = {};
  for (const session of sessions) {
    for (const rec of session.subjects) {
      if (!subjectMap[rec.subjectId]) {
        subjectMap[rec.subjectId] = {
          name: rec.subject.name,
          workName: rec.subject.workName,
          sessions: 0,
          pages: 0,
        };
      }
      subjectMap[rec.subjectId].sessions += 1;
      subjectMap[rec.subjectId].pages += rec.pages;
    }
  }

  const subjectStats = Object.entries(subjectMap).map(([id, v]) => ({
    subjectId: id,
    ...v,
    rate: monthDays > 0 ? Math.round((v.sessions / monthDays) * 100) : 0,
  }));

  // バッジ
  const badges = computeBadges(totalDays, totalPages);

  return NextResponse.json({
    total: { days: totalDays, pages: totalPages, minutes: totalMinutes },
    month: { days: monthDays, pages: monthPages, minutes: monthMinutes },
    subjectStats,
    badges,
  });
}

function computeBadges(days: number, pages: number) {
  return [
    { id: "first", label: "はじめの一歩", emoji: "🌱", unlocked: days >= 1 },
    { id: "days10", label: "10日達成！", emoji: "📖", unlocked: days >= 10 },
    { id: "days30", label: "30日達成！", emoji: "🌸", unlocked: days >= 30 },
    { id: "days50", label: "50日達成！", emoji: "⭐", unlocked: days >= 50 },
    { id: "days100", label: "100日達成！", emoji: "🏆", unlocked: days >= 100 },
    { id: "pages50", label: "50P達成！", emoji: "✏️", unlocked: pages >= 50 },
    { id: "pages100", label: "100P達成！", emoji: "📚", unlocked: pages >= 100 },
    { id: "pages300", label: "300P達成！", emoji: "🎯", unlocked: pages >= 300 },
  ];
}

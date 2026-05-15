import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/records?month=2026-05  or  ?date=2026-05-15
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  const date = searchParams.get("date");   // YYYY-MM-DD

  if (date) {
    const session = await prisma.studySession.findUnique({
      where: { date },
      include: { subjects: { include: { subject: true } } },
    });
    return NextResponse.json(session);
  }

  if (month) {
    const sessions = await prisma.studySession.findMany({
      where: { date: { startsWith: month } },
      include: { subjects: { include: { subject: true } } },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(sessions);
  }

  return NextResponse.json({ error: "month or date required" }, { status: 400 });
}

// POST /api/records  — upsert a study session for a date
export async function POST(req: Request) {
  const { date, totalMinutes, note, subjects } = await req.json();
  // subjects: { subjectId: string; pages: number }[]

  const session = await prisma.studySession.upsert({
    where: { date },
    create: {
      date,
      totalMinutes: totalMinutes ?? 0,
      note: note ?? null,
      subjects: {
        create: subjects.map((s: { subjectId: string; pages: number }) => ({
          subjectId: s.subjectId,
          pages: s.pages,
        })),
      },
    },
    update: {
      totalMinutes: totalMinutes ?? 0,
      note: note ?? null,
      subjects: {
        deleteMany: {},
        create: subjects.map((s: { subjectId: string; pages: number }) => ({
          subjectId: s.subjectId,
          pages: s.pages,
        })),
      },
    },
    include: { subjects: { include: { subject: true } } },
  });

  return NextResponse.json(session, { status: 201 });
}

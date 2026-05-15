import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(subjects);
}

export async function POST(req: Request) {
  const { name, workName } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "科目名は必須です" }, { status: 400 });
  }
  const count = await prisma.subject.count();
  const subject = await prisma.subject.create({
    data: { name: name.trim(), workName: workName?.trim() || null, order: count },
  });
  return NextResponse.json(subject, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

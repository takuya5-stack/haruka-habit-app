import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLineMessage } from "@/lib/line";

// Vercel Cron から毎日 21:00 JST (= 12:00 UTC) に呼ばれる
export async function GET(req: Request) {
  // Vercel Cron の認証
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // JST 今日の日付を取得
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffset);
  const today = jstDate.toISOString().slice(0, 10); // YYYY-MM-DD

  const session = await prisma.studySession.findUnique({ where: { date: today } });

  if (session) {
    // すでに記録済みなら送らない
    return NextResponse.json({ skipped: true, reason: "already recorded" });
  }

  const message = `📚 Haruka習慣アプリ\n\n今日（${today}）の勉強記録がまだです！\n\nアプリを開いて「今日やったよ！」を記録しましょう✨\n${process.env.NEXT_PUBLIC_APP_URL ?? ""}`;

  await sendLineMessage(message);

  return NextResponse.json({ ok: true, sentTo: today });
}

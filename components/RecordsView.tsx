"use client";

import { useEffect, useState } from "react";

type SubjectRecord = {
  subjectId: string;
  pages: number;
  subject: { name: string };
};
type Session = {
  id: string;
  date: string;
  totalMinutes: number;
  note: string | null;
  subjects: SubjectRecord[];
};
type Badge = { id: string; label: string; emoji: string; unlocked: boolean };
type SubjectStat = { subjectId: string; name: string; sessions: number; pages: number; rate: number };
type Stats = {
  total: { days: number; pages: number; minutes: number };
  month: { days: number; pages: number; minutes: number };
  subjectStats: SubjectStat[];
  badges: Badge[];
};

export default function RecordsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const monthStr = getTodayJST().slice(0, 7);

  useEffect(() => {
    fetch(`/api/stats?month=${monthStr}`)
      .then((r) => r.json())
      .then(setStats);
    fetch("/api/records?all=1")
      .then((r) => r.json())
      .then((data) => setAllSessions(Array.isArray(data) ? data : []));
  }, [monthStr]);

  if (!stats) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">読み込み中…</div>;
  }

  return (
    <div className="pb-6 space-y-3">
      {/* Badges */}
      <div className="card">
        <p className="text-sm font-bold text-gray-600 mb-3">🏅 バッジ</p>
        <div className="grid grid-cols-4 gap-2">
          {stats.badges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${b.unlocked ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 opacity-40"}`}
            >
              <span className="text-2xl">{b.emoji}</span>
              <p className="text-xs text-gray-600 mt-1 leading-tight">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative stats */}
      <div className="card">
        <p className="text-sm font-bold text-gray-600 mb-3">📊 累計実績</p>
        <div className="grid grid-cols-3 gap-2">
          <StatCard value={stats.total.days} unit="日" label="通算記録日数" emoji="📅" />
          <StatCard value={stats.total.pages} unit="P" label="通算ページ数" emoji="📖" />
          <StatCard value={formatMinutes(stats.total.minutes)} unit="" label="通算時間" emoji="⏱" />
        </div>
      </div>

      {/* Monthly subject stats */}
      {stats.subjectStats.length > 0 && (
        <div className="card">
          <p className="text-sm font-bold text-gray-600 mb-3">📈 今月の科目別</p>
          <div className="space-y-3">
            {stats.subjectStats.map((s) => (
              <div key={s.subjectId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{s.name}</span>
                  <span className="text-gray-500">{s.sessions}回 {s.pages > 0 ? `${s.pages}P` : ""}</span>
                </div>
                <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all"
                    style={{ width: `${s.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All records list */}
      <div className="card">
        <p className="text-sm font-bold text-gray-600 mb-3">📋 全記録一覧（{allSessions.length}日）</p>
        {allSessions.length === 0 ? (
          <p className="text-sm text-gray-400">まだ記録がありません</p>
        ) : (
          <div className="space-y-2">
            {allSessions.map((s) => {
              const isSkipped = s.note === "やってない" && s.subjects.length === 0;
              return (
                <div key={s.id} className="p-3 bg-pink-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-700">{formatDate(s.date)}</p>
                    <span className="text-lg">{isSkipped ? "😴" : "⭐"}</span>
                  </div>
                  {isSkipped ? (
                    <p className="text-xs text-gray-400">お休み</p>
                  ) : (
                    <>
                      {s.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {s.subjects.map((r) => (
                            <span key={r.subjectId} className="bg-white text-pink-600 text-xs px-2 py-0.5 rounded-full border border-pink-200">
                              {r.subject.name}{r.pages > 0 ? `: ${r.pages}P` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      {s.note && <p className="text-xs text-gray-400">💬 {s.note}</p>}
                      {s.subjects.length === 0 && !s.note && (
                        <p className="text-xs text-gray-400">記録あり</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, unit, label, emoji }: { value: string | number; unit: string; label: string; emoji: string }) {
  return (
    <div className="bg-pink-50 rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-pink-500">
        {value}{unit && <span className="text-sm">{unit}</span>}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{emoji} {label}</p>
    </div>
  );
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const date = new Date(dateStr + "T00:00:00+09:00");
  return `${y}年${parseInt(m)}月${parseInt(d)}日（${days[date.getDay()]}）`;
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}分`;
}

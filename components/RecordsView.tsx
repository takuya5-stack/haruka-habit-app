"use client";

import { useEffect, useState } from "react";

type Badge = { id: string; label: string; emoji: string; unlocked: boolean };
type SubjectStat = {
  subjectId: string;
  name: string;
  sessions: number;
  pages: number;
  rate: number;
};
type Stats = {
  total: { days: number; pages: number; minutes: number };
  month: { days: number; pages: number; minutes: number };
  subjectStats: SubjectStat[];
  badges: Badge[];
};

export default function RecordsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const monthStr = getTodayJST().slice(0, 7);

  useEffect(() => {
    fetch(`/api/stats?month=${monthStr}`)
      .then((r) => r.json())
      .then(setStats);
  }, [monthStr]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        読み込み中…
      </div>
    );
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
              className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${
                b.unlocked ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 opacity-40"
              }`}
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
        <div className="grid grid-cols-2 gap-2 mb-2">
          <BigStat
            value={stats.total.days}
            unit="日"
            label="通算学習日数"
            emoji="📅"
          />
          <BigStat
            value={stats.total.pages}
            unit="P"
            label="通算ページ数"
            emoji="📖"
          />
        </div>
        <div className="bg-pink-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-pink-500">
            {formatMinutes(stats.total.minutes)}
          </p>
          <p className="text-xs text-gray-500 mt-1">⏱ 通算学習時間</p>
        </div>
      </div>

      {/* Monthly subject stats */}
      <div className="card">
        <p className="text-sm font-bold text-gray-600 mb-3">📈 今月の科目別</p>
        {stats.subjectStats.length === 0 ? (
          <p className="text-sm text-gray-400">まだ記録がありません</p>
        ) : (
          <div className="space-y-3">
            {stats.subjectStats.map((s) => (
              <div key={s.subjectId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{s.name}</span>
                  <span className="text-gray-500">
                    {s.sessions}回 {s.pages}P
                  </span>
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
        )}
      </div>
    </div>
  );
}

function BigStat({
  value,
  unit,
  label,
  emoji,
}: {
  value: number;
  unit: string;
  label: string;
  emoji: string;
}) {
  return (
    <div className="bg-pink-50 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-pink-500">
        {value}
        <span className="text-base">{unit}</span>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {emoji} {label}
      </p>
    </div>
  );
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return "0分";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}時間${m > 0 ? m + "分" : ""}` : `${m}分`;
}

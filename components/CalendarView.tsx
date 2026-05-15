"use client";

import { useEffect, useState } from "react";

type SubjectRecord = {
  subjectId: string;
  pages: number;
  subject: { name: string; workName: string | null };
};

type Session = {
  date: string;
  totalMinutes: number;
  subjects: SubjectRecord[];
};

type MonthStats = {
  subjectId: string;
  name: string;
  sessions: number;
  pages: number;
}[];

export default function CalendarView() {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [stats, setStats] = useState<MonthStats>([]);

  const monthStr = `${current.year}-${String(current.month).padStart(2, "0")}`;

  useEffect(() => {
    fetch(`/api/records?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []));

    fetch(`/api/stats?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => setStats(data.subjectStats ?? []));
  }, [monthStr]);

  const studiedDates = new Set(sessions.map((s) => s.date));
  const today = getTodayJST();

  const firstDay = new Date(current.year, current.month - 1, 1).getDay();
  const daysInMonth = new Date(current.year, current.month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    setCurrent((c) =>
      c.month === 1 ? { year: c.year - 1, month: 12 } : { ...c, month: c.month - 1 }
    );
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setCurrent((c) =>
      c.month === 12 ? { year: c.year + 1, month: 1 } : { ...c, month: c.month + 1 }
    );
    setSelectedDate(null);
  };

  const selectedSession = selectedDate
    ? sessions.find((s) => s.date === selectedDate)
    : null;

  return (
    <div className="pb-6">
      {/* Month nav */}
      <div className="card mb-3 flex items-center justify-between">
        <button onClick={prevMonth} className="text-2xl text-pink-400 px-2">‹</button>
        <span className="text-lg font-bold text-gray-700">
          {current.year}年{current.month}月
        </span>
        <button onClick={nextMonth} className="text-2xl text-pink-400 px-2">›</button>
      </div>

      {/* Calendar grid */}
      <div className="card mb-3">
        <div className="grid grid-cols-7 mb-1">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-semibold py-1 ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
            const isStudied = studiedDates.has(dateStr);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayOfWeek = idx % 7;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium
                  transition-all
                  ${isSelected ? "bg-pink-400 text-white" : isToday ? "border-2 border-pink-400 text-pink-600" : ""}
                  ${!isSelected && !isToday && dayOfWeek === 0 ? "text-red-400" : ""}
                  ${!isSelected && !isToday && dayOfWeek === 6 ? "text-blue-400" : ""}
                  ${!isSelected && !isToday ? "text-gray-700 hover:bg-pink-50" : ""}
                `}
              >
                {day}
                {isStudied && (
                  <span className="text-xs leading-none">⭐</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div className="card mb-3">
          <p className="text-sm font-semibold text-pink-500 mb-2">
            {formatDate(selectedDate)} の記録
          </p>
          {selectedSession ? (
            <>
              {selectedSession.totalMinutes > 0 && (
                <p className="text-sm text-gray-500 mb-2">
                  ⏱ {formatMinutes(selectedSession.totalMinutes)}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedSession.subjects.map((r) => (
                  <span
                    key={r.subjectId}
                    className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full"
                  >
                    {r.subject.name}: {r.pages}P
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">記録なし</p>
          )}
        </div>
      )}

      {/* Monthly subject stats */}
      <div className="card">
        <p className="text-sm font-bold text-gray-600 mb-3">📊 今月の記録</p>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-400">まだ記録がありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.map((s) => (
              <span
                key={s.subjectId}
                className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full"
              >
                {s.name}: {s.sessions}回 {s.pages}P
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const date = new Date(dateStr + "T00:00:00+09:00");
  return `${parseInt(m)}月${parseInt(d)}日（${days[date.getDay()]}）`;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}時間${m > 0 ? m + "分" : ""}` : `${m}分`;
}

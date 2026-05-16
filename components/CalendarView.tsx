"use client";

import { useEffect, useState, useCallback } from "react";

type Subject = { id: string; name: string; workName: string | null };
type SubjectRecord = {
  subjectId: string;
  pages: number;
  subject: { name: string; workName: string | null };
};
type Session = {
  date: string;
  totalMinutes: number;
  note: string | null;
  subjects: SubjectRecord[];
};

export default function CalendarView() {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState<{ subjectId: string; pages: number }[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const monthStr = `${current.year}-${String(current.month).padStart(2, "0")}`;
  const today = getTodayJST();

  const loadSessions = useCallback(() => {
    fetch(`/api/records?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []));
  }, [monthStr]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then(setSubjects);
  }, []);

  const studiedDates = new Set(sessions.map((s) => s.date));

  const firstDay = new Date(current.year, current.month - 1, 1).getDay();
  const daysInMonth = new Date(current.year, current.month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    setCurrent((c) => c.month === 1 ? { year: c.year - 1, month: 12 } : { ...c, month: c.month - 1 });
    setSelectedDate(null);
    setShowForm(false);
  };
  const nextMonth = () => {
    setCurrent((c) => c.month === 12 ? { year: c.year + 1, month: 1 } : { ...c, month: c.month + 1 });
    setSelectedDate(null);
    setShowForm(false);
  };

  const handleDateClick = (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
      setShowForm(false);
      return;
    }
    setSelectedDate(dateStr);
    setShowForm(false);
    const existing = sessions.find((s) => s.date === dateStr);
    if (existing) {
      setEntries(existing.subjects.map((s) => ({ subjectId: s.subjectId, pages: s.pages })));
      setNote(existing.note ?? "");
    } else {
      setEntries(subjects.map((s) => ({ subjectId: s.id, pages: 0 })));
      setNote("");
    }
  };

  const openForm = () => {
    if (!selectedDate) return;
    const existing = sessions.find((s) => s.date === selectedDate);
    if (existing) {
      setEntries(existing.subjects.map((s) => ({ subjectId: s.subjectId, pages: s.pages })));
      setNote(existing.note && existing.note !== "やってない" ? existing.note : "");
    } else {
      setEntries(subjects.map((s) => ({ subjectId: s.id, pages: 0 })));
      setNote("");
    }
    setShowForm(true);
  };

  const toggleSubject = (id: string) => {
    setEntries((prev) =>
      prev.some((e) => e.subjectId === id)
        ? prev.filter((e) => e.subjectId !== id)
        : [...prev, { subjectId: id, pages: 0 }]
    );
  };

  const setPages = (id: string, pages: number) => {
    setEntries((prev) => prev.map((e) => (e.subjectId === id ? { ...e, pages } : e)));
  };

  const save = async (skipped: boolean) => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          totalMinutes: 0,
          note: skipped ? "やってない" : (note.trim() || null),
          subjects: skipped ? [] : entries,
        }),
      });
      setShowForm(false);
      loadSessions();
    } finally {
      setSaving(false);
    }
  };

  const selectedSession = selectedDate ? sessions.find((s) => s.date === selectedDate) : null;
  const isSkipped = selectedSession?.note === "やってない" && selectedSession.subjects.length === 0;

  return (
    <div className="pb-6">
      {/* Month nav */}
      <div className="card mb-3 flex items-center justify-between">
        <button onClick={prevMonth} className="text-2xl text-pink-400 px-2">‹</button>
        <span className="text-lg font-bold text-gray-700">{current.year}年{current.month}月</span>
        <button onClick={nextMonth} className="text-2xl text-pink-400 px-2">›</button>
      </div>

      {/* Calendar grid */}
      <div className="card mb-3">
        <div className="grid grid-cols-7 mb-1">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"}`}>
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
                onClick={() => handleDateClick(dateStr)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all
                  ${isSelected ? "bg-pink-400 text-white" : isToday ? "border-2 border-pink-400 text-pink-600" : ""}
                  ${!isSelected && !isToday && dayOfWeek === 0 ? "text-red-400" : ""}
                  ${!isSelected && !isToday && dayOfWeek === 6 ? "text-blue-400" : ""}
                  ${!isSelected && !isToday ? "text-gray-700 hover:bg-pink-50" : ""}
                `}
              >
                {day}
                {isStudied && <span className="text-xs leading-none">⭐</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date panel */}
      {selectedDate && !showForm && (
        <div className="card mb-3">
          <p className="text-sm font-semibold text-pink-500 mb-3">{formatDate(selectedDate)}</p>

          {selectedSession ? (
            <>
              {isSkipped ? (
                <p className="text-sm text-gray-400 mb-3">😴 この日はお休み</p>
              ) : (
                <div className="mb-3">
                  {selectedSession.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedSession.subjects.map((r) => (
                        <span key={r.subjectId} className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full">
                          {r.subject.name}{r.pages > 0 ? `: ${r.pages}P` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedSession.note && selectedSession.note !== "やってない" && (
                    <p className="text-xs text-gray-500">💬 {selectedSession.note}</p>
                  )}
                </div>
              )}
              <button
                onClick={openForm}
                className="w-full py-2 rounded-full border border-pink-300 text-pink-500 text-sm font-medium"
              >
                ✏️ 編集する
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={openForm}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm font-bold"
              >
                ✏️ やった！
              </button>
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full border-2 border-gray-200 text-gray-500 text-sm font-medium disabled:opacity-50"
              >
                😴 やってない
              </button>
            </div>
          )}
        </div>
      )}

      {/* Entry form */}
      {selectedDate && showForm && (
        <div className="card mb-3">
          <p className="text-sm font-bold text-pink-500 mb-3">✏️ {formatDate(selectedDate)}</p>

          {subjects.length === 0 ? (
            <p className="text-sm text-gray-400 mb-3">「ワーク」タブでワークを登録してください</p>
          ) : (
            <div className="space-y-3 mb-4">
              {subjects.map((s) => {
                const entry = entries.find((e) => e.subjectId === s.id);
                const checked = !!entry;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSubject(s.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-pink-400 border-pink-400 text-white" : "border-gray-300"}`}
                    >
                      {checked && "✓"}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{s.name}</p>
                      {s.workName && <p className="text-xs text-gray-400">{s.workName}</p>}
                    </div>
                    {checked && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={entry?.pages ?? 0}
                          onChange={(e) => setPages(s.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center border border-pink-200 rounded-lg py-1 text-sm"
                        />
                        <span className="text-xs text-gray-500">P</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">💬 ひとこと（任意）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="今日の勉強どうだった？"
              rows={2}
              className="w-full border border-pink-100 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-pink-300"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-full border border-gray-200 text-sm text-gray-500"
            >
              キャンセル
            </button>
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="flex-1 py-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm font-bold disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存する"}
            </button>
          </div>
        </div>
      )}

      {/* Monthly count */}
      <div className="card">
        <p className="text-sm font-bold text-gray-600">
          📊 {current.month}月の記録: <span className="text-pink-500">{studiedDates.size}日</span>
        </p>
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

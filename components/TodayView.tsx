"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; name: string; workName: string | null };
type SubjectEntry = { subjectId: string; pages: number };
type Session = {
  date: string;
  totalMinutes: number;
  note: string | null;
  subjects: { subjectId: string; pages: number; subject: Subject }[];
};

type MonthSummary = { days: number; pages: number; minutes: number };

export default function TodayView() {
  const today = getTodayJST();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthSummary>({ days: 0, pages: 0, minutes: 0 });
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState<SubjectEntry[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const monthStr = today.slice(0, 7);

  const loadData = async () => {
    const [subjectsRes, sessionRes, statsRes] = await Promise.all([
      fetch("/api/subjects").then((r) => r.json()),
      fetch(`/api/records?date=${today}`).then((r) => r.json()),
      fetch(`/api/stats?month=${monthStr}`).then((r) => r.json()),
    ]);
    setSubjects(subjectsRes);
    setSession(sessionRes);
    setMonthSummary(statsRes.month ?? { days: 0, pages: 0, minutes: 0 });
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openForm = () => {
    if (session) {
      // 編集モード：既存データで初期化
      setEntries(session.subjects.map((s) => ({ subjectId: s.subjectId, pages: s.pages })));
      setTotalMinutes(session.totalMinutes);
      setNote(session.note ?? "");
    } else {
      // 新規
      setEntries(subjects.map((s) => ({ subjectId: s.id, pages: 0 })));
      setTotalMinutes(0);
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
    setEntries((prev) =>
      prev.map((e) => (e.subjectId === id ? { ...e, pages } : e))
    );
  };

  const save = async () => {
    const active = entries.filter((e) => e.pages > 0 || subjects.find((s) => s.id === e.subjectId));
    if (active.length === 0 && totalMinutes === 0 && !note) return;
    setSaving(true);
    try {
      await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, totalMinutes, note, subjects: entries.filter((e) => entries.some((x) => x.subjectId === e.subjectId)) }),
      });
      setShowForm(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const dateObj = new Date(today + "T00:00:00+09:00");
  const dateLabel = `${parseInt(today.slice(5, 7))}月${parseInt(today.slice(8, 10))}日（${days[dateObj.getDay()]}）`;

  return (
    <div className="pb-6">
      {/* Monthly summary */}
      <div className="card mb-3">
        <p className="text-sm font-bold text-gray-600 mb-3">📈 今月の積み上げ</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <SummaryCard value={monthSummary.days} label="日 勉強した" />
          <SummaryCard value={monthSummary.pages} label="ページ 進んだ" />
          <SummaryCard
            value={monthSummary.minutes > 0 ? formatMinutes(monthSummary.minutes) : "—"}
            label="勉強した時間"
          />
        </div>
      </div>

      {/* Today date */}
      <p className="text-center text-gray-500 text-sm mb-3">{dateLabel}</p>

      {/* Main action button */}
      {!showForm && (
        <button onClick={openForm} className="btn-primary mb-4">
          ✏️ {session ? "今日の記録を編集" : "今日やったよ！"}
        </button>
      )}

      {/* Study form */}
      {showForm && (
        <div className="card mb-3">
          <p className="text-sm font-bold text-pink-500 mb-3">✏️ 今日の勉強を記録</p>

          {/* Subject entries */}
          {subjects.length === 0 ? (
            <p className="text-sm text-gray-400 mb-3">「ワーク」タブで科目を追加してください</p>
          ) : (
            <div className="space-y-3 mb-4">
              {subjects.map((s) => {
                const entry = entries.find((e) => e.subjectId === s.id);
                const checked = !!entry;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSubject(s.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? "bg-pink-400 border-pink-400 text-white" : "border-gray-300"
                      }`}
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

          {/* Study time */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">⏱ 勉強時間</span>
            <input
              type="number"
              min={0}
              max={999}
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(parseInt(e.target.value) || 0)}
              className="w-20 text-center border border-pink-200 rounded-lg py-1 text-sm"
            />
            <span className="text-xs text-gray-500">分</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-full border border-gray-200 text-sm text-gray-500"
            >
              キャンセル
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm font-bold"
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}

      {/* Note section */}
      {!showForm && (
        <div className="card mb-3">
          <p className="text-sm font-bold text-gray-600 mb-2">💬 今日のひとこと</p>
          <NoteEditor
            date={today}
            initialNote={session?.note ?? ""}
            onSaved={loadData}
          />
        </div>
      )}

      {/* Today's record summary */}
      {session && !showForm && (
        <div className="card">
          <p className="text-sm font-bold text-gray-600 mb-2">📋 今日の記録</p>
          {session.totalMinutes > 0 && (
            <p className="text-xs text-gray-500 mb-2">⏱ {formatMinutes(session.totalMinutes)}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {session.subjects.map((r) => (
              <span
                key={r.subjectId}
                className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full"
              >
                {r.subject.name}: {r.pages}P
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-pink-50 rounded-xl p-3 text-center">
      <p className="text-xl font-bold text-pink-500">
        {value === 0 || value === "—" ? "—" : value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function NoteEditor({
  date,
  initialNote,
  onSaved,
}: {
  date: string;
  initialNote: string;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, totalMinutes: 0, note, subjects: [] }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="今日の勉強どうだった？"
        rows={3}
        className="w-full border border-pink-100 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-pink-300"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-1.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm font-bold"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </>
  );
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}時間${m > 0 ? m + "分" : ""}` : `${m}分`;
}

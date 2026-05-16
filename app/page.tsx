"use client";

import { useState } from "react";
import CalendarView from "@/components/CalendarView";
import WorkView from "@/components/WorkView";
import RecordsView from "@/components/RecordsView";

type Tab = "calendar" | "work" | "records";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "calendar", label: "カレンダー", icon: "📅" },
  { id: "work", label: "ワーク", icon: "📚" },
  { id: "records", label: "きろく", icon: "📊" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("calendar");

  return (
    <div className="min-h-screen bg-haruka-bg">
      <header
        className="sticky top-0 z-40 text-white text-center py-4 font-bold text-xl"
        style={{ background: "linear-gradient(135deg, #f472b6, #a855f7)" }}
      >
        Haruka習慣アプリ
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {tab === "calendar" && <CalendarView />}
        {tab === "work" && <WorkView />}
        {tab === "records" && <RecordsView />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

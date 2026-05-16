"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; name: string; workName: string | null };

export default function WorkView() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () =>
    fetch("/api/subjects")
      .then((r) => r.json())
      .then(setSubjects);

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), workName: null }),
      });
      setName("");
      await load();
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("このワークを削除しますか？")) return;
    await fetch("/api/subjects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  return (
    <div className="pb-6">
      {/* Registered works */}
      <div className="card mb-3">
        <p className="text-sm font-bold text-gray-600 mb-3">📚 登録済みワーク</p>
        {subjects.length === 0 ? (
          <p className="text-sm text-gray-400">ワークがまだ登録されていません</p>
        ) : (
          <div className="space-y-2">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 bg-pink-50 rounded-xl"
              >
                <p className="text-sm font-medium text-gray-700">{s.name}</p>
                <button
                  onClick={() => remove(s.id)}
                  className="text-gray-400 hover:text-red-400 text-xl transition-colors"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add work form */}
      <div className="card">
        <p className="text-sm font-bold text-pink-500 mb-3">＋ ワークを追加</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ワーク名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="例：数学ワーク、英単語帳"
              className="w-full border border-pink-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-300"
            />
          </div>
          <button
            onClick={add}
            disabled={adding || !name.trim()}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm font-bold disabled:opacity-50"
          >
            {adding ? "追加中…" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}

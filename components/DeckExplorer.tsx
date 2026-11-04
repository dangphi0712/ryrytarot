"use client";

import { useEffect, useState } from "react";
import { Alert, CircularProgress, MenuItem, TextField } from "@mui/material";
import styles from "./DeckExplorer.module.css";

type Deck = { id: string; name: string; summary: string | null; description: string | null };

export default function DeckExplorer() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/decks")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Lỗi tải bộ bài");
        setDecks(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const deck = decks.find((d) => d.id === selectedId);

  return (
    <div className="tarot-card p-4">
      <div className="row g-4">
        <div className="col-12 col-md-5 d-flex flex-column gap-4">
          <TextField
            select
            fullWidth
            label="Chọn bộ bài"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loading || decks.length === 0}
          >
            {decks.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
          <div className="d-flex justify-content-center">
            <div className={styles.deckStack} aria-hidden="true">
              <div className={styles.miniCard}>✦</div>
              <div className={styles.miniCard}>☾</div>
              <div className={styles.miniCard}>✧</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-7">
          {loading && (
            <div className="d-flex justify-content-center py-4">
              <CircularProgress />
            </div>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {!loading && !error && decks.length === 0 && (
            <p className="text-secondary">Chưa có bộ bài nào. Admin có thể thêm trong trang quản trị.</p>
          )}
          {/* key theo id để animation chạy lại mỗi khi đổi bộ bài */}
          {deck && (
            <div key={deck.id} className={styles.panel}>
              <h3 className={styles.deckName}>{deck.name}</h3>
              {deck.summary && <p className={styles.summary}>{deck.summary}</p>}
              {deck.description && <p className={styles.description}>{deck.description}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

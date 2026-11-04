"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Chip, CircularProgress, Collapse, FormControlLabel, Switch, TextField } from "@mui/material";

type Deck = {
  id: string;
  name: string;
  summary: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

type FormState = Omit<Deck, "id">;

const EMPTY: FormState = { name: "", summary: "", description: "", is_active: true, sort_order: 0 };

export default function DeckManager({ token }: { token: string }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  async function load() {
    const res = await fetch("/api/admin/decks", { headers });
    const json = await res.json();
    if (res.ok) setDecks(json);
    else setMessage({ type: "error", text: json.error });
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(EMPTY);
    setMessage(null);
    setShowForm(true);
  }

  function startEdit(d: Deck) {
    setEditingId(d.id);
    setForm({
      name: d.name,
      summary: d.summary ?? "",
      description: d.description ?? "",
      is_active: d.is_active,
      sort_order: d.sort_order,
    });
    setMessage(null);
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    try {
      await submitDeck();
    } finally {
      setSaving(false);
    }
  }

  async function submitDeck() {
    setMessage(null);
    const res = await fetch("/api/admin/decks", {
      method: editingId ? "PATCH" : "POST",
      headers,
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });
    const json = await res.json();
    if (!res.ok) return setMessage({ type: "error", text: json.error });
    setMessage({ type: "success", text: editingId ? "Đã cập nhật bộ bài." : "Đã thêm bộ bài mới." });
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Xóa bộ bài này?")) return;
    setMessage(null);
    const res = await fetch(`/api/admin/decks?id=${id}`, { method: "DELETE", headers });
    const json = await res.json();
    if (!res.ok) return setMessage({ type: "error", text: json.error });
    load();
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="h6 mb-0">Danh sách bộ bài ({decks.length})</h2>
        <Button variant="contained" onClick={startNew} disabled={showForm && editingId === null}>
          + Thêm bộ bài
        </Button>
      </div>

      {loading && (
        <div className="d-flex justify-content-center py-4">
          <CircularProgress />
        </div>
      )}
      {message && <Alert severity={message.type}>{message.text}</Alert>}

      <Collapse in={showForm} unmountOnExit>
        <section className="tarot-card p-3 d-flex flex-column gap-3">
          <h3 className="h6 mb-0">{editingId ? "Sửa bộ bài" : "Bộ bài mới"}</h3>
          <TextField
            label="Tên bộ bài"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Mô tả ngắn (hiện ngay dưới tên)"
            value={form.summary ?? ""}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 300 } }}
            fullWidth
          />
          <TextField
            label="Ý nghĩa / mô tả chi tiết"
            multiline
            minRows={6}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            helperText="Xuống dòng để tách đoạn. Tối đa 5000 ký tự."
            fullWidth
          />
          <div className="row g-3 align-items-center">
            <div className="col-12 col-sm-6">
              <TextField
                type="number"
                label="Thứ tự hiển thị"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                helperText="Số nhỏ hiện trước"
                fullWidth
              />
            </div>
            <div className="col-12 col-sm-6">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                }
                label="Hiện trên trang khách"
              />
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-end">
            <Button variant="outlined" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={saving || form.name.trim().length < 2}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </section>
      </Collapse>

      {decks.map((d) => (
        <section key={d.id} className="tarot-card p-3">
          <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <div className="fw-semibold">
                {d.name}{" "}
                <Chip
                  size="small"
                  label={d.is_active ? "Đang hiện" : "Đang ẩn"}
                  color={d.is_active ? "success" : "default"}
                  variant="outlined"
                />
              </div>
              {d.summary && <div className="small text-secondary">{d.summary}</div>}
            </div>
            <div className="d-flex gap-2">
              <Button size="small" variant="outlined" onClick={() => startEdit(d)}>Sửa</Button>
              <Button size="small" color="error" variant="outlined" onClick={() => remove(d.id)}>Xóa</Button>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

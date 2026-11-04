"use client";

import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Tab, Tabs, TextField } from "@mui/material";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import SlotManager from "@/components/admin/SlotManager";
import BookingManager from "@/components/admin/BookingManager";
import DeckManager from "@/components/admin/DeckManager";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <CircularProgress />
      </div>
    );
  }
  if (!token) return <Login />;
  return <Dashboard token={token} />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Email hoặc mật khẩu không đúng.");
  }

  return (
    <main className="container py-5" style={{ maxWidth: 420 }}>
      <div className="tarot-card p-4">
        <h1 className="h4 tarot-title mb-3">Đăng nhập quản trị</h1>
        <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
          <TextField label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </main>
  );
}

function Dashboard({ token }: { token: string }) {
  const [tab, setTab] = useState(0);

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 tarot-title mb-0">Quản trị lịch Tarot</h1>
        <Button variant="outlined" size="small" onClick={() => getSupabaseBrowser().auth.signOut()}>
          Đăng xuất
        </Button>
      </div>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-3">
        <Tab label="Lịch trống" />
        <Tab label="Lịch hẹn" />
        <Tab label="Bộ bài" />
      </Tabs>
      {tab === 0 && <SlotManager token={token} />}
      {tab === 1 && <BookingManager token={token} />}
      {tab === 2 && <DeckManager token={token} />}
    </main>
  );
}

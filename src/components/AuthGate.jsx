import { useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";

export default function AuthGate({ children }) {
  const { session, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  // Still checking whether a session already exists (e.g. page refresh).
  if (session === undefined) {
    return <div className="auth-loading">Loading…</div>;
  }

  // Signed in — render the actual app.
  if (session) {
    return children;
  }

  // Signed out — show the sign-in form.
  async function handleSend() {
    setError(null);
    setSending(true);
    const { error } = await signInWithEmail(email);
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="subtitle">
          Enter your email — we'll send a magic link, no password to remember.
        </p>
        {sent ? (
          <p className="auth-sent">Check your email for a sign-in link, then come back here.</p>
        ) : (
          <>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && email && handleSend()}
            />
            <button onClick={handleSend} disabled={!email || sending}>
              {sending ? "Sending…" : "Send magic link"}
            </button>
            {error && <p className="auth-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

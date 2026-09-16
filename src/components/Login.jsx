import React, { useState } from "react";
import { GlassIcon } from "./Bottle";
import { HOST_CODE, ROLES } from "../lib/constants";
import { findMember } from "../lib/db";

export default function Login({ onLogin, t }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t.loginEmpty);
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (trimmed === HOST_CODE) {
        onLogin({ code: trimmed, role: ROLES.HOST });
        return;
      }
      const member = await findMember(trimmed);
      if (member) {
        onLogin({ code: member.code, role: member.role });
      } else {
        setError(t.loginInvalid);
      }
    } catch (err) {
      console.error(err);
      setError(t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bc-login-screen">
      <form className="bc-login-card" onSubmit={submit}>
        <div className="bc-brand bc-brand--center">
          <GlassIcon />
          <div className="bc-brand-text">
            <h1>{t.appName}</h1>
            <p>{t.loginTagline}</p>
          </div>
        </div>

        <input
          className="bc-input bc-input--login"
          placeholder={t.loginPlaceholder}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          autoComplete="off"
        />

        {error && <div className="bc-error">{error}</div>}

        <button className="bc-btn bc-btn--primary bc-btn--full" disabled={loading}>
          {loading ? t.loginChecking : t.loginSubmit}
        </button>
      </form>
    </div>
  );
}

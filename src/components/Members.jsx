import React, { useState, useEffect, useCallback } from "react";
import { addMember, listMembers, deleteMember, listAccessLogs } from "../lib/db";
import { ROLE_LABELS, ROLES, HOST_CODE } from "../lib/constants";
import { formatDate } from "../lib/format";

export default function Members({ t }) {
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("members");
  const [code, setCode] = useState("");
  const [role, setRole] = useState(ROLES.SN_BARTENDER);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([listMembers(), listAccessLogs(100)]);
      setMembers(m);
      setLogs(l);
    } catch (e) {
      console.error(e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t.errCodeEmpty);
      return;
    }
    if (trimmed === HOST_CODE || members.some((m) => m.code === trimmed)) {
      setError(t.errCodeTaken);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await addMember(trimmed, role);
      setCode("");
      await load();
    } catch (e) {
      console.error(e);
      setError(t.errAddFailed);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setMembers((m) => m.filter((x) => x.id !== id));
    try {
      await deleteMember(id);
    } catch (e) {
      console.error(e);
      load();
    }
  };

  return (
    <div className="bc-shell">
      <div className="bc-card">
        <h2>{t.membersAddTitle}</h2>
        <p className="bc-card-sub">{t.membersAddDesc}</p>

        <form className="bc-member-form" onSubmit={submit}>
          <input
            className="bc-input"
            placeholder={t.codePlaceholder}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <select className="bc-input bc-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value={ROLES.SN_BARTENDER}>Senior Bartender</option>
            <option value={ROLES.HEADBAR}>HeadBar</option>
          </select>
          <button className="bc-btn bc-btn--primary" disabled={saving}>
            {saving ? t.addingBtn : t.addBtn}
          </button>
        </form>
        {error && <div className="bc-error">{error}</div>}
      </div>

      <div className="bc-tabbar">
        <button className={tab === "members" ? "bc-tab-active" : ""} onClick={() => setTab("members")}>
          {t.tabMembers(members.length)}
        </button>
        <button className={tab === "logs" ? "bc-tab-active" : ""} onClick={() => setTab("logs")}>
          {t.tabLogs}
        </button>
      </div>

      {!loaded ? (
        <div className="bc-empty">{t.loadingGeneric}</div>
      ) : tab === "members" ? (
        members.length === 0 ? (
          <div className="bc-empty">{t.emptyMembers}</div>
        ) : (
          members.map((m) => (
            <div className="bc-list-row" key={m.id}>
              <div className="bc-list-main">
                <strong>{m.code}</strong>
                <span className="bc-badge">{ROLE_LABELS[m.role] || m.role}</span>
              </div>
              <div className="bc-list-side">
                <span className="bc-muted">{formatDate(m.created_at)}</span>
                <button className="bc-delete-btn" onClick={() => remove(m.id)}>
                  {t.delete}
                </button>
              </div>
            </div>
          ))
        )
      ) : logs.length === 0 ? (
        <div className="bc-empty">{t.emptyLogs}</div>
      ) : (
        logs.map((l) => (
          <div className="bc-list-row" key={l.id}>
            <div className="bc-list-main">
              <strong>{l.code}</strong>
              <span className="bc-badge">{ROLE_LABELS[l.role] || l.role}</span>
            </div>
            <span className="bc-muted">{formatDate(l.accessed_at)}</span>
          </div>
        ))
      )}
    </div>
  );
}

import React from "react";
import { ROLE_LABELS } from "../lib/constants";

const ICONS = {
  recipes: "📖",
  members: "👥",
  calculator: "🧮",
};

export default function Menu({ session, allowedViews, onNavigate, t }) {
  const META = {
    recipes: { title: t.menuRecipesTitle, desc: t.menuRecipesDesc },
    members: { title: t.menuMembersTitle, desc: t.menuMembersDesc },
    calculator: { title: t.menuCalcTitle, desc: t.menuCalcDesc },
  };

  return (
    <div className="bc-shell">
      <p className="bc-welcome">{t.welcome(ROLE_LABELS[session.role], session.code)}</p>
      <div className="bc-menu-grid">
        {allowedViews.map((key) => (
          <button key={key} className="bc-menu-card" onClick={() => onNavigate(key)}>
            <span className="bc-menu-icon" aria-hidden="true">
              {ICONS[key]}
            </span>
            <h3>{META[key].title}</h3>
            <p>{META[key].desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

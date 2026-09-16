import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Menu from "./components/Menu";
import Recipes from "./components/Recipes";
import CocktailRecipes from "./components/CocktailRecipes";
import Members from "./components/Members";
import Calculator from "./components/Calculator";
import { GlassIcon } from "./components/Bottle";
import { ROLES, ROLE_LABELS, MENU_BY_ROLE } from "./lib/constants";
import { findMember, logAccess } from "./lib/db";
import { LANGUAGES, DEFAULT_LANG, getStrings } from "./lib/i18n";

const SESSION_KEY = "bc_session";
const LANG_KEY = "bc_lang";

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [view, setView] = useState("menu");
  const [reuseIngredients, setReuseIngredients] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || DEFAULT_LANG);
  const t = getStrings(lang);

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem(LANG_KEY, code);
  };

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) {
        setCheckingSession(false);
        return;
      }
      try {
        const savedSession = JSON.parse(raw);
        if (savedSession.role === ROLES.HOST) {
          setSession(savedSession);
        } else {
          const member = await findMember(savedSession.code);
          if (member) {
            setSession({ code: member.code, role: member.role });
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  const handleLogin = async (result) => {
    setSession(result);
    localStorage.setItem(SESSION_KEY, JSON.stringify(result));
    setView("menu");
    try {
      await logAccess(result.code, result.role);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setView("menu");
    setReuseIngredients(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const goToCalculatorWith = (recipe) => {
    setReuseIngredients(recipe.ingredients);
    setView("calculator");
  };

  if (checkingSession) {
    return (
      <div className="bc-root">
        <div className="bc-empty">{t.loadingGeneric}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bc-root">
        <div className="bc-page">
          <LanguageSwitch lang={lang} onChange={changeLang} align="center" />
          <Login onLogin={handleLogin} t={t} />
        </div>
      </div>
    );
  }

  const allowedViews = MENU_BY_ROLE[session.role] || [];
  const canCreate = allowedViews.includes("calculator");

  return (
    <div className="bc-root">
      <div className="bc-page">
        <div className="bc-header">
          <button className="bc-brand bc-brand--link" onClick={() => setView("menu")}>
            <GlassIcon />
            <div className="bc-brand-text">
              <h1>{t.appName}</h1>
              <p>
                {ROLE_LABELS[session.role]} · {session.code}
              </p>
            </div>
          </button>
          <div className="bc-header-right">
            <LanguageSwitch lang={lang} onChange={changeLang} />
            <button className="bc-nav-btn" onClick={handleLogout}>
              {t.logout}
            </button>
          </div>
        </div>

        {view === "menu" && <Menu session={session} allowedViews={allowedViews} onNavigate={setView} t={t} />}

        {view === "recipes" && allowedViews.includes("recipes") && (
          <Recipes session={session} canCreate={canCreate} onReuse={goToCalculatorWith} t={t} />
        )}

        {view === "cocktailRecipes" && allowedViews.includes("cocktailRecipes") && (
          <CocktailRecipes session={session} canCreate={canCreate} t={t} />
        )}

        {view === "members" && allowedViews.includes("members") && <Members t={t} />}

        {view === "calculator" && allowedViews.includes("calculator") && (
          <Calculator
            session={session}
            prefillIngredients={reuseIngredients}
            t={t}
            onDone={() => {
              setReuseIngredients(null);
              setView("recipes");
            }}
          />
        )}
      </div>
    </div>
  );
}

function LanguageSwitch({ lang, onChange, align }) {
  return (
    <div className={`bc-lang-switch ${align === "center" ? "bc-lang-switch--center" : ""}`}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          className={`bc-lang-btn ${lang === l.code ? "bc-lang-btn--active" : ""}`}
          onClick={() => onChange(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

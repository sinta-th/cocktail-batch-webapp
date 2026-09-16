import React, { useState, useEffect, useCallback } from "react";
import { fetchRecipes, deleteRecipe } from "../lib/db";
import { CATEGORIES, ROLES } from "../lib/constants";
import { fmt, formatDate } from "../lib/format";
import { downloadRecipeImage } from "../lib/image";

export default function Recipes({ session, canCreate, onReuse, t }) {
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (e) {
      console.error(e);
      setError(t.recipesLoadError);
    } finally {
      setLoaded(true);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    setRecipes((r) => r.filter((x) => x.id !== id));
    try {
      await deleteRecipe(id);
    } catch (e) {
      console.error(e);
      load();
    }
  };

  const inCategory = recipes.filter((r) => r.category === activeCategory);
  const canDelete = session.role === ROLES.HOST;

  return (
    <div className="bc-shell">
      <div className="bc-cat-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`bc-cat-tab ${activeCategory === c.key ? "bc-cat-tab--active" : ""}`}
            onClick={() => setActiveCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <div className="bc-banner">{error}</div>}

      {!loaded ? (
        <div className="bc-empty">{t.loadingRecipes}</div>
      ) : inCategory.length === 0 ? (
        <div className="bc-empty">{t.emptyCategory}</div>
      ) : (
        inCategory.map((r) => (
          <div className="bc-history-card" key={r.id}>
            <div className="bc-history-top">
              <span className="bc-history-size">{r.name}</span>
              <span className="bc-history-date">{formatDate(r.date)}</span>
            </div>
            <div className="bc-history-ings">{t.historyMeta(r.bottleSize, r.servings, r.createdBy || "-")}</div>
            <div className="bc-history-ings">
              {r.ingredients.map((i) => `${i.name} ${fmt(i.scaled)} ${t.unitMl}`).join("  ·  ")}
            </div>
            <div className="bc-history-actions">
              {canCreate && <button onClick={() => onReuse(r)}>{t.reuseBtn}</button>}
              <button onClick={() => downloadRecipeImage(r)}>{t.saveImageBtn}</button>
              {canDelete && (
                <button className="bc-delete" onClick={() => remove(r.id)}>
                  {t.delete}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_KEY, LANGUAGES, tr } from "../../i18n/index.js";
export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [error, setError] = useState("");
  function change(event) {
    const language = event.target.value;
    if (!LANGUAGES.includes(language)) return;
    i18n.changeLanguage(language);
    setError("");
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      setError(
        "Language changed for this visit. Browser storage could not save your preference.",
      );
    }
  }
  return (
    <div className="fa-language">
      <label>
        <span>Language / Язык</span>
        <select
          aria-label="Language / Язык"
          lang={i18n.language}
          value={i18n.language}
          onChange={change}
        >
          <option lang="en" value="en">
            English
          </option>
          <option lang="ru" value="ru">
            Русский
          </option>
        </select>
      </label>
      {error && <span role="status">{tr(error)}</span>}
    </div>
  );
}

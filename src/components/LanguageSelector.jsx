import { useLanguage } from "../LanguageContext";
import { useTranslations } from "../i18n";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations(language);

  return (
    <div className="language-selector">
      <label>{t.language}</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">{t.english}</option>
        <option value="kn">{t.kannada}</option>
      </select>
    </div>
  );
}

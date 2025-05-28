import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "uk", name: "Українська", flag: "🇺🇦" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
  ];

  // Восстанавливаем язык из localStorage при монтировании компонента
  useEffect(() => {
    const savedLanguage = localStorage.getItem("i18nextLng");
    if (savedLanguage && i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem("i18nextLng", languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-300 hover:text-indigo-400 hover:bg-gray-800"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden md:block">
          {currentLanguage.code.toUpperCase()}
        </span>
        <i
          className={`fas fa-chevron-down transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        ></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                i18n.language === language.code
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
              {i18n.language === language.code && (
                <i className="fas fa-check ml-auto text-indigo-600 dark:text-indigo-400"></i>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default LanguageSelector;

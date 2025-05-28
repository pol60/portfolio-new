import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";

interface NavbarProps {
  activeSection: string;
  scrollToSection: (sectionId: string) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  scrollToSection,
  isMenuOpen,
  setIsMenuOpen,
}) => {
  const { t } = useTranslation();

  return (
    <header
      className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${activeSection !== "home" ? "bg-gray-900/80 backdrop-blur-md shadow-md" : "bg-transparent"}`}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <nav className="hidden md:flex items-center space-x-8">
          {["home", "about", "skills", "projects", "contact"].map((section) => (
            <a
              key={section}
              href={`#${section}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(section);
              }}
              className={`relative py-2 text-sm uppercase tracking-wider font-medium cursor-pointer transition-colors ${
                activeSection === section
                  ? "text-indigo-600"
                  : "text-gray-300 hover:text-indigo-400"
              }`}
            >
              {t(`nav.${section}`)}
              {activeSection === section && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 transform origin-left transition-transform duration-300"></span>
              )}
            </a>
          ))}
        </nav>

        {/* Кнопки справа */}
        <div className="flex items-center space-x-4 ml-auto">
          <LanguageSelector />
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={t("nav.menu")}
          >
            {isMenuOpen ? (
              <i className="fas fa-times text-indigo-600"></i>
            ) : (
              <i className="fas fa-bars text-indigo-600"></i>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

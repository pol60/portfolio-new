import React from "react";
import { useTranslation } from "react-i18next";

interface MobileMenuProps {
  isMenuOpen: boolean;
  scrollToSection: (sectionId: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isMenuOpen,
  scrollToSection,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`md:hidden fixed inset-0 z-30 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="container mx-auto px-6 py-20">
        <nav className="flex flex-col space-y-8">
          {["home", "about", "skills", "projects", "contact"].map((section) => (
            <a
              key={section}
              href={`#${section}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(section);
              }}
              className="text-2xl font-medium cursor-pointer transition-colors text-gray-300"
            >
              {t(`nav.${section}`)}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;

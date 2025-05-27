import React from 'react';

interface MobileMenuProps {
  isMenuOpen: boolean;
  scrollToSection: (sectionId: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isMenuOpen, scrollToSection }) => {
  return (
    <div
      className={`md:hidden fixed inset-0 z-30 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="container mx-auto px-6 py-20">
        <nav className="flex flex-col space-y-8">
          {['home', 'about', 'skills', 'projects', 'contact'].map((section) => (
            <a
              key={section}
              href={`#${section}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(section);
              }}
              className="text-2xl font-medium cursor-pointer transition-colors text-gray-300"
            >
              {section === 'home' && 'Главная'}
              {section === 'about' && 'Обо мне'}
              {section === 'skills' && 'Навыки'}
              {section === 'projects' && 'Проекты'}
              {section === 'contact' && 'Контакты'}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;

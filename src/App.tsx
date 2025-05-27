import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import MobileMenu from "./components/MobileMenu";
import ScrollProgress from "./components/ScrollProgress";
import "./styles.css";

// Импорт секций
import Home from "./sections/Home";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Projects from "./sections/Projects";
import Contact from "./sections/Contact";

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Refs для графиков в секции Skills
  const skillChartRef = useRef<HTMLDivElement>(null);
  const experienceChartRef = useRef<HTMLDivElement>(null);

  // Обработчик скролла
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      // Определение активной секции
      const sections = document.querySelectorAll("section");
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (
          window.scrollY >= sectionTop - 200 &&
          window.scrollY < sectionTop + sectionHeight - 200
        ) {
          setActiveSection(section.id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Плавный скролл к секции
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
      setIsMenuOpen(false); // Закрываем меню после выбора раздела
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ScrollProgress progress={scrollProgress} />

      <Navbar
        activeSection={activeSection}
        scrollToSection={scrollToSection}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <MobileMenu isMenuOpen={isMenuOpen} scrollToSection={scrollToSection} />

      <Home scrollToSection={scrollToSection} />
      <About />
      <Skills
        skillChartRef={skillChartRef}
        experienceChartRef={experienceChartRef}
      />
      <Projects />
      <Contact />
    </div>
  );
};

export default App;

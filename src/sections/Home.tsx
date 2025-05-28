import React from "react";
import { useTranslation } from "react-i18next";

interface HomeProps {
  scrollToSection?: (sectionId: string) => void;
}

const Home: React.FC<HomeProps> = ({ scrollToSection = () => {} }) => {
  const { t } = useTranslation();
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20tech%20background%2C%20gradient%20purple%20and%20blue%20colors')`,
          opacity: 0.7,
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-transparent z-10"></div>

      <div className="container mx-auto px-6 relative z-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              <span className="block transform translate-y-0 opacity-100 transition-all duration-1000 delay-300">
                {t("home.greeting")}
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 transform translate-y-0 opacity-100 transition-all duration-1000 delay-500">
                {t("home.title")}
              </span>
            </h1>

            <p className="text-xl text-gray-200 max-w-lg transform translate-y-0 opacity-100 transition-all duration-1000 delay-700">
              {t("home.description")}
            </p>

            <div className="flex flex-wrap gap-4 transform translate-y-0 opacity-100 transition-all duration-1000 delay-900">
              <button
                onClick={() => scrollToSection("projects")}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
              >
                {t("home.projects_btn")}
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="px-8 py-3 bg-transparent hover:bg-white/10 text-white border-2 border-white rounded-full font-medium transition-all duration-300 transform hover:scale-105"
              >
                {t("home.contact_btn")}
              </button>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -top-10 -left-10 w-20 h-20 text-4xl animate-float-slow">
                <i className="fab fa-react text-blue-400"></i>
              </div>
              <div className="absolute top-20 -right-10 w-16 h-16 text-3xl animate-float">
                <i className="fab fa-node-js text-green-500"></i>
              </div>
              <div className="absolute bottom-20 -left-5 w-14 h-14 text-2xl animate-float-slow">
                <i className="fab fa-js text-yellow-400"></i>
              </div>
              <div className="absolute -bottom-10 right-20 w-16 h-16 text-3xl animate-float">
                <i className="fab fa-python text-blue-500"></i>
              </div>
              <div className="absolute top-40 left-20 w-12 h-12 text-xl animate-float-slow">
                <i className="fas fa-database text-indigo-400"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;

import React from "react";
import { useTranslation } from "react-i18next";
import SkillChart from "../components/SkillChart";
import ExperienceChart from "../components/ExperienceChart";

const skills = [
  { name: "React", value: 90 },
  { name: "TypeScript", value: 85 },
  { name: "Node.js", value: 80 },
  { name: "Next.js", value: 85 },
  { name: "MongoDB", value: 75 },
  { name: "PostgreSQL", value: 70 },
];

interface SkillsProps {
  skillChartRef: React.RefObject<HTMLDivElement>;
  experienceChartRef: React.RefObject<HTMLDivElement>;
}

const Skills: React.FC<SkillsProps> = ({
  skillChartRef,
  experienceChartRef,
}) => {
  const { t } = useTranslation();
  return (
    <section
      id="skills"
      className="py-20 bg-gray-50 dark:bg-gray-800 min-h-screen flex items-center"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {t("skills.title")}
            </span>
          </h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mt-4">
            {t("skills.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t("skills.tech_stack")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Frontend Card */}
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md transition-transform duration-300 hover:transform hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                    <i className="fas fa-code text-indigo-600"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t("skills.frontend")}
                  </h4>
                </div>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <i className="fab fa-react text-blue-500 mr-2"></i> React /
                    Next.js
                  </li>
                  <li className="flex items-center">
                    <i className="fab fa-js text-yellow-500 mr-2"></i>{" "}
                    JavaScript / TypeScript
                  </li>
                  <li className="flex items-center">
                    <i className="fab fa-html5 text-orange-500 mr-2"></i> HTML5
                    / CSS3
                  </li>
                  <li className="flex items-center">
                    <i className="fab fa-sass text-pink-500 mr-2"></i> Sass /
                    Tailwind CSS
                  </li>
                </ul>
              </div>

              {/* Backend Card */}
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md transition-transform duration-300 hover:transform hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                    <i className="fas fa-server text-green-600"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t("skills.backend")}
                  </h4>
                </div>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <i className="fab fa-node-js text-green-500 mr-2"></i>{" "}
                    Node.js / Express
                  </li>
                  <li className="flex items-center">
                    <i className="fab fa-python text-blue-500 mr-2"></i> Python
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-cogs text-gray-500 mr-2"></i> RESTful
                    API
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-bolt text-yellow-500 mr-2"></i> GraphQL
                  </li>
                </ul>
              </div>

              {/* Databases Card */}
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md transition-transform duration-300 hover:transform hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                    <i className="fas fa-database text-blue-600"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t("skills.databases")}
                  </h4>
                </div>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <i className="fas fa-leaf text-green-500 mr-2 w-5 text-center"></i>{" "}
                    MongoDB
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-database text-blue-500 mr-2 w-5 text-center"></i>{" "}
                    PostgreSQL
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-cloud text-indigo-500 mr-2 w-5 text-center"></i>{" "}
                    Supabase
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-bolt text-purple-500 mr-2 w-5 text-center"></i>{" "}
                    Neon
                  </li>
                </ul>
              </div>

              {/* Tools Card */}
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md transition-transform duration-300 hover:transform hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                    <i className="fas fa-tools text-purple-600"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t("skills.tools")}
                  </h4>
                </div>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <i className="fab fa-git-alt text-orange-500 mr-2"></i> Git
                    / GitHub
                  </li>
                  <li className="flex items-center">
                    <i className="fab fa-docker text-blue-500 mr-2"></i> Docker
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-cloud text-blue-400 mr-2"></i> AWS /
                    Vercel
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-vial text-red-500 mr-2"></i> Jest /
                    Testing Library
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white ">
                {t("skills.level")}
              </h3>
              {/* Используем импортированный компонент */}
              <SkillChart ref={skillChartRef} skills={skills} />
            </div>

            <div className="relative -top-16">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white -mb-6">
                {t("skills.experience")}
              </h3>
              <ExperienceChart ref={experienceChartRef} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;

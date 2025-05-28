import React from "react";
import { useTranslation } from "react-i18next";
import ProjectCard from "../components/ProjectCard";
import { useProjects } from "../hooks/useProjects";

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const { projects, loading, error } = useProjects();

  return (
    <section id="projects" className="py-20 min-h-screen flex items-center">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {t("projects.title")}
            </span>
          </h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mt-4">
            {t("projects.description")}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-10">
            <div className="text-red-500 mb-4">
              <i className="fas fa-exclamation-triangle text-3xl"></i>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {t("projects.loading_error")}
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50 !rounded-button whitespace-nowrap cursor-pointer">
            {t("projects.view_all")} <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Projects;

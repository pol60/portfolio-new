import { useState, useEffect } from "react";
import { Project } from "../components/ProjectCard";
import { useTranslation } from "react-i18next";

/**
 * Хук для загрузки проектов из JSON файла
 * @returns Объект с проектами и статусом загрузки
 */
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { i18n, t } = useTranslation();
  const language = i18n.language;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch("/projects/projects.json");

        if (!response.ok) {
          throw new Error(`Ошибка загрузки проектов: ${response.status}`);
        }

        const data = await response.json();
        // Get projects for current language, fallback to 'ru' if language not found
        const languageProjects = data[language] || data["ru"] || [];
        setProjects(languageProjects);
        setError(null);
      } catch (err) {
        console.error("Ошибка при загрузке проектов:", err);
        setError(t("projects.loading_error"));
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [language, t]);

  return { projects, loading, error };
};

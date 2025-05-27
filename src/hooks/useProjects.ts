import { useState, useEffect } from "react";
import { Project } from "../components/ProjectCard";

/**
 * Хук для загрузки проектов из JSON файла
 * @returns Объект с проектами и статусом загрузки
 */
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch("/projects/projects.json");

        if (!response.ok) {
          throw new Error(`Ошибка загрузки проектов: ${response.status}`);
        }

        const data = await response.json();
        setProjects(data);
        setError(null);
      } catch (err) {
        console.error("Ошибка при загрузке проектов:", err);
        setError(
          "Не удалось загрузить проекты. Пожалуйста, проверьте файл projects.json.",
        );
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
};

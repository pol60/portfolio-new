import React from "react";
import { Project } from "./ProjectCard";

/**
 * Компонент для администратора, показывающий инструкции по обновлению проектов
 */
const ProjectsAdmin: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Инструкция по обновлению проектов
      </h2>

      <div className="space-y-6 text-gray-600 dark:text-gray-300">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            1. Структура файла проектов
          </h3>
          <p className="mb-4">
            Проекты хранятся в файле{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              public/projects/projects.json
            </code>
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto">
            <pre className="text-sm">
              {JSON.stringify(
                [
                  {
                    id: 1,
                    title: "Название проекта",
                    description: "Описание проекта",
                    category: "Категория",
                    image: "URL изображения",
                    demoUrl: "URL демо-версии",
                    githubUrl: "URL GitHub репозитория",
                    technologies: ["Технология 1", "Технология 2"],
                  },
                ],
                null,
                2,
              )}
            </pre>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            2. Как обновить проекты
          </h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Загрузите файл{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                projects.json
              </code>{" "}
              через FTP или панель хостинга
            </li>
            <li>
              Отредактируйте содержимое файла, добавляя или изменяя проекты
            </li>
            <li>Загрузите обновленный файл обратно на сервер</li>
            <li>
              Обновления отобразятся автоматически при следующей загрузке
              страницы
            </li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            3. Рекомендации по изображениям
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Используйте изображения с соотношением сторон 16:9 или 4:3</li>
            <li>Оптимальное разрешение: 800x600 пикселей</li>
            <li>Формат: JPEG или WebP для лучшей производительности</li>
            <li>Размер файла: не более 200 КБ</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectsAdmin;

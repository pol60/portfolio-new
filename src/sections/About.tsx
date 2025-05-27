import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-20 min-h-screen flex items-center">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Обо мне</span>
          </h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="relative overflow-hidden rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-500">
              <img
                src="https://i.postimg.cc/V6tBzdVN/IMG-1552.png"
                alt="Фото разработчика"
                className="w-full h-auto object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/70 to-transparent"></div>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">5+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Лет опыта</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">30+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Проектов</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              Full Stack Разработчик с страстью к созданию инновационных решений
            </h3>

            <p className="text-gray-600 dark:text-gray-300">
              Я специализируюсь на разработке современных веб-приложений с использованием передовых технологий. Мой опыт охватывает весь стек разработки: от создания интерактивных пользовательских интерфейсов до проектирования масштабируемых серверных решений и работы с базами данных.
            </p>

            <p className="text-gray-600 dark:text-gray-300">
              В своей работе я придерживаюсь принципов чистого кода, уделяю внимание деталям и всегда стремлюсь к оптимальному балансу между функциональностью, производительностью и пользовательским опытом.
            </p>

            <div className="pt-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Основные направления:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <i className="fas fa-laptop-code text-indigo-600"></i>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Веб-разработка</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <i className="fas fa-mobile-alt text-purple-600"></i>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Адаптивный дизайн</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                    <i className="fas fa-database text-pink-600"></i>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Базы данных</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <i className="fas fa-server text-blue-600"></i>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Серверная разработка</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

import React from "react";
import { useTranslation } from "react-i18next";

const Contact: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section
      id="contact"
      className="py-20 bg-gray-50 dark:bg-gray-800 min-h-screen flex items-center"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {t("contact.title")}
            </span>
          </h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mt-4">
            {t("contact.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t("contact.what_you_get")}
            </h3>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-4">
                  <i className="fas fa-code text-indigo-600 text-xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t("contact.tech_consultation")}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t("contact.tech_consultation_desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-4">
                  <i className="fas fa-rocket text-indigo-600 text-xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t("contact.quick_start")}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t("contact.quick_start_desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-4">
                  <i className="fas fa-lightbulb text-indigo-600 text-xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t("contact.innovative_solutions")}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t("contact.innovative_solutions_desc")}
                  </p>
                </div>
              </div>

              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <i className="fas fa-info-circle text-indigo-600 text-2xl mb-2"></i>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {t("contact.chat_info")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                {t("contact.contact_info")}
              </h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-4">
                    <i className="fas fa-envelope text-indigo-600"></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {t("contact.email")}
                    </h4>
                    <a
                      href="mailto:contact@example.com"
                      className="text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400"
                    >
                      contact@example.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-4">
                    <i className="fas fa-phone-alt text-indigo-600"></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {t("contact.phone")}
                    </h4>
                    <a
                      href="tel:+71234567890"
                      className="text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400"
                    >
                      +380 (93) 075-9403
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-4">
                    <i className="fas fa-map-marker-alt text-indigo-600"></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {t("contact.location")}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Worldwide
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                {t("contact.social")}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <a
                  href="#"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
                >
                  <i className="fab fa-github text-2xl mr-3 text-gray-800 dark:text-white"></i>
                  <span className="text-gray-700 dark:text-gray-300">
                    GitHub
                  </span>
                </a>

                <a
                  href="#"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
                >
                  <i className="fab fa-linkedin text-2xl mr-3 text-blue-600"></i>
                  <span className="text-gray-700 dark:text-gray-300">
                    LinkedIn
                  </span>
                </a>

                <a
                  href="#"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
                >
                  <i className="fab fa-twitter text-2xl mr-3 text-blue-400"></i>
                  <span className="text-gray-700 dark:text-gray-300">
                    Twitter
                  </span>
                </a>

                <a
                  href="#"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
                >
                  <i className="fab fa-telegram text-2xl mr-3 text-blue-500"></i>
                  <span className="text-gray-700 dark:text-gray-300">
                    Telegram
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

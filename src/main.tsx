import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./styles.css";

// Import i18n configuration
import "./i18n";
import i18n from "./i18n";

import router from "./router";
import ErrorBoundary from "./components/ErrorBoundary";

// Loading component for i18n
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
  </div>
);

// Инициализация языка после загрузки i18n
i18n.on('initialized', () => {
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (!savedLanguage) {
    i18n.changeLanguage('en');
  }
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
);

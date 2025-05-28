// src/router.tsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./sections/Home";
import About from "./sections/About";

// Здесь мы создаём браузерный роутер с корневым путём "/"
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Этот компонент должен содержать <Outlet />, куда будут рендериться дочерние маршруты
    children: [
      {
        index: true, // при заходе на "/", рендерится Home
        element: <Home />,
      },
      {
        path: "about", // при заходе на "/about", рендерится About
        element: <About />,
      },
    ],
  },
]);

export default router;

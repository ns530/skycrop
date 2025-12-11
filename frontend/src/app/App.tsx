import React from "react";
import { RouterProvider } from "react-router-dom";

import { router } from "../routes/router";

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-brand-blue text-white px-4 py-2 rounded"
      >
        Skip to main content
      </a>
      <RouterProvider router={router} />
    </div>
  );
};

export default App;

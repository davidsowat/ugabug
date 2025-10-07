import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import AuthCallback from "./AuthCallback.jsx";

import "./index.css";             // behåll dina css
import "./PlaylistSelector.css";
import "./CriteriaSelection.css";
import "./ResultPage.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/app" element={<App />} />
        <Route path="/callback" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

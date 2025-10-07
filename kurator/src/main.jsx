import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import AuthCallback from "./AuthCallback.jsx";

import "./styles/index.css";             // behåll dina css
import "./styles/PlaylistSelector.css";
import "./styles/CriteriaSelection.css";
import "./styles/ResultPage.css";

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

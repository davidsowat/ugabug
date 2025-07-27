import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 👈 ändra till './styles/index.css' om den ligger kvar där
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

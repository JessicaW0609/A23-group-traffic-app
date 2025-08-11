// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';   
import App from './App.jsx';
import './index.css';
import 'leaflet/dist/leaflet.css';


console.log('VITE_API_BASE =', import.meta.env.VITE_API_BASE);
window.API_BASE = import.meta.env.VITE_API_BASE || '/api';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

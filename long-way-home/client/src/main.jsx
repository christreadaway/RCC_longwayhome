import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './store/GameContext';
import App from './App';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={
          <GameProvider>
            <App />
          </GameProvider>
        } />
        <Route path="/teacher/*" element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

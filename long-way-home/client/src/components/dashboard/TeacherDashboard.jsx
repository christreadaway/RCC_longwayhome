import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { logger } from '../../utils/logger';
import SessionSetup from './SessionSetup';
import DashboardMain from './DashboardMain';

export default function TeacherDashboard() {
  const [session, setSession] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <Routes>
      <Route path="/" element={
        !session
          ? <SessionSetup onSessionReady={(s) => { setSession(s); setAuthenticated(true); }} />
          : <DashboardMain session={session} setSession={setSession} />
      } />
    </Routes>
  );
}

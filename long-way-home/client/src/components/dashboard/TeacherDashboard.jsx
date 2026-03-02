import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import SessionSetup from './SessionSetup';
import DashboardMain from './DashboardMain';

export default function TeacherDashboard() {
  const [session, setSession] = useState(null);

  return (
    <Routes>
      <Route path="/" element={
        !session
          ? <SessionSetup onSessionReady={(s) => { setSession(s); }} />
          : <DashboardMain session={session} setSession={setSession} />
      } />
    </Routes>
  );
}

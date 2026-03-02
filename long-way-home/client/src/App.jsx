import { useEffect, useCallback } from 'react';
import { useGameState, useGameDispatch } from './store/GameContext';
import TitleScreen from './components/game/TitleScreen';
import SetupScreen from './components/game/SetupScreen';
import SupplyStore from './components/game/SupplyStore';
import TravelScreen from './components/game/TravelScreen';
import LandmarkScreen from './components/game/LandmarkScreen';
import EventScreen from './components/game/EventScreen';
import GameOverScreen from './components/game/GameOverScreen';
import MoralLabel from './components/game/shared/MoralLabel';
import PauseOverlay from './components/game/shared/PauseOverlay';
import { api } from './utils/api';
import { logger } from './utils/logger';

export default function App() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  // Save state to localStorage on every change
  useEffect(() => {
    if (state.studentId && state.phase !== 'TITLE') {
      try {
        localStorage.setItem(`lwh_state_${state.studentId}`, JSON.stringify(state));
      } catch (e) {
        logger.error('LOCAL_STORAGE_SAVE_FAILED', { error: e.message });
      }
    }
  }, [state]);

  // Sync state to server periodically
  useEffect(() => {
    if (!state.sessionCode || !state.studentId || state.phase === 'TITLE') return;

    const interval = setInterval(() => {
      api.updateState(state.sessionCode, state.studentId, state).catch(err => {
        logger.error('STATE_SYNC_FAILED', { error: err.message });
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [state.sessionCode, state.studentId, state.phase]);

  // Check for paused state from server
  useEffect(() => {
    if (!state.sessionCode) return;

    const interval = setInterval(async () => {
      try {
        const info = await api.getSessionInfo(state.sessionCode);
        if (info.status === 'paused' && !state.isPaused) {
          dispatch({ type: 'PAUSE_GAME' });
        } else if (info.status === 'active' && state.isPaused) {
          dispatch({ type: 'RESUME_GAME' });
        }
        if (info.settings) {
          dispatch({ type: 'SET_SESSION', sessionCode: state.sessionCode, studentId: state.studentId, gradeBand: state.gradeBand, settings: info.settings });
        }
      } catch (e) {
        // Silent fail — non-critical
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [state.sessionCode, state.isPaused]);

  function renderPhase() {
    switch (state.phase) {
      case 'TITLE':
        return <TitleScreen />;
      case 'SETUP':
        return <SetupScreen />;
      case 'SUPPLY_PURCHASE':
        return <SupplyStore />;
      case 'TRAVELING':
      case 'REST_POINT':
        return <TravelScreen />;
      case 'EVENT_RESOLUTION':
        return <EventScreen />;
      case 'LANDMARK':
        return <LandmarkScreen />;
      case 'GAME_OVER':
        return <GameOverScreen />;
      default:
        return <TitleScreen />;
    }
  }

  return (
    <div className="min-h-screen bg-trail-cream relative">
      {renderPhase()}
      {state.currentLabel && <MoralLabel label={state.currentLabel} />}
      {state.isPaused && <PauseOverlay />}
    </div>
  );
}

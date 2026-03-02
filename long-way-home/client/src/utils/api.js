import { logger } from './logger';

const BASE_URL = '/api';

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    if (res.headers.get('content-type')?.includes('text/csv')) {
      return res.blob();
    }
    return res.json();
  } catch (err) {
    logger.error('API_REQUEST_FAILED', { path, error: err.message });
    throw err;
  }
}

export const api = {
  // Session
  createSession(data) {
    return request('/session/create', { method: 'POST', body: JSON.stringify(data) });
  },
  joinSession(code, studentName) {
    return request(`/session/${code}/join`, { method: 'POST', body: JSON.stringify({ studentName }) });
  },
  getStudents(code) {
    return request(`/session/${code}/students`);
  },
  updateState(code, studentId, gameState) {
    return request(`/session/${code}/state`, { method: 'PUT', body: JSON.stringify({ studentId, gameState }) });
  },
  pauseAll(code) {
    return request(`/session/${code}/pause`, { method: 'POST' });
  },
  resumeAll(code) {
    return request(`/session/${code}/resume`, { method: 'POST' });
  },
  updateSettings(code, settings) {
    return request(`/session/${code}/settings`, { method: 'PUT', body: JSON.stringify(settings) });
  },
  getSessionInfo(code) {
    return request(`/session/${code}/info`);
  },
  verifyPassword(code, password) {
    return request(`/session/${code}/verify`, { method: 'POST', body: JSON.stringify({ password }) });
  },

  // AI
  historianQuery(sessionCode, studentId, question, gameContext) {
    return request('/historian/query', {
      method: 'POST',
      body: JSON.stringify({ sessionCode, studentId, question, gameContext })
    });
  },
  npcChat(sessionCode, studentId, character, message, exchangeCount, gameContext) {
    return request('/npc/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionCode, studentId, character, message, exchangeCount, gameContext })
    });
  },
  generateInsights(sessionCode, aggregateData) {
    return request('/insights/generate', {
      method: 'POST',
      body: JSON.stringify({ sessionCode, aggregateData })
    });
  },
  exportCsv(code) {
    return request(`/export/${code}/csv`);
  }
};

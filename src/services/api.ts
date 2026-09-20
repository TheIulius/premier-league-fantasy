import { SquadPlayer, ChipType, PlayerStats } from '../types/fpl';

const API_BASE = ''; // Same host (works for both local Vite proxy and production Express)

export async function authRegister(data: {
  username: string;
  email?: string;
  password: string;
  managerName: string;
  teamName: string;
}) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to register account');
  return json;
}

export async function authLogin(data: { login: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to log in');
  return json;
}

export async function authMe(token: string) {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function authLogout(token: string) {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token }),
  });
}

export async function fetchAppState(managerId?: string) {
  const query = managerId ? `?managerId=${encodeURIComponent(managerId)}` : '';
  const res = await fetch(`${API_BASE}/api/state${query}`);
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

export async function loginManagerApi(managerName: string, teamName: string) {
  const res = await fetch(`${API_BASE}/api/manager/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerName, teamName }),
  });
  if (!res.ok) throw new Error('Failed to login manager');
  return res.json();
}

export async function saveSquadApi(managerId: string, players: SquadPlayer[], teamName?: string) {
  const res = await fetch(`${API_BASE}/api/squad/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerId, players, teamName }),
  });
  if (!res.ok) throw new Error('Failed to save squad');
  return res.json();
}

export async function transferPlayerApi(managerId: string, outPlayerId: string, inPlayerId: string) {
  const res = await fetch(`${API_BASE}/api/squad/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerId, outPlayerId, inPlayerId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to transfer player');
  return data;
}

export async function activateChipApi(managerId: string, chip: ChipType) {
  const res = await fetch(`${API_BASE}/api/squad/chip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerId, chip }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle chip');
  return data;
}

export async function adminUpdateStatApi(playerId: string, gw: number, stats: Partial<PlayerStats>) {
  const res = await fetch(`${API_BASE}/api/admin/stat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, gw, stats }),
  });
  if (!res.ok) throw new Error('Failed to update stats');
  return res.json();
}

export async function adminSimulateApi(gw: number) {
  const res = await fetch(`${API_BASE}/api/admin/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gw }),
  });
  if (!res.ok) throw new Error('Failed to simulate');
  return res.json();
}

export async function adminFinalizeApi() {
  const res = await fetch(`${API_BASE}/api/admin/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to finalize');
  return res.json();
}

export async function adminPlayerApi(payload: any) {
  const res = await fetch(`${API_BASE}/api/admin/player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed player action');
  return res.json();
}

export async function adminResetApi() {
  const res = await fetch(`${API_BASE}/api/admin/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to reset');
  return res.json();
}

export async function createLeagueApi(managerId: string, name: string) {
  const res = await fetch(`${API_BASE}/api/league/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerId, name }),
  });
  if (!res.ok) throw new Error('Failed to create league');
  return res.json();
}

export async function joinLeagueApi(managerId: string, code: string) {
  const res = await fetch(`${API_BASE}/api/league/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerId, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join league');
  return data;
}

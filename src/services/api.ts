import { SquadPlayer, ChipType, PlayerStats, Fixture, Club } from '../types/fpl';

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

export async function adminLoginApi(password: string) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Incorrect developer password');
  return data;
}

export async function fetchAppState(managerId?: string) {
  const query = managerId ? `?managerId=${encodeURIComponent(managerId)}` : '';
  const res = await fetch(`${API_BASE}/api/state${query}`);
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

export async function fetchManagerSquadApi(managerId: string) {
  const res = await fetch(`${API_BASE}/api/manager/${encodeURIComponent(managerId)}`);
  if (!res.ok) throw new Error('Failed to fetch manager squad');
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

export async function saveSquadApi(
  managerId: string,
  players: SquadPlayer[],
  teamName?: string,
  bank?: number,
  validateComplete?: boolean
) {
  const res = await fetch(`${API_BASE}/api/squad/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerId, players, teamName, bank, validateComplete }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to save squad');
  return data;
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

export async function adminGameweekApi(action: 'advance' | 'set_gw' | 'reset_current_gw' | 'reset_all_gws', gw?: number) {
  const res = await fetch(`${API_BASE}/api/admin/gameweek`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, gw }),
  });
  if (!res.ok) throw new Error('Failed gameweek action');
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

export async function deleteLeagueApi(leagueId: string) {
  const res = await fetch(`${API_BASE}/api/league/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leagueId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete league');
  return data;
}

export async function adminAddFixtureApi(payload: {
  gameweek: number;
  homeClubId: string;
  awayClubId: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isFinished?: boolean;
  isLive?: boolean;
  kickoffTime?: string;
}) {
  const res = await fetch(`${API_BASE}/api/admin/fixture/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add game fixture');
  return data;
}

export async function adminUpdateFixtureApi(id: string, updates: Partial<Fixture>) {
  const res = await fetch(`${API_BASE}/api/admin/fixture/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update fixture');
  return data;
}

export async function adminDeleteFixtureApi(id: string) {
  const res = await fetch(`${API_BASE}/api/admin/fixture/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete fixture');
  return data;
}

export async function adminAddClubApi(club: {
  id?: string;
  name: string;
  shortName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
}) {
  const res = await fetch(`${API_BASE}/api/admin/club/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(club),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add school team');
  return data;
}

export async function adminFetchUsersApi() {
  const res = await fetch(`${API_BASE}/api/admin/users`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data;
}

export async function adminResetPasswordApi(username: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/api/admin/user/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset password');
  return data;
}

export const adminExportDbUrl = `${API_BASE}/api/admin/db/export`;

export async function adminImportDbApi(dbData: any) {
  const res = await fetch(`${API_BASE}/api/admin/db/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dbData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to import database');
  return data;
}

export async function adminSyncGithubApi(params: {
  token?: string;
  message?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}) {
  const res = await fetch(`${API_BASE}/api/admin/db/sync-github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sync with GitHub');
  return data;
}

export async function adminGetSyncStatusApi(): Promise<{
  hasServerToken: boolean;
  owner: string;
  repo: string;
  branch: string;
}> {
  const res = await fetch(`${API_BASE}/api/admin/db/sync-status`);
  if (!res.ok) throw new Error('Failed to get sync status');
  return res.json();
}

export async function adminSetServerTokenApi(token: string) {
  const res = await fetch(`${API_BASE}/api/admin/db/set-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set token');
  return data;
}

// Deadline management
export async function fetchDeadlineApi(): Promise<{ deadline: { gameweek: number; deadlineTime: string } | null }> {
  const res = await fetch(`${API_BASE}/api/deadline`);
  if (!res.ok) return { deadline: null };
  return res.json();
}

export async function adminSetDeadlineApi(gameweek: number, deadlineTime: string) {
  const res = await fetch(`${API_BASE}/api/admin/deadline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameweek, deadlineTime }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set deadline');
  return data;
}

export async function adminClearDeadlineApi() {
  const res = await fetch(`${API_BASE}/api/admin/deadline/clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to clear deadline');
  return data;
}

// Batch match events (for the new Match-Day Admin module)
export async function adminSaveMatchEventsApi(payload: {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  goalScorers: { playerId: string; minute?: number; isOwnGoal?: boolean; assistPlayerId?: string }[];
  mvpPlayerIds: string[];
  playerMinutes: Record<string, number>;
  yellowCards: string[];
  redCards: string[];
  penaltiesSaved: Record<string, number>;
  penaltiesMissed: Record<string, number>;
  venue: 'parki' | 'one_price';
}) {
  const res = await fetch(`${API_BASE}/api/admin/match-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save match events');
  return data;
}


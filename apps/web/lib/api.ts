const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export async function api<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  };
  if (init?.auth !== false) {
    const t = getToken();
    if (t) (headers as Record<string, string>)['Authorization'] = `Bearer ${t}`;
  }
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (res.status === 401 && getToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${getToken()}`;
      const retry = await fetch(`${API}${path}`, { ...init, headers });
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json() as Promise<T>;
    }
  }
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function refreshTokens(): Promise<boolean> {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) return false;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

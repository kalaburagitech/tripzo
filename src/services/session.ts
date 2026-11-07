import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const TOKEN_KEY = '@tripzo_session_token';

let currentToken: string | null = null;
let loaded = false;
const listeners = new Set<(t: string | null) => void>();

export const session = {
  async load(): Promise<string | null> {
    if (!loaded) {
      currentToken = await AsyncStorage.getItem(TOKEN_KEY);
      loaded = true;
    }
    return currentToken;
  },

  get(): string | null {
    return currentToken;
  },

  async set(token: string | null) {
    currentToken = token;
    loaded = true;
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
    listeners.forEach((l) => l(token));
  },

  async require(): Promise<string> {
    const t = await this.load();
    if (!t) throw new Error('Please log in to continue.');
    return t;
  },

  subscribe(fn: (t: string | null) => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

/** React hook returning the current session token (null when logged out). */
export function useSessionToken(): string | null {
  const [token, setToken] = useState<string | null>(session.get());
  useEffect(() => {
    let alive = true;
    session.load().then((t) => alive && setToken(t));
    const unsub = session.subscribe(setToken);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return token;
}

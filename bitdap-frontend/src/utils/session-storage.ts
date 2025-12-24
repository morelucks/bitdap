// Session storage utilities for WalletConnect

import { StoredSession } from '@/types/walletconnect';

const SESSION_STORAGE_KEY = 'bitdap_walletconnect_session';
const SESSION_EXPIRY_KEY = 'bitdap_walletconnect_expiry';

export function saveSession(session: StoredSession): void {
  try {
    if (typeof window === 'undefined') return;
    
    const serialized = JSON.stringify(session);
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    localStorage.setItem(SESSION_EXPIRY_KEY, session.expiry.toString());
  } catch (error) {
    console.error('Failed to save WalletConnect session:', error);
  }
}

export function loadSession(): StoredSession | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const serialized = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!serialized) return null;
    
    const session = JSON.parse(serialized) as StoredSession;
    
    // Check if session has expired
    if (isSessionExpired(session)) {
      clearSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to load WalletConnect session:', error);
    return null;
  }
}

export function clearSession(): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear WalletConnect session:', error);
  }
}

export function isSessionExpired(session: StoredSession): boolean {
  const now = Math.floor(Date.now() / 1000);
  return session.expiry < now;
}

export function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

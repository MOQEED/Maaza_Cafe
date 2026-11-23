import Cookies from 'js-cookie';

const TOKEN_KEY = 'maaza_token';
const USER_KEY = 'maaza_user';
const THEME_KEY = 'maaza_theme';

const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  path: '/',
  sameSite: 'lax',
};

/**
 * Get the stored authentication token from cookies (with localStorage fallback)
 */
export const getAuthToken = () => {
  return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
};

/**
 * Save authentication token to browser cookies and sync to localStorage
 */
export const setAuthToken = (token) => {
  if (token) {
    Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore localStorage issues
    }
  } else {
    removeAuthToken();
  }
};

/**
 * Remove authentication token from browser cookies and localStorage
 */
export const removeAuthToken = () => {
  Cookies.remove(TOKEN_KEY, { path: '/' });
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore localStorage issues
  }
};

/**
 * Retrieve user object from cookies or localStorage
 */
export const getUserData = () => {
  try {
    const raw = Cookies.get(USER_KEY) || localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Store user object in cookies and sync to localStorage
 */
export const setUserData = (user) => {
  if (user) {
    const json = JSON.stringify(user);
    Cookies.set(USER_KEY, json, COOKIE_OPTIONS);
    try {
      localStorage.setItem(USER_KEY, json);
    } catch {
      // Ignore localStorage issues
    }
  } else {
    removeUserData();
  }
};

/**
 * Remove user object from cookies and localStorage
 */
export const removeUserData = () => {
  Cookies.remove(USER_KEY, { path: '/' });
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore localStorage issues
  }
};

/**
 * Get UI theme preference
 */
export const getThemePreference = () => {
  return Cookies.get(THEME_KEY) || localStorage.getItem(THEME_KEY) || 'light';
};

/**
 * Store UI theme preference
 */
export const setThemePreference = (theme) => {
  Cookies.set(THEME_KEY, theme, { expires: 365, path: '/', sameSite: 'lax' });
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore localStorage issues
  }
};

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'talkready.preferences';
const DEFAULT_PREFERENCES = {
  interviewStyle: 'friendly_coach',
  questionCount: 5,
};
const ALLOWED_STYLES = ['friendly_coach', 'standard', 'strict', 'rapidfire'];
const ALLOWED_QUESTION_COUNTS = [5, 10, 15];

function readStoredPreferences() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { preferences: DEFAULT_PREFERENCES, error: null };
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Saved TalkReady preferences must be an object.');
    }
    const valid = ALLOWED_STYLES.includes(parsed.interviewStyle)
      && ALLOWED_QUESTION_COUNTS.includes(parsed.questionCount);
    if (!valid) {
      throw new Error('Saved TalkReady preferences contain unsupported values.');
    }
    return { preferences: { ...DEFAULT_PREFERENCES, ...parsed }, error: null };
  } catch (error) {
    return {
      preferences: DEFAULT_PREFERENCES,
      error: error instanceof SyntaxError
        ? new Error('Saved TalkReady preferences could not be read. Save preferences to replace them.')
        : error,
    };
  }
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [stored, setStored] = useState(readStoredPreferences);

  const savePreferences = useCallback((preferences) => {
    const valid = ALLOWED_STYLES.includes(preferences.interviewStyle)
      && ALLOWED_QUESTION_COUNTS.includes(preferences.questionCount);
    if (!valid) {
      throw new TypeError('Choose a supported interview style and question count.');
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setStored({ preferences, error: null });
    } catch (error) {
      setStored((current) => ({ ...current, error }));
      throw error;
    }
  }, []);

  const resetPreferences = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setStored({ preferences: DEFAULT_PREFERENCES, error: null });
    } catch (error) {
      setStored((current) => ({ ...current, error }));
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      preferences: stored.preferences,
      error: stored.error,
      savePreferences,
      resetPreferences,
    }),
    [stored, savePreferences, resetPreferences],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider.');
  }
  return context;
}

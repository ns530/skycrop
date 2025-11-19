import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type UiState = {
  currentFieldId?: string;
  defaultHealthIndex: 'NDVI' | 'NDWI' | 'TDVI';
  defaultHealthRange: '7d' | '14d' | '30d' | 'season';
};

export interface UiContextValue {
  state: UiState;
  setCurrentField: (fieldId?: string) => void;
  setHealthIndex: (index: UiState['defaultHealthIndex']) => void;
  setHealthRange: (range: UiState['defaultHealthRange']) => void;
}

const UiContext = createContext<UiContextValue | undefined>(undefined);

const UI_STORAGE_KEY = 'skycrop_ui_prefs';

const getDefaultState = (): UiState => ({
  currentFieldId: undefined,
  defaultHealthIndex: 'NDVI',
  defaultHealthRange: '30d',
});

const loadInitialState = (): UiState => {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }
    const parsed = JSON.parse(raw) as Partial<UiState>;

    return {
      currentFieldId: parsed.currentFieldId,
      defaultHealthIndex: parsed.defaultHealthIndex ?? 'NDVI',
      defaultHealthRange: parsed.defaultHealthRange ?? '30d',
    };
  } catch {
    return getDefaultState();
  }
};

const persistState = (state: UiState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort only; ignore storage failures.
  }
};

export const UiProvider: React.FC<PropsWithChildren> = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<UiState>(() => loadInitialState());

  const setCurrentField = useCallback((fieldId?: string) => {
    setState((prev: UiState) => {
      const next: UiState = {
        ...prev,
        currentFieldId: fieldId,
      };
      persistState(next);
      return next;
    });
  }, []);

  const setHealthIndex = useCallback((index: UiState['defaultHealthIndex']) => {
    setState((prev: UiState) => {
      const next: UiState = {
        ...prev,
        defaultHealthIndex: index,
      };
      persistState(next);
      return next;
    });
  }, []);

  const setHealthRange = useCallback((range: UiState['defaultHealthRange']) => {
    setState((prev: UiState) => {
      const next: UiState = {
        ...prev,
        defaultHealthRange: range,
      };
      persistState(next);
      return next;
    });
  }, []);

  const value = useMemo<UiContextValue>(
    () => ({
      state,
      setCurrentField,
      setHealthIndex,
      setHealthRange,
    }),
    [state, setCurrentField, setHealthIndex, setHealthRange],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export const useUiState = (): UiContextValue => {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error('useUiState must be used within a UiProvider');
  }
  return ctx;
};
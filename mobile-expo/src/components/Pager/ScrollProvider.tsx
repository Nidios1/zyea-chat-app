import React, { createContext, useContext, useMemo } from 'react';
import { NativeScrollEvent } from 'react-native';

type ScrollHandlers = {
  onScroll?: (e: { nativeEvent: NativeScrollEvent }) => void;
};

const ScrollContext = createContext<ScrollHandlers>({});

ScrollContext.displayName = 'ScrollContext';

export function useScrollHandlers(): ScrollHandlers {
  return useContext(ScrollContext);
}

type ProviderProps = { children: React.ReactNode } & ScrollHandlers;

export function ScrollProvider({
  children,
  onScroll,
}: ProviderProps) {
  const handlers = useMemo(
    () => ({
      onScroll,
    }),
    [onScroll],
  );
  return (
    <ScrollContext.Provider value={handlers}>{children}</ScrollContext.Provider>
  );
}


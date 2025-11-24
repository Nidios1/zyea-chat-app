import React from 'react';
import { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Context để quản lý headerMode và footerMode
type MinimalShellModeContext = {
  headerMode: ReturnType<typeof useSharedValue<number>>;
  footerMode: ReturnType<typeof useSharedValue<number>>;
};

const MinimalShellModeContext = React.createContext<MinimalShellModeContext | null>(null);

export function MinimalShellModeProvider({ children }: React.PropsWithChildren<{}>) {
  const headerMode = useSharedValue(0); // 0 = hiện, 1 = ẩn
  const footerMode = useSharedValue(0); // 0 = hiện, 1 = ẩn

  const value = React.useMemo(
    () => ({
      headerMode,
      footerMode,
    }),
    [headerMode, footerMode]
  );

  return (
    <MinimalShellModeContext.Provider value={value}>
      {children}
    </MinimalShellModeContext.Provider>
  );
}

export function useMinimalShellMode() {
  const context = React.useContext(MinimalShellModeContext);
  if (!context) {
    throw new Error('useMinimalShellMode must be used within MinimalShellModeProvider');
  }
  return context;
}

export function useMinimalShellHeaderTransform(headerHeight: number) {
  const { headerMode } = useMinimalShellMode();

  const headerTransform = useAnimatedStyle(() => {
    const headerModeValue = headerMode.value;
    return {
      pointerEvents: headerModeValue === 0 ? ('auto' as const) : ('none' as const),
      opacity: Math.pow(1 - headerModeValue, 2),
      transform: [
        {
          translateY: interpolate(
            headerModeValue,
            [0, 1],
            [0, -headerHeight],
          ),
        },
      ],
    };
  });

  return headerTransform;
}


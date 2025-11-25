import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, NativeScrollEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  SharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Pager, type PagerRef, type RenderTabBarFnProps } from './Pager';
import { TabBar } from './TabBar';
import { ScrollProvider } from './ScrollProvider';
import { useTheme } from '../../contexts/ThemeContext';

export interface PagerWithHeaderChildParams {
  headerHeight: number;
  isFocused: boolean;
  scrollElRef: React.MutableRefObject<any>;
}

export interface PagerWithHeaderProps {
  ref?: React.Ref<PagerRef>;
  testID?: string;
  children:
  | (((props: PagerWithHeaderChildParams) => React.ReactElement) | null)[]
  | ((props: PagerWithHeaderChildParams) => React.ReactElement);
  items: string[];
  isHeaderReady: boolean;
  renderHeader?: ({
    setMinimumHeight,
  }: {
    setMinimumHeight: (height: number) => void;
  }) => React.ReactElement;
  initialPage?: number;
  onPageSelected?: (index: number) => void;
  onCurrentPageSelected?: (index: number) => void;
  allowHeaderOverScroll?: boolean;
}

export const PagerWithHeader = React.forwardRef<PagerRef, PagerWithHeaderProps>(({
  children,
  testID,
  items,
  isHeaderReady,
  renderHeader,
  initialPage,
  onPageSelected,
  onCurrentPageSelected,
  allowHeaderOverScroll,
}, ref) => {
  const [currentPage, setCurrentPage] = useState(initialPage || 0);
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const [headerOnlyHeight, setHeaderOnlyHeight] = useState(0);
  const scrollY = useSharedValue(0);
  const headerHeight = headerOnlyHeight + tabBarHeight;
  const { colors } = useTheme();

  const onTabBarLayout = useCallback((evt: LayoutChangeEvent) => {
    const height = evt.nativeEvent.layout.height;
    if (height > 0) {
      setTabBarHeight(Math.round(height * 2) / 2);
    }
  }, []);

  const onHeaderOnlyLayout = useCallback((height: number) => {
    if (height > 0) {
      setHeaderOnlyHeight(Math.round(height * 2) / 2);
    }
  }, []);

  const renderTabBar = useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <PagerTabBar
          headerOnlyHeight={headerOnlyHeight}
          items={items}
          isHeaderReady={isHeaderReady}
          renderHeader={renderHeader}
          currentPage={currentPage}
          onCurrentPageSelected={onCurrentPageSelected}
          onTabBarLayout={onTabBarLayout}
          onHeaderOnlyLayout={onHeaderOnlyLayout}
          onSelect={props.onSelect}
          scrollY={scrollY}
          testID={testID}
          allowHeaderOverScroll={allowHeaderOverScroll}
          dragProgress={props.dragProgress}
          dragState={props.dragState}
        />
      );
    },
    [
      headerOnlyHeight,
      items,
      isHeaderReady,
      renderHeader,
      currentPage,
      onCurrentPageSelected,
      onTabBarLayout,
      onHeaderOnlyLayout,
      scrollY,
      testID,
      allowHeaderOverScroll,
    ],
  );

  const onPageSelectedInner = useCallback(
    (index: number) => {
      setCurrentPage(index);
      onPageSelected?.(index);
    },
    [onPageSelected],
  );

  const onScrollWorklet = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const nextScrollY = event.contentOffset.y;
        const isPossiblyInvalid =
          headerHeight > 0 && Math.round(nextScrollY * 2) / 2 === -headerHeight;
        if (!isPossiblyInvalid) {
          scrollY.value = nextScrollY;
        }
      },
    },
    [scrollY, headerHeight],
  );

  return (
    <Pager
      ref={ref}
      testID={testID}
      initialPage={initialPage}
      onPageSelected={onPageSelectedInner}
      renderTabBar={renderTabBar}>
      {toArray(children)
        .filter((child) => child != null && child !== false)
        .map((child, i) => {
          const isReady =
            isHeaderReady && headerOnlyHeight > 0 && tabBarHeight > 0;
          try {
            return (
              <View key={i} collapsable={false}>
                <PagerItem
                  headerHeight={headerHeight}
                  index={i}
                  isReady={isReady}
                  isFocused={i === currentPage}
                  renderTab={child}
                  onScrollWorklet={i === currentPage ? onScrollWorklet : undefined}
                  scrollY={scrollY}
                />
              </View>
            );
          } catch (error) {
            console.error(`PagerWithHeader: Error rendering child at index ${i}:`, error);
            return null;
          }
        })}
    </Pager>
  );
});

let PagerTabBar = ({
  currentPage,
  headerOnlyHeight,
  isHeaderReady,
  items,
  scrollY,
  testID,
  renderHeader,
  onHeaderOnlyLayout,
  onTabBarLayout,
  onCurrentPageSelected,
  onSelect,
  allowHeaderOverScroll,
  dragProgress,
  dragState,
}: {
  currentPage: number;
  headerOnlyHeight: number;
  isHeaderReady: boolean;
  items: string[];
  testID?: string;
  scrollY: SharedValue<number>;
  renderHeader?: ({
    setMinimumHeight,
  }: {
    setMinimumHeight: (height: number) => void;
  }) => React.ReactElement;
  onHeaderOnlyLayout: (height: number) => void;
  onTabBarLayout: (e: LayoutChangeEvent) => void;
  onCurrentPageSelected?: (index: number) => void;
  onSelect?: (index: number) => void;
  allowHeaderOverScroll?: boolean;
  dragProgress: SharedValue<number>;
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>;
}): React.ReactNode => {
  const { colors } = useTheme();
  const [minimumHeaderHeight, setMinimumHeaderHeight] = useState(0);
  const headerTransform = useAnimatedStyle(() => {
    const translateY =
      Math.min(
        scrollY.value,
        Math.max(headerOnlyHeight - minimumHeaderHeight, 0),
      ) * -1;
    return {
      transform: [
        {
          translateY: allowHeaderOverScroll
            ? translateY
            : Math.min(translateY, 0),
        },
      ],
    };
  });
  const headerRef = useRef<View>(null);

  return (
    <Animated.View
      style={[styles.tabBarMobile, headerTransform, { backgroundColor: colors.background }]}>
      <View ref={headerRef} collapsable={false}>
        {renderHeader?.({ setMinimumHeight: setMinimumHeaderHeight })}
        {isHeaderReady && (
          <View
            onLayout={() => {
              headerRef.current?.measure(
                (_x: number, _y: number, _width: number, height: number) => {
                  onHeaderOnlyLayout(height);
                },
              );
            }}
          />
        )}
      </View>
      <View
        onLayout={onTabBarLayout}
        style={{
          opacity: isHeaderReady ? 1 : 0,
          pointerEvents: isHeaderReady ? 'auto' : 'none',
        }}>
        <TabBar
          testID={testID}
          items={items}
          selectedPage={currentPage}
          onSelect={onSelect}
          onPressSelected={onCurrentPageSelected}
          dragProgress={dragProgress}
          dragState={dragState}
        />
      </View>
    </Animated.View>
  );
};
PagerTabBar = React.memo(PagerTabBar);

function PagerItem({
  headerHeight,
  index,
  isReady,
  isFocused,
  renderTab,
  onScrollWorklet,
  scrollY,
}: {
  headerHeight: number;
  index: number;
  isFocused: boolean;
  isReady: boolean;
  renderTab: ((props: PagerWithHeaderChildParams) => React.ReactElement) | null;
  onScrollWorklet?: (e: NativeScrollEvent) => void;
  scrollY: SharedValue<number>;
}) {
  // ALL hooks MUST be called before any early return (Rules of Hooks)
  const scrollElRef = useRef<any>(null);
  const [hasRendered, setHasRendered] = useState(false);

  // Mark as rendered if focused
  React.useEffect(() => {
    if (isFocused && !hasRendered) {
      setHasRendered(true);
    }
  }, [isFocused, hasRendered]);

  // NOW we can do early returns - all hooks have been called
  if (!isReady || renderTab == null) {
    return null;
  }

  // Don't render if not focused and never been rendered (lazy loading)
  if (!isFocused && !hasRendered) {
    return <View style={{ flex: 1 }} />;
  }

  try {
    const tabContent = renderTab({
      headerHeight,
      isFocused,
      scrollElRef: scrollElRef as React.MutableRefObject<any>,
    });

    if (!tabContent) {
      return null;
    }

    return (
      <ScrollProvider onScroll={isFocused ? (onScrollWorklet as any) : undefined}>
        {tabContent}
      </ScrollProvider>
    );
  } catch (error) {
    console.error(`PagerItem: Error rendering tab at index ${index}:`, error);
    return null;
  }
}

const styles = StyleSheet.create({
  tabBarMobile: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    width: '100%',
  },
});

function toArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v)) {
    return v;
  }
  return [v];
}

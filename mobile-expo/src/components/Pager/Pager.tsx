import React, { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEventData,
} from 'react-native-pager-view';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export interface PagerRef {
  setPage: (index: number) => void;
}

export interface RenderTabBarFnProps {
  selectedPage: number;
  onSelect?: (index: number) => void;
  dragProgress: Animated.SharedValue<number>;
  dragState: Animated.SharedValue<'idle' | 'dragging' | 'settling'>;
}

export type RenderTabBarFn = (props: RenderTabBarFnProps) => React.ReactElement;

interface PagerProps {
  ref?: React.Ref<PagerRef>;
  initialPage?: number;
  renderTabBar?: RenderTabBarFn; // Make it optional
  onPageSelected?: (index: number) => void;
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void;
  testID?: string;
  children: React.ReactNode;
}

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export const Pager = React.forwardRef<PagerRef, PagerProps>(
  (
    {
      children,
      initialPage = 0,
      renderTabBar,
      onPageSelected: parentOnPageSelected,
      onPageScrollStateChanged: parentOnPageScrollStateChanged,
      testID,
    },
    ref,
  ) => {
    const [selectedPage, setSelectedPage] = useState(initialPage);
    const pagerView = useRef<PagerView>(null);
    const dragProgress = useSharedValue(initialPage);
    const dragState = useSharedValue<'idle' | 'dragging' | 'settling'>('idle');

    useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        pagerView.current?.setPage(index);
      },
    }));

    const onPageSelected = useCallback(
      (e: PagerViewOnPageSelectedEvent) => {
        const index = e.nativeEvent.position;
        setSelectedPage(index);
        dragProgress.value = withSpring(index);
        parentOnPageSelected?.(index);
      },
      [parentOnPageSelected, dragProgress],
    );

    const onPageScrollStateChanged = useCallback(
      (e: PageScrollStateChangedNativeEventData) => {
        const state = e.nativeEvent.pageScrollState as 'idle' | 'dragging' | 'settling';
        dragState.value = state;
        parentOnPageScrollStateChanged?.(state);
      },
      [parentOnPageScrollStateChanged, dragState],
    );

    const onPageScroll = useCallback(
      (e: any) => {
        'worklet';
        const { position, offset } = e.nativeEvent;
        dragProgress.value = position + offset;
      },
      [dragProgress],
    );

    const handleSelect = useCallback(
      (index: number) => {
        pagerView.current?.setPage(index);
      },
      [],
    );

    return (
      <View style={{ flex: 1 }}>
        {renderTabBar && renderTabBar({
          selectedPage,
          onSelect: handleSelect,
          dragProgress,
          dragState,
        })}
        <AnimatedPagerView
          ref={pagerView}
          testID={testID}
          initialPage={initialPage}
          onPageSelected={onPageSelected}
          onPageScroll={onPageScroll}
          onPageScrollStateChanged={onPageScrollStateChanged}
          style={{ flex: 1 }}>
          {children}
        </AnimatedPagerView>
      </View>
    );
  },
);

Pager.displayName = 'Pager';


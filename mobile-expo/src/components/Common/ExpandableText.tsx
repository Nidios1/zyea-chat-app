import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, LayoutAnimation, UIManager, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ExpandableTextProps = {
  text: string;
  numberOfLines?: number;
  seeMoreLabel?: string;
  seeLessLabel?: string;
  color?: string;
  gradient?: boolean;
  backgroundColor?: string;
  linkColor?: string;
  charLimitFallback?: number;
};

const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  numberOfLines = 3,
  seeMoreLabel = 'Xem thêm',
  seeLessLabel = 'Thu gọn',
  color,
  gradient = true,
  backgroundColor,
  linkColor,
  charLimitFallback = 160,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggle = (to?: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => (typeof to === 'boolean' ? to : !v));
  };


  const onTextLayout = useCallback((e) => {
    if (!expanded) {
      const tooLong = e?.nativeEvent?.lines?.length > numberOfLines;
      if (tooLong !== isTruncated) setIsTruncated(tooLong);
    }
  }, [expanded, isTruncated, numberOfLines]);

  const shouldShowSeeMore = !expanded && (isTruncated || (text?.length || 0) > charLimitFallback);

  if (expanded) {
    return (
      <View>
        <TouchableWithoutFeedback onPress={() => toggle(false)}>
          <View>
            <Text style={{ color }}>{text}</Text>
          </View>
        </TouchableWithoutFeedback>
        {/* Hide seeLess label as requested; collapse by tapping text */}
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <TouchableWithoutFeedback onPress={() => shouldShowSeeMore && toggle(true)}>
        <View>
          <Text onTextLayout={onTextLayout} numberOfLines={numberOfLines} style={{ color }}>
            {text}
          </Text>
        </View>
      </TouchableWithoutFeedback>
      {shouldShowSeeMore && gradient ? (
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)',
            backgroundColor ? `${backgroundColor}CC` : 'rgba(255,255,255,0.8)',
            backgroundColor || 'rgba(255,255,255,1)'
          ]}
          style={{ position: 'absolute', right: 0, bottom: 0, left: 0, height: 28 }}
          pointerEvents="none"
        />
      ) : null}
      {shouldShowSeeMore ? (
        <TouchableOpacity
          onPress={() => toggle(true)}
          style={{ position: 'absolute', right: 0, bottom: 0, paddingLeft: 8, paddingVertical: 2 }}
        >
          <Text style={{ color: linkColor || '#3b82f6', fontWeight: '600' }}>{seeMoreLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default ExpandableText;



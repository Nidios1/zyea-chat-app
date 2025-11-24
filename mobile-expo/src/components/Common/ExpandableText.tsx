import React, { useCallback, useEffect, useState, useRef } from 'react';
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
  const [hasMeasured, setHasMeasured] = useState(false);
  const fullTextHeight = useRef<number>(0);
  const truncatedTextHeight = useRef<number>(0);
  
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Reset khi text thay đổi
  useEffect(() => {
    setIsTruncated(false);
    setHasMeasured(false);
    setExpanded(false);
    fullTextHeight.current = 0;
    truncatedTextHeight.current = 0;
  }, [text]);

  const toggle = (to?: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => (typeof to === 'boolean' ? to : !v));
  };

  // Kiểm tra xem text có bị truncate không
  const checkIfTruncated = useCallback(() => {
    if (fullTextHeight.current > 0 && truncatedTextHeight.current > 0) {
      // Nếu chiều cao text đầy đủ lớn hơn text bị truncate, có nghĩa là text bị cắt
      const truncated = fullTextHeight.current > truncatedTextHeight.current + 5; // +5 để có margin sai số
      setIsTruncated(truncated);
      setHasMeasured(true);
    } else if (text.length > charLimitFallback) {
      // Fallback: sử dụng độ dài text nếu chưa đo được chiều cao
      const estimatedCharsPerLine = 45;
      const estimatedLines = text.length / estimatedCharsPerLine;
      const truncated = estimatedLines > numberOfLines;
      setIsTruncated(truncated);
      setHasMeasured(true);
    }
  }, [text, numberOfLines, charLimitFallback]);

  // Đo chiều cao của text đầy đủ (không bị truncate)
  const onFullTextLayout = useCallback((e) => {
    if (!expanded && e?.nativeEvent?.layout?.height) {
      fullTextHeight.current = e.nativeEvent.layout.height;
      checkIfTruncated();
    }
  }, [expanded, checkIfTruncated]);

  // Đo chiều cao của text bị truncate
  const onTruncatedTextLayout = useCallback((e) => {
    if (!expanded && e?.nativeEvent?.layout?.height) {
      truncatedTextHeight.current = e.nativeEvent.layout.height;
      checkIfTruncated();
    }
  }, [expanded, checkIfTruncated]);

  // Hiển thị nút "Xem thêm" dựa trên nhiều điều kiện
  // Ưu tiên: nếu đã đo được và text bị truncate -> hiển thị
  // Nếu chưa đo được nhưng text dài hơn ngưỡng -> hiển thị ngay (fallback)
  const shouldShowSeeMore = !expanded && text.length > 0 && (
    (hasMeasured && isTruncated) || 
    (text.length > charLimitFallback) // Luôn hiển thị nếu text dài hơn ngưỡng (fallback)
  );

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
      {/* Text ẩn để đo chiều cao đầy đủ */}
      <Text
        onLayout={onFullTextLayout}
        style={{ 
          position: 'absolute', 
          opacity: 0, 
          zIndex: -1,
          color,
          width: '100%',
        }}
        numberOfLines={0}
      >
        {text}
      </Text>
      
      <View>
        <Text 
          onLayout={onTruncatedTextLayout}
          numberOfLines={numberOfLines} 
          style={{ color }}
        >
          {text}
        </Text>
        {shouldShowSeeMore && (
          <TouchableOpacity
            onPress={() => toggle(true)}
            style={{ 
              marginTop: 8,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: linkColor || '#1877F2', fontWeight: '500', fontSize: 15, opacity: 0.85 }}>{seeMoreLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ExpandableText;



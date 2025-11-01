import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Animated, PanResponder, Dimensions } from 'react-native';
import { Text, TextInput, Button, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsfeedAPI } from '../../utils/api';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import ExpandableText from '../Common/ExpandableText';

type CommentsBottomSheetProps = {
  postId: string | number | null;
  visible: boolean;
  onClose: () => void;
  placeholder?: string;
};

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 8,
    maxHeight: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emoji: {
    fontSize: 20,
    marginHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentBody: {
    flex: 1,
    marginLeft: 10,
  },
  commentName: {
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 13,
  },
  commentText: {
    fontSize: 14,
  },
  time: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({ postId, visible, onClose, placeholder }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  // Snap sheet behavior
  const screenH = Dimensions.get('window').height;
  const SNAP_POINTS = [0.96, 0.6];
  const initialSnap = SNAP_POINTS[0];
  const toY = (snap: number) => screenH * (1 - snap);
  const translateY = useRef(new Animated.Value(toY(initialSnap))).current;
  const currentSnap = useRef(initialSnap);

  const animateTo = (snap: number) => {
    currentSnap.current = snap;
    Animated.spring(translateY, {
      toValue: toY(snap),
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: Animated.event([null, { dy: translateY }], {
        useNativeDriver: false,
        listener: (_e, g) => {
          const base = toY(currentSnap.current);
          const next = Math.max(0, Math.min(screenH * 0.5, base + g.dy));
          translateY.setValue(next);
        },
      }),
      onPanResponderRelease: (_e, g) => {
        const base = toY(currentSnap.current) + g.dy + (g.vy || 0) * 40;
        // Decide nearest snap
        const distances = SNAP_POINTS.map((s) => ({ s, d: Math.abs(base - toY(s)) }));
        distances.sort((a, b) => a.d - b.d);
        const target = distances[0].s;
        animateTo(target);
      },
    })
  ).current;

  const { data: comments = [], isLoading } = useQuery({
    enabled: Boolean(postId) && visible,
    queryKey: ['postComments', postId],
    queryFn: () => newsfeedAPI.getPostComments(String(postId)).then((r) => r.data),
  });

  const addComment = useMutation({
    mutationFn: (content: string) => newsfeedAPI.commentPost(String(postId), content),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const emojis = ['❤️','👏','🔥','😍','😆','😮','😢','😠'];

  // Prevent immediate backdrop-close from the same press that opened the sheet
  const [canDismiss, setCanDismiss] = useState(false);
  useEffect(() => {
    if (visible) {
      setCanDismiss(false);
      // reset position to the first snap, then animate into place
      translateY.setValue(toY(initialSnap));
      const t = setTimeout(() => setCanDismiss(true), 220);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => canDismiss && onClose()}>
        <KeyboardAvoidingView behavior="padding" style={{ maxHeight: '100%', width: '100%' }}>
          <Animated.View
            style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Bình luận</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item: any, index) => item.id?.toString?.() || String(index)}
            renderItem={({ item }: any) => (
              <View style={styles.commentItem}>
                {item?.author?.avatar_url ? (
                  <Avatar.Image size={36} source={{ uri: getAvatarURL(item.author.avatar_url) }} />
                ) : (
                  <Avatar.Text size={36} label={getInitials(item?.author?.full_name || item?.author?.username || 'U')} />
                )}
                <View style={styles.commentBody}>
                  <Text style={[styles.commentName, { color: colors.primary }]}>
                    {item?.author?.full_name || item?.author?.username || 'Người dùng'}
                  </Text>
                  <ExpandableText text={item?.content || ''} numberOfLines={3} color={colors.text} />
                  {!!item?.created_at && (
                    <Text style={[styles.time, { color: colors.textSecondary }]}>
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </Text>
                  )}
                  <Text style={[styles.time, { color: colors.textSecondary, marginTop: 2 }]}>Trả lời</Text>
                </View>
                <TouchableOpacity>
                  <MaterialCommunityIcons name={item?.isLiked ? 'heart' : 'heart-outline'} size={18} color={item?.isLiked ? '#e74c3c' : colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              isLoading ? (
                <View style={{ padding: 16 }}>
                  <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
                </View>
              ) : (
                <View style={{ padding: 16 }}>
                  <Text style={{ color: colors.textSecondary }}>Chưa có bình luận</Text>
                </View>
              )
            }
          />

          <View style={styles.emojiRow}>
            {emojis.map((e) => (
              <TouchableOpacity key={e} onPress={() => setText((t) => (t ? t + ' ' + e : e))}>
                <Text style={styles.emoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              mode="outlined"
              placeholder={placeholder || 'Bình luận...'}
              value={text}
              onChangeText={setText}
              style={styles.input}
              multiline
            />
            <Button mode="contained" onPress={() => text.trim() && postId && addComment.mutate(text)} loading={Boolean(addComment.isLoading)} disabled={!text.trim() || !postId}>
              Gửi
            </Button>
          </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

export default CommentsBottomSheet;



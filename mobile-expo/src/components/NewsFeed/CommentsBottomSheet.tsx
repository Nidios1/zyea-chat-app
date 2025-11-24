import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Modal, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  KeyboardAvoidingView, 
  Animated, 
  PanResponder, 
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Text, TextInput, Avatar } from 'react-native-paper';
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

// Format time ago helper
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} năm`;
  if (months > 0) return `${months} tháng`;
  if (weeks > 0) return `${weeks} tuần`;
  if (days > 0) return `${days} ngày`;
  if (hours > 0) return `${hours} giờ`;
  if (minutes > 0) return `${minutes} phút`;
  return 'Vừa xong';
};

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '100%',
    backgroundColor: colors.surface,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  list: {
    flex: 1,
    paddingBottom: 8,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentAvatar: {
    marginRight: 8,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentName: {
    fontWeight: '600',
    fontSize: 15,
    color: colors.text,
    marginRight: 6,
  },
  commentTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  replyContainer: {
    marginLeft: 44,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
    margin: 0,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  inputIcon: {
    padding: 4,
  },
  sendButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({ postId, visible, onClose, placeholder }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);
  const [text, setText] = useState('');
  const [sortBy, setSortBy] = useState<'most_relevant' | 'newest'>('most_relevant');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const queryClient = useQueryClient();
  const inputRef = useRef<any>(null);

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
    queryFn: () => newsfeedAPI.getPostComments(String(postId)).then((r) => r.data || []),
  });

  // Sort comments
  const sortedComments = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    const sorted = [...comments];
    if (sortBy === 'newest') {
      return sorted.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }
    return sorted; // most_relevant - keep original order
  }, [comments, sortBy]);

  const addComment = useMutation({
    mutationFn: (content: string) => newsfeedAPI.commentPost(String(postId), content),
    onSuccess: () => {
      setText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
  });

  const handleSubmit = () => {
    if (text.trim() && postId) {
      addComment.mutate(text.trim());
    }
  };

  // Prevent immediate backdrop-close from the same press that opened the sheet
  const [canDismiss, setCanDismiss] = useState(false);
  useEffect(() => {
    if (visible) {
      setCanDismiss(false);
      translateY.setValue(toY(initialSnap));
      const t = setTimeout(() => setCanDismiss(true), 220);
      return () => clearTimeout(t);
    } else {
      setText('');
      setReplyingTo(null);
    }
  }, [visible]);

  const renderComment = ({ item }: any) => {
    const commentDate = item.created_at ? new Date(item.created_at) : new Date();
    const authorName = item?.author?.full_name || item?.author?.username || 'Người dùng';
    const authorAvatar = item?.author?.avatar_url;

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentAvatar}>
          {authorAvatar ? (
            <Avatar.Image size={36} source={{ uri: getAvatarURL(authorAvatar) }} />
          ) : (
            <Avatar.Text size={36} label={getInitials(authorName)} />
          )}
        </View>
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentName}>{authorName}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(commentDate)}</Text>
          </View>
          <Text style={styles.commentText}>{item?.content || ''}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.commentAction}
              onPress={() => {
                // TODO: Implement like comment
                console.log('Like comment:', item.id);
              }}
            >
              <MaterialCommunityIcons 
                name={item?.isLiked ? 'thumb-up' : 'thumb-up-outline'} 
                size={16} 
                color={item?.isLiked ? '#1877F2' : colors.textSecondary} 
              />
              {(item?.likes_count || 0) > 0 && (
                <Text style={styles.commentActionText}>{item.likes_count}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.commentAction}
              onPress={() => {
                setReplyingTo(item);
                inputRef.current?.focus();
              }}
            >
              <Text style={styles.commentActionText}>Trả lời</Text>
            </TouchableOpacity>
          </View>
          {/* Replies */}
          {item.replies && item.replies.length > 0 && (
            <View style={styles.replyContainer}>
              {item.replies.map((reply: any, idx: number) => {
                const replyDate = reply.created_at ? new Date(reply.created_at) : new Date();
                const replyAuthorName = reply?.author?.full_name || reply?.author?.username || 'Người dùng';
                const replyAuthorAvatar = reply?.author?.avatar_url;
                return (
                  <View key={reply.id || idx} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      {replyAuthorAvatar ? (
                        <Avatar.Image size={32} source={{ uri: getAvatarURL(replyAuthorAvatar) }} />
                      ) : (
                        <Avatar.Text size={32} label={getInitials(replyAuthorName)} />
                      )}
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentName}>{replyAuthorName}</Text>
                        <Text style={styles.commentTime}>{formatTimeAgo(replyDate)}</Text>
                      </View>
                      <Text style={styles.commentText}>{reply?.content || ''}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => canDismiss && onClose()}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1, width: '100%' }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.handle} />
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Bình luận</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Sort Dropdown - Facebook style */}
            <TouchableOpacity 
              style={styles.sortDropdown}
              onPress={() => setSortBy(sortBy === 'most_relevant' ? 'newest' : 'most_relevant')}
            >
              <MaterialCommunityIcons 
                name="sort" 
                size={18} 
                color={colors.primary} 
              />
              <Text style={styles.sortText}>
                {sortBy === 'most_relevant' ? 'Phù hợp nhất' : 'Mới nhất'}
              </Text>
            </TouchableOpacity>

            {/* Comments List */}
            <FlatList
              data={sortedComments}
              keyExtractor={(item: any, index) => item.id?.toString() || `comment-${index}`}
              renderItem={renderComment}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                isLoading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Đang tải...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Chưa có bình luận</Text>
                  </View>
                )
              }
            />

            {/* Input Field - Facebook style */}
            {replyingTo && (
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Đang trả lời</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                  {replyingTo?.author?.full_name || replyingTo?.author?.username || 'Người dùng'}
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={inputRef}
                  mode="flat"
                  placeholder={replyingTo ? `Trả lời ${replyingTo?.author?.full_name || replyingTo?.author?.username || ''}...` : (placeholder || 'Viết bình luận...')}
                  placeholderTextColor={colors.textSecondary}
                  value={text}
                  onChangeText={setText}
                  style={styles.input}
                  multiline
                  dense
                  underlineColorAndroid="transparent"
                  activeUnderlineColor="transparent"
                />
                <View style={styles.inputIcons}>
                  <TouchableOpacity style={styles.inputIcon}>
                    <MaterialCommunityIcons name="emoticon-outline" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inputIcon}>
                    <MaterialCommunityIcons name="camera-outline" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              {text.trim().length > 0 && (
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={handleSubmit}
                  disabled={addComment.isPending}
                >
                  <MaterialCommunityIcons 
                    name="send" 
                    size={22} 
                    color={addComment.isPending ? colors.textSecondary : colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

export default CommentsBottomSheet;

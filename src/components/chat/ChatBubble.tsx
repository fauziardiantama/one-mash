import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import type { ReplyTarget } from '../../store/types';
import { CHAT_MARKDOWN_STYLE, COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';
import Icon from '../ui/Icon';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  author?: string;
  text: string;
  isFirst: boolean;
  isLast: boolean;
  onReply?: (target: ReplyTarget) => void;
  defaultAiName?: string;
}

export default function ChatBubble({
  role,
  author,
  text,
  isFirst,
  isLast,
  onReply,
  defaultAiName = 'OpenClaw',
}: ChatBubbleProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dx > 12 && gesture.dx > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_evt, gesture) => {
        translateX.setValue(Math.max(0, gesture.dx));
      },
      onPanResponderRelease: (_evt, gesture) => {
        const passed = gesture.dx > LAYOUT.dragReplyThreshold;
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        if (passed && onReply) {
          onReply({
            author: role === 'ai' ? author || defaultAiName : 'Anda',
            text,
          });
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const radii =
    role === 'user'
      ? {
          borderTopLeftRadius: RADII.xxl,
          borderTopRightRadius: isFirst ? RADII.xxl : RADII.xs,
          borderBottomLeftRadius: RADII.xxl,
          borderBottomRightRadius: isLast ? RADII.xxl : RADII.xs,
        }
      : {
          borderTopLeftRadius: isFirst ? RADII.xxl : RADII.xs,
          borderTopRightRadius: RADII.xxl,
          borderBottomLeftRadius: isLast ? RADII.xxl : RADII.xs,
          borderBottomRightRadius: RADII.xxl,
        };

  const dragIconOpacity = translateX.interpolate({
    inputRange: [0, LAYOUT.dragReplyThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View>
      {role === 'ai' && author && isFirst ? (
        <Text style={styles.authorLabel}>{author}</Text>
      ) : null}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bubble,
          role === 'user' ? styles.user : styles.ai,
          radii,
          { transform: [{ translateX }] },
        ]}>
        <Animated.View style={[styles.dragIcon, { opacity: dragIconOpacity }]} pointerEvents="none">
          <Icon name="corner-up-left" size={20} color={COLORS.textMuted} />
        </Animated.View>
        <Markdown style={CHAT_MARKDOWN_STYLE}>{text}</Markdown>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  authorLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginBottom: 4,
    marginLeft: 6,
  },
  dragIcon: {
    position: 'absolute',
    left: -SPACING.xxxl,
    top: '50%',
    marginTop: -10,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.brandMagenta,
  },
  ai: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceElevated,
  },
});

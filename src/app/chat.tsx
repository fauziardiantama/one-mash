import { useRouter } from 'expo-router';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import ChatHeader from '../components/chat/ChatHeader';
import Composer from '../components/chat/Composer';
import { getGroupFlags } from '../components/chat/messageGrouping';
import ReplyMessage from '../components/chat/ReplyMessage';
import ScrollToBottomButton from '../components/chat/ScrollToBottomButton';
import Sidebar, { SIDEBAR_WIDTH } from '../components/chat/Sidebar';
import TabBar from '../components/chat/TabBar';
import TypingIndicator from '../components/chat/TypingIndicator';
import EditAvatarPopup from '../components/profile/EditAvatarPopup';
import ProfileTakeoverLayer from '../components/profile/ProfileTakeoverLayer';
import ScreenShell from '../components/ui/ScreenShell';
import { BottomFade } from '../components/ui/TopFade';
import { useStore } from '../store';
import type { ChatMessage } from '../store/types';
import { COLORS, FONTS, LAYOUT, SPACING } from '../theme';

export default function ChatScreen() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editPopupVisible, setEditPopupVisible] = useState(false);
  const [chatHeaderHeight, setChatHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messages = useStore((s) => s.chat.messages);
  const replyTo = useStore((s) => s.chat.replyTo);
  const sendMessage = useStore((s) => s.chat.sendMessage);
  const abortGeneration = useStore((s) => s.chat.abortGeneration);
  const setReplyTo = useStore((s) => s.chat.setReplyTo);
  const openDirectChat = useStore((s) => s.chat.openDirectChat);
  const isStreaming = useStore((s) => s.chat.isStreaming);
  const wsStatus = useStore((s) => s.chat.wsStatus);
  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const agentsList = useStore((s) => s.agents.list);
  const loadAgents = useStore((s) => s.agents.loadAgents);

  const activeAgent = agentsList.find((a) => a.id === activeAgentId);
  const displayName = activeAgent?.name || activeAgentId || 'Main Agent';

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sidebarOpenRef = useRef(false);

  useEffect(() => {
    loadAgents().catch(() => {});
    const state = useStore.getState();
    if (state.chat.mode === 'direct') {
      openDirectChat(state.agents.activeAgentId, state.chat.activeSessionKey).catch(() => {});
    }
  }, [loadAgents, openDirectChat]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [messages.length, isStreaming]);

  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  const sidebarPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        sidebarOpenRef.current &&
        gesture.dx < -12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderRelease: (_evt, gesture) => {
        if (sidebarOpenRef.current && gesture.dx < -LAYOUT.dragReplyThreshold) {
          setSidebarOpen(false);
        }
      },
      onPanResponderTerminate: () => {},
    }),
  ).current;

  const keyboardHeight = useSharedValue(0);
  const tabBarHeight = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: (e) => {
        'worklet';
        keyboardHeight.value = Math.max(e.height, 0);
      },
    },
    [],
  );

  const animatedTopStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, keyboardHeight.value - tabBarHeight.value),
  }));

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen, slideAnim]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SIDEBAR_WIDTH],
  });

  const handleOpenProfile = () => {
    Keyboard.dismiss();
    setSidebarOpen(false);
    setProfileOpen(true);
  };

  const handleCloseProfile = () => setProfileOpen(false);

  const headerStatus =
    wsStatus === 'streaming'
      ? 'Sedang membalas...'
      : wsStatus === 'connecting'
        ? 'Menghubungkan...'
        : wsStatus === 'connected'
          ? null
          : 'Offline';

  return (
    <ScreenShell safeBottom={false}>
      <View style={styles.root} {...sidebarPanResponder.panHandlers}>
        <Sidebar
          onSettingsPress={() => {
            setSidebarOpen(false);
            router.push('/settings');
          }}
          onSelectChat={() => setSidebarOpen(false)}
        />
        <Animated.View style={[styles.main, { transform: [{ translateX }] }]}>
          <Reanimated.View style={[styles.topPart, animatedTopStyle]}>
            <View style={styles.messagesWrap}>
              <ScrollView
                ref={scrollRef}
                style={styles.messages}
                contentContainerStyle={[styles.messagesContent, { paddingTop: chatHeaderHeight }]}
                onScroll={(e) => {
                  const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                  const distance = contentSize.height - (layoutMeasurement.height + contentOffset.y);
                  setShowScrollButton(messages.length > 0 && distance > 80);
                }}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="on-drag">
                {messages.length === 0 && (
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyTitle}>{displayName}</Text>
                      <Text style={styles.emptySubtitle}>
                        Mulai percakapan baru dengan mengirimkan pesan di bawah.
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                )}
                {messages.map((m: ChatMessage, i: number, list: ChatMessage[]) => {
                  const { isFirst, isLast } = getGroupFlags(list, i);
                  return (
                    <View key={m.id} style={{ marginBottom: isLast ? SPACING.md : SPACING.xs }}>
                      <ReplyMessage
                        message={m}
                        isFirst={isFirst}
                        isLast={isLast}
                        onReply={setReplyTo}
                        defaultAiName={displayName}
                      />
                    </View>
                  );
                })}
                {isStreaming && (!messages.length || messages[messages.length - 1]?.role === 'user') && (
                  <TypingIndicator />
                )}
              </ScrollView>
              {showScrollButton && messages.length > 0 && <BottomFade height={12} />}
              <ScrollToBottomButton
                visible={showScrollButton && messages.length > 0}
                onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              />
            </View>
            <Composer
              isStreaming={isStreaming}
              onSend={(text) => {
                sendMessage(text);
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
              }}
              onAbort={abortGeneration}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onAttachAction={(key) => {
                if (key === 'file') {
                  router.push('/settings/characters');
                } else if (key === 'gallery') {
                  setEditPopupVisible(true);
                }
              }}
            />
          </Reanimated.View>
          <View onLayout={(e) => { tabBarHeight.value = e.nativeEvent.layout.height; }}>
            <TabBar />
          </View>
          <ProfileTakeoverLayer
            visible={profileOpen}
            onClose={handleCloseProfile}
            headerHeight={chatHeaderHeight}
          />
          <ChatHeader
            onMenuPress={() => setSidebarOpen((v) => !v)}
            status={headerStatus}
            onLayout={(e) => setChatHeaderHeight(e.nativeEvent.layout.height)}
            isProfileOpen={profileOpen}
            onOpenProfile={handleOpenProfile}
            onCloseProfile={handleCloseProfile}
            onEditAvatarPress={() => setEditPopupVisible(true)}
          />
          <EditAvatarPopup
            visible={editPopupVisible}
            onClose={() => setEditPopupVisible(false)}
          />
        </Animated.View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
  main: { flex: 1, backgroundColor: COLORS.canvas, zIndex: 1 },
  topPart: { flex: 1 },
  messagesWrap: { flex: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    textAlign: 'center',
  },
});

import { useEffect, useState } from 'react';
import { BackHandler, Dimensions, StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useStore } from '../../store';
import type { ToolActivityItem } from '../../store/types';
import { COLORS, LAYOUT } from '../../theme';
import ActivityDetailSheet from './ActivityDetailSheet';
import ActivityTabContent from './ActivityTabContent';
import EarTabContent from './EarTabContent';
import PersonaTabContent from './PersonaTabContent';
import ProfileTabBar, { type ProfileTabId } from './ProfileTabBar';
import SessionHistoryTabContent from './SessionHistoryTabContent';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_PIVOT_Y = LAYOUT.avatarPivotY;
const TRANSLATE_Y_OFFSET = AVATAR_PIVOT_Y - SCREEN_HEIGHT / 2;

interface ProfileTakeoverLayerProps {
  visible: boolean;
  onClose: () => void;
  headerHeight?: number;
}

export default function ProfileTakeoverLayer({
  visible,
  onClose,
  headerHeight = 160,
}: ProfileTakeoverLayerProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('activity');
  const [selectedActivity, setSelectedActivity] = useState<ToolActivityItem | null>(null);
  const openDirectChat = useStore((s) => s.chat.openDirectChat);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 300 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  }, [visible, progress]);

  useEffect(() => {
    if (!visible) return;
    const backAction = () => {
      if (selectedActivity) {
        setSelectedActivity(null);
        return true;
      }
      onClose();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, selectedActivity, onClose]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.05, 1], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    const translateY = (1 - scale) * TRANSLATE_Y_OFFSET;
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.35, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Reanimated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.takeoverLayer, animatedStyle]}>
      <Reanimated.View style={[styles.contentWrapper, { paddingTop: headerHeight }, animatedContentStyle]}>
        <View style={styles.tabBarWrapper}>
          <ProfileTabBar activeTab={activeTab} onSelectTab={setActiveTab} />
        </View>
        {activeTab === 'activity' && (
          <ActivityTabContent onSelectActivity={(act) => setSelectedActivity(act)} />
        )}
        {activeTab === 'tasks' && <EarTabContent />}
        {activeTab === 'display' && <PersonaTabContent />}
        {activeTab === 'history' && (
          <SessionHistoryTabContent
            onSelectSession={(agentId, sessionKey) => {
              openDirectChat(agentId, sessionKey);
              onClose();
            }}
          />
        )}
      </Reanimated.View>

      <ActivityDetailSheet
        visible={Boolean(selectedActivity)}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  takeoverLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.canvas,
    zIndex: 50,
    elevation: 20,
  },
  contentWrapper: {
    flex: 1,
  },
  tabBarWrapper: {
    zIndex: 10,
    elevation: 6,
  },
});

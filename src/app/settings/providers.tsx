import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AkashPanel from '../../components/settings/AkashPanel';
import ModalPanel from '../../components/settings/ModalPanel';
import FloatingHeader from '../../components/ui/FloatingHeader';
import KeyboardScrollView from '../../components/ui/KeyboardScrollView';
import ScreenShell from '../../components/ui/ScreenShell';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';

export default function ProvidersSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'akash' | 'modal'>(params.tab === 'modal' ? 'modal' : 'akash');
  const [headerHeight, setHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);
  const loadProviders = useStore((s) => s.providers.loadProviders);

  useEffect(() => {
    loadProviders().catch(() => {});
  }, [loadProviders]);

  return (
    <ScreenShell>
      <KeyboardScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <View style={styles.segment}>
          {(['akash', 'modal'] as const).map((item) => {
            const active = tab === item;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.75}
                style={[styles.segBtn, active && styles.segBtnActive]}
                onPress={() => setTab(item)}>
                <Text style={[styles.segLabel, active && styles.segLabelActive]}>
                  {item === 'akash' ? 'Akash Network' : 'Modal Inference'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'akash' ? <AkashPanel /> : <ModalPanel />}
      </KeyboardScrollView>

      <FloatingHeader
        title="Dompet & Compute"
        onLeftPress={() => router.back()}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADII.md },
  segBtnActive: { backgroundColor: COLORS.surfaceControl },
  segLabel: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.bold },
  segLabelActive: { color: COLORS.textPrimary },
});

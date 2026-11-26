import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import FloatingHeader from '../../components/ui/FloatingHeader';
import { GroupedRow, GroupedSection } from '../../components/ui/GroupedSection';
import ScreenShell from '../../components/ui/ScreenShell';
import { useStore } from '../../store';
import { LAYOUT, SPACING } from '../../theme';

export default function SettingsScreen() {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);
  const baseUrl = useStore((s) => s.connection.baseUrl);
  const sleep = useStore((s) => s.notifications.config.notification_sleep);
  const agentCount = useStore((s) => s.agents.list.length);
  const groupCount = useStore((s) => s.groups.list.length);

  return (
    <ScreenShell>
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <GroupedSection>
          <GroupedRow
            icon="grid"
            label="Konektor"
            subtitle={baseUrl}
            onPress={() => router.push('/settings/connection')}
          />
          <GroupedRow
            icon="credit-card"
            label="Dompet & Compute"
            subtitle="Akash Network & Modal Inference"
            onPress={() => router.push('/settings/providers')}
          />
          <GroupedRow
            icon="shield"
            label="Agents & Characters"
            subtitle="Semua agen OpenClaw & Kartu v2"
            valueText={agentCount > 0 ? String(agentCount) : undefined}
            onPress={() => router.push('/settings/characters')}
          />
          <GroupedRow
            icon="user-check"
            label="Grup Multi-Agen"
            valueText={groupCount > 0 ? String(groupCount) : undefined}
            onPress={() => router.push('/settings/groups')}
          />
          <GroupedRow icon="message-circle" label="Saluran pengiriman pesan" />
          <GroupedRow icon="smartphone" label="Perangkat" isLast />
        </GroupedSection>

        <GroupedSection>
          <GroupedRow
            icon="bell"
            label="Notifikasi"
            valueText={sleep ? 'Sleep' : 'Aktif'}
            onPress={() => router.push('/settings/notifications')}
          />
          <GroupedRow icon="pen-tool" label="Tampilan" />
          <GroupedRow icon="lock" label="Kunci aplikasi" />
          <GroupedRow icon="phone" label="Atur sebagai asisten default" isLast />
        </GroupedSection>
      </ScrollView>

      <FloatingHeader
        title="Pengaturan"
        leftIcon="chevron-left"
        onLeftPress={() => router.back()}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
});

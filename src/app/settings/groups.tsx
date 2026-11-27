import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import FloatingHeader from '../../components/ui/FloatingHeader';
import Icon from '../../components/ui/Icon';
import InTreeBottomSheet from '../../components/ui/InTreeBottomSheet';
import ScreenShell from '../../components/ui/ScreenShell';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT, RADII, SPACING } from '../../theme';

export default function GroupsSettingsScreen() {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState<number>(LAYOUT.headerDefaultHeight);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['main']);
  const [creating, setCreating] = useState(false);

  const groups = useStore((s) => s.groups.list);
  const loadGroups = useStore((s) => s.groups.loadGroups);
  const createGroup = useStore((s) => s.groups.createGroup);
  const deleteGroup = useStore((s) => s.groups.deleteGroup);
  const agents = useStore((s) => s.agents.list);
  const loadAgents = useStore((s) => s.agents.loadAgents);
  const activeGroupId = useStore((s) => s.chat.activeGroupId);
  const openGroupChat = useStore((s) => s.chat.openGroupChat);
  const openDirectChat = useStore((s) => s.chat.openDirectChat);

  useEffect(() => {
    loadGroups().catch(() => {});
    loadAgents().catch(() => {});
  }, [loadGroups, loadAgents]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleConfirmDelete = (id: string, name: string) => {
    Alert.alert('Hapus Grup', `Hapus grup "${name}" beserta riwayatnya?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(id);
            if (activeGroupId === id) {
              openDirectChat('main').catch(() => {});
            }
          } catch (err: unknown) {
            Alert.alert('Gagal Menghapus', err instanceof Error ? err.message : String(err));
          }
        },
      },
    ]);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      Alert.alert('Input Kurang', 'Nama grup dan minimal 1 anggota wajib dipilih.');
      return;
    }
    setCreating(true);
    try {
      const grp = await createGroup(groupName.trim(), selectedMembers);
      setGroupName('');
      setSheetOpen(false);
      await openGroupChat(grp.id);
      router.replace('/chat');
    } catch (err: unknown) {
      Alert.alert('Gagal Membuat Grup', err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScreenShell>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <AppButton
          label="Buat Grup Multi-Agen"
          variant="magenta"
          onPress={() => setSheetOpen(true)}
          style={styles.createBtn}
        />

        {groups.length === 0 ? (
          <Text style={styles.empty}>Belum ada grup multi-agen.</Text>
        ) : (
          groups.map((grp) => (
            <TouchableOpacity
              key={grp.id}
              activeOpacity={0.75}
              style={styles.card}
              onPress={() => {
                openGroupChat(grp.id);
                router.replace('/chat');
              }}>
              <Icon name="layers" size={22} color={COLORS.brandPinkSoft} />
              <View style={styles.infoCol}>
                <Text style={styles.name}>{grp.name}</Text>
                <Text style={styles.meta}>Anggota: {grp.members.join(', ')}</Text>
              </View>
              <TouchableOpacity
                style={styles.trashBtn}
                onPress={() => handleConfirmDelete(grp.id, grp.name)}>
                <Icon name="trash-2" size={18} color={COLORS.statusDangerAlt} />
              </TouchableOpacity>
              <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <FloatingHeader
        title="Grup Multi-Agen"
        onLeftPress={() => router.back()}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />

      <InTreeBottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text style={styles.sheetTitle}>Grup Baru</Text>
        <AppInput
          label="Nama Grup"
          variant="card"
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Diskusi Tim"
        />
        <Text style={styles.memberHeader}>Pilih Anggota ({selectedMembers.length}):</Text>
        <ScrollView style={styles.memberScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          <View style={styles.chipWrap}>
            {agents.map((ag) => {
              const picked = selectedMembers.includes(ag.id);
              return (
                <TouchableOpacity
                  key={ag.id}
                  style={[styles.chip, picked && styles.chipActive]}
                  onPress={() => toggleMember(ag.id)}>
                  <Text style={[styles.chipText, picked && styles.chipTextActive]}>{ag.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <AppButton label="Buat & Buka Obrolan" variant="magenta" loading={creating} onPress={handleCreate} />
      </InTreeBottomSheet>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  createBtn: { marginBottom: SPACING.lg },
  empty: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', marginTop: SPACING.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoCol: { flex: 1, marginLeft: SPACING.md },
  trashBtn: { padding: SPACING.xs, marginRight: SPACING.xs },
  name: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.bold },
  meta: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.bold, marginBottom: SPACING.md },
  memberHeader: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.bold, marginBottom: SPACING.sm },
  memberScroll: { maxHeight: 220, flexShrink: 1, marginBottom: SPACING.lg },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.brandMagenta },
  chipText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.medium },
  chipTextActive: { color: COLORS.textPrimary },
});

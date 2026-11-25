import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';
import Icon from '../ui/Icon';

export default function AkashPanel() {
  const akash = useStore((s) => s.providers.akash);
  const akashKeys = useStore((s) => s.providers.akashKeys);
  const loading = useStore((s) => s.providers.loading);
  const deployAkash = useStore((s) => s.providers.deployAkash);
  const stopAkash = useStore((s) => s.providers.stopAkash);
  const addAkashKey = useStore((s) => s.providers.addAkashKey);
  const rotateAkashKey = useStore((s) => s.providers.rotateAkashKey);
  const deleteAkashKey = useStore((s) => s.providers.deleteAkashKey);

  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddKey = async () => {
    if (!email.trim() || !apiKey.trim()) {
      Alert.alert('Input Kurang', 'Email dan Akash API key wajib diisi.');
      return;
    }
    setAdding(true);
    try {
      await addAkashKey(email.trim(), apiKey.trim());
      setEmail('');
      setApiKey('');
    } catch (err: unknown) {
      Alert.alert('Gagal Tambah Key', err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status Akash Deployment</Text>
        <Text style={styles.metaText}>
          Status: {akash?.deployed ? 'Deployed' : 'Idle'} • DSEQ: {akash?.dseq || '-'}
        </Text>
        <Text style={styles.metaText}>
          Active Key: {akash?.activeKey?.email || 'Tidak ada'}
          {akash?.activeKey?.balanceUsd != null ? ` ($${akash.activeKey.balanceUsd.toFixed(3)})` : ''}
        </Text>
        {akash?.url ? <Text style={styles.urlText}>{akash.url}</Text> : null}

        <View style={styles.btnRow}>
          <AppButton
            label={akash?.deployed ? 'Redeploy' : 'Deploy'}
            variant="magenta"
            loading={loading}
            onPress={() => deployAkash().catch((e) => Alert.alert('Deploy Gagal', String(e?.message || e)))}
            style={styles.flexBtn}
          />
          {akash?.deployed ? (
            <AppButton
              label="Stop"
              variant="danger"
              loading={loading}
              onPress={() => stopAkash().catch((e) => Alert.alert('Stop Gagal', String(e?.message || e)))}
              style={styles.flexBtn}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.keyHeader}>
          <Text style={styles.cardTitle}>Akash API Keys ({akashKeys.length})</Text>
          <TouchableOpacity onPress={() => rotateAkashKey().catch(() => {})}>
            <Icon name="refresh-cw" size={18} color={COLORS.brandPinkSoft} />
          </TouchableOpacity>
        </View>
        {akashKeys.map((k) => (
          <View key={k.id} style={styles.keyRow}>
            <View style={styles.keyInfo}>
              <Text style={styles.keyEmail}>{k.email}</Text>
              <Text style={styles.keyStatus}>Status: {k.status}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteAkashKey(k.id).catch(() => {})}>
              <Icon name="trash-2" size={18} color={COLORS.statusDangerAlt} />
            </TouchableOpacity>
          </View>
        ))}

        <AppInput
          label="Tambah Akash Key"
          variant="card"
          placeholder="Email akun Akash"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <AppInput
          variant="card"
          placeholder="ak_..."
          value={apiKey}
          onChangeText={setApiKey}
          autoCapitalize="none"
          secureTextEntry
        />
        <AppButton label="Simpan Key" variant="secondary" loading={adding} onPress={handleAddKey} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.bold, marginBottom: SPACING.sm },
  metaText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular, marginBottom: 4 },
  urlText: { color: COLORS.statusInfo, fontSize: 12, fontFamily: FONTS.mono, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  flexBtn: { flex: 1 },
  keyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: SPACING.sm,
  },
  keyInfo: { flex: 1, marginRight: SPACING.sm },
  keyEmail: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.medium },
  keyStatus: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.regular },
});

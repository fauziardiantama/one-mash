import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AgentDetailData } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';

interface AgentMetaSessionsCardProps {
  agentId: string;
  detail?: AgentDetailData;
  uploading: boolean;
  onOpenSession: (sessionKey: string) => void;
  onDeleteAvatar: () => void;
  onDeleteAgent: () => void;
}

function formatDate(ts?: number | null): string {
  if (!ts) return '-';
  try {
    return new Date(ts).toLocaleString('id-ID');
  } catch {
    return String(ts);
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value && value.trim() ? value : '-'}
      </Text>
    </View>
  );
}

export default function AgentMetaSessionsCard({
  agentId,
  detail,
  uploading,
  onOpenSession,
  onDeleteAvatar,
  onDeleteAgent,
}: AgentMetaSessionsCardProps) {
  const sessions = detail?.sessions ?? [];

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>RIWAYAT SESI AGEN ({sessions.length})</Text>
        {sessions.length === 0 ? (
          <Text style={styles.muted}>Belum ada sesi tercatat untuk agen ini.</Text>
        ) : (
          sessions.slice(0, 10).map((ses) => (
            <TouchableOpacity
              key={ses.key}
              activeOpacity={0.75}
              style={styles.sessionRow}
              onPress={() => onOpenSession(ses.key)}>
              <View style={styles.sessionMain}>
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {ses.title}
                </Text>
                <Text style={styles.sessionSub} numberOfLines={1}>
                  {ses.key} {ses.model ? `· ${ses.model}` : ''}
                </Text>
              </View>
              <Text style={styles.sessionOpen}>Buka</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>DATA BACKEND & KARAKTER</Text>
        <InfoRow
          label="Foto Profil"
          value={
            detail?.profilePicMeta
              ? `${detail.profilePicMeta.mimeType} (${detail.profilePicMeta.sizeBytes ?? '-'} bytes)`
              : 'Belum diunggah'
          }
        />
        {detail?.profilePicMeta?.sha256 ? (
          <InfoRow label="Avatar SHA256" value={detail.profilePicMeta.sha256} />
        ) : null}
        {detail?.characterMeta ? (
          <>
            <InfoRow label="Spec Kartu" value={detail.characterMeta.spec || 'chara_card_v2'} />
            <InfoRow label="Creator" value={detail.characterMeta.creator} />
            <InfoRow label="Versi Kartu" value={detail.characterMeta.characterVersion} />
            <InfoRow label="Card SHA256" value={detail.characterMeta.cardSha256} />
            <InfoRow label="Diimpor" value={formatDate(detail.characterMeta.createdAt)} />
          </>
        ) : null}
        {detail?.profilePicMeta ? (
          <AppButton
            label="Hapus Foto Profil"
            variant="secondary"
            loading={uploading}
            onPress={onDeleteAvatar}
            style={styles.actionGap}
          />
        ) : null}
        {agentId !== 'main' ? (
          <AppButton
            label={detail?.characterMeta ? 'Hapus Agen Karakter' : 'Hapus Agen OpenClaw'}
            variant="danger"
            onPress={onDeleteAgent}
            style={styles.actionGap}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.md },
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    color: COLORS.brandPinkSoft,
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  muted: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  sessionMain: { flex: 1, marginRight: SPACING.sm },
  sessionTitle: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.bold },
  sessionSub: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.mono, marginTop: 2 },
  sessionOpen: { color: COLORS.brandPinkSoft, fontSize: 12, fontFamily: FONTS.bold },
  infoRow: { paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  infoLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.medium },
  infoValue: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  actionGap: { marginTop: SPACING.md },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AgentSkillItem } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';

interface AgentSkillsCardProps {
  skills: AgentSkillItem[];
  skillsFilter: string[] | null;
  saving: boolean;
  onSaveFilter: (nextFilter: string[] | null) => Promise<void>;
}

function formatMissing(m?: AgentSkillItem['missing']): string {
  if (!m) return '';
  const parts: string[] = [];
  if (m.bins?.length) parts.push(`bin: ${m.bins.join(', ')}`);
  if (m.anyBins?.length) parts.push(`anyBin: ${m.anyBins.join('|')}`);
  if (m.env?.length) parts.push(`env: ${m.env.join(', ')}`);
  if (m.config?.length) parts.push(`cfg: ${m.config.join(', ')}`);
  if (m.os?.length) parts.push(`os: ${m.os.join(', ')}`);
  return parts.join(' · ');
}

export default function AgentSkillsCard({
  skills,
  skillsFilter,
  saving,
  onSaveFilter,
}: AgentSkillsCardProps) {
  const [useAllowlist, setUseAllowlist] = useState(skillsFilter !== null);
  const [selectedNames, setSelectedNames] = useState<string[]>(skillsFilter ?? []);
  const [query, setQuery] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(false);

  useEffect(() => {
    setUseAllowlist(skillsFilter !== null);
    setSelectedNames(skillsFilter ?? []);
  }, [skillsFilter]);

  const toggleSkill = (name: string) => {
    if (!useAllowlist) return;
    setSelectedNames((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  };

  const eligibleCount = skills.filter((s) => s.eligible && !s.disabled && !s.blockedByAllowlist).length;
  const q = query.trim().toLowerCase();
  const visible = skills.filter((s) => {
    if (onlyEligible && !s.eligible) return false;
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
  });

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        SKILLS AGEN ({eligibleCount} SIAP / {skills.length} TOTAL)
      </Text>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.chip, !useAllowlist && styles.chipActive]}
          onPress={() => setUseAllowlist(false)}>
          <Text style={[styles.chipText, !useAllowlist && styles.chipTextActive]}>Semua / Unrestricted</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, useAllowlist && styles.chipActive]}
          onPress={() => setUseAllowlist(true)}>
          <Text style={[styles.chipText, useAllowlist && styles.chipTextActive]}>
            Allowlist ({selectedNames.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, onlyEligible && styles.chipActive]}
          onPress={() => setOnlyEligible((v) => !v)}>
          <Text style={[styles.chipText, onlyEligible && styles.chipTextActive]}>Hanya Siap</Text>
        </TouchableOpacity>
      </View>

      <AppInput
        placeholder="Cari skill..."
        variant="card"
        autoCapitalize="none"
        value={query}
        onChangeText={setQuery}
      />

      {visible.length === 0 ? (
        <Text style={styles.muted}>Tidak ada skill yang cocok.</Text>
      ) : (
        visible.map((skill) => {
          const picked = useAllowlist && selectedNames.includes(skill.name);
          const missingStr = formatMissing(skill.missing);
          const ok = skill.eligible && !skill.disabled && !skill.blockedByAllowlist;
          return (
            <TouchableOpacity
              key={skill.name}
              activeOpacity={useAllowlist ? 0.75 : 1}
              onPress={() => toggleSkill(skill.name)}
              style={[styles.skillRow, picked && styles.skillRowPicked]}>
              <View style={styles.skillTop}>
                <Text style={styles.skillName}>
                  {skill.emoji ? `${skill.emoji} ` : ''}
                  {skill.name}
                </Text>
                <View style={[styles.badge, ok ? styles.badgeOk : styles.badgeWarn]}>
                  <Text style={[styles.badgeText, ok ? styles.badgeOkText : styles.badgeWarnText]}>
                    {skill.disabled ? 'Disabled' : skill.blockedByAllowlist ? 'Terblokir' : ok ? 'Siap' : 'Perlu Syarat'}
                  </Text>
                </View>
              </View>
              {skill.description ? (
                <Text style={styles.skillDesc} numberOfLines={2}>
                  {skill.description}
                </Text>
              ) : null}
              {missingStr ? <Text style={styles.missingText}>Kurang: {missingStr}</Text> : null}
            </TouchableOpacity>
          );
        })
      )}

      <View style={styles.saveWrap}>
        <AppButton
          label="Simpan Filter Skills"
          variant="magenta"
          loading={saving}
          onPress={() => onSaveFilter(useAllowlist ? selectedNames : null)}
        />
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
  cardTitle: {
    color: COLORS.brandPinkSoft,
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  chip: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: COLORS.surfaceControl, borderColor: COLORS.brandPinkSoft },
  chipText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.medium },
  chipTextActive: { color: COLORS.textPrimary, fontFamily: FONTS.bold },
  muted: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular },
  skillRow: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  skillRowPicked: { borderColor: COLORS.brandPinkSoft, backgroundColor: COLORS.surfaceControl },
  skillTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  skillName: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.bold, flex: 1 },
  badge: { borderRadius: RADII.sm, paddingHorizontal: 7, paddingVertical: 2 },
  badgeOk: { backgroundColor: COLORS.statusSuccessBg },
  badgeWarn: { backgroundColor: COLORS.statusWarningBg },
  badgeText: { fontSize: 10, fontFamily: FONTS.bold },
  badgeOkText: { color: COLORS.statusSuccess },
  badgeWarnText: { color: COLORS.statusWarning },
  skillDesc: { color: COLORS.textSoft, fontSize: 12, fontFamily: FONTS.regular, marginTop: 4 },
  missingText: { color: COLORS.statusWarning, fontSize: 11, fontFamily: FONTS.mono, marginTop: 4 },
  saveWrap: { marginTop: SPACING.md },
});

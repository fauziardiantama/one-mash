import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type {
  AgentEffectiveTools,
  AgentToolsCatalog,
  AgentToolsPolicyInput,
} from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';

type ToolMode = 'default' | 'allow' | 'alsoAllow' | 'deny';

interface AgentToolsCardProps {
  profile?: string;
  allow: string[] | null;
  alsoAllow: string[];
  deny: string[];
  effectiveTools: AgentEffectiveTools | null;
  catalog: AgentToolsCatalog | null;
  saving: boolean;
  onSave: (policy: AgentToolsPolicyInput) => Promise<void>;
}

export default function AgentToolsCard({
  profile,
  allow,
  alsoAllow,
  deny,
  effectiveTools,
  catalog,
  saving,
  onSave,
}: AgentToolsCardProps) {
  const [selectedProfile, setSelectedProfile] = useState(profile || '');
  const [strictAllowMode, setStrictAllowMode] = useState(allow !== null);
  const [allowList, setAllowList] = useState<string[]>(allow ?? []);
  const [alsoAllowList, setAlsoAllowList] = useState<string[]>(alsoAllow);
  const [denyList, setDenyList] = useState<string[]>(deny);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setSelectedProfile(profile || '');
    setStrictAllowMode(allow !== null);
    setAllowList(allow ?? []);
    setAlsoAllowList(alsoAllow);
    setDenyList(deny);
  }, [profile, allow, alsoAllow, deny]);

  const effectiveIds = useMemo(() => {
    const ids = new Set<string>();
    for (const g of effectiveTools?.groups ?? []) {
      for (const t of g.tools) ids.add(t.id);
    }
    return ids;
  }, [effectiveTools]);

  const getToolState = (toolId: string): ToolMode => {
    if (denyList.includes(toolId)) return 'deny';
    if (strictAllowMode && allowList.includes(toolId)) return 'allow';
    if (!strictAllowMode && alsoAllowList.includes(toolId)) return 'alsoAllow';
    return 'default';
  };

  const cycleToolState = (toolId: string) => {
    const cur = getToolState(toolId);
    const removeFromAll = () => {
      setAllowList((p) => p.filter((x) => x !== toolId));
      setAlsoAllowList((p) => p.filter((x) => x !== toolId));
      setDenyList((p) => p.filter((x) => x !== toolId));
    };
    removeFromAll();
    if (strictAllowMode) {
      if (cur === 'default') setAllowList((p) => [...p, toolId]);
      else if (cur === 'allow') setDenyList((p) => [...p, toolId]);
    } else {
      if (cur === 'default') setAlsoAllowList((p) => [...p, toolId]);
      else if (cur === 'alsoAllow') setDenyList((p) => [...p, toolId]);
    }
  };

  const handleSave = () =>
    onSave({
      profile: selectedProfile || null,
      allow: strictAllowMode ? allowList : null,
      alsoAllow: strictAllowMode ? null : alsoAllowList,
      deny: denyList,
    });

  const q = query.trim().toLowerCase();
  const filteredGroups = (catalog?.groups ?? [])
    .map((g) => ({
      ...g,
      tools: g.tools.filter(
        (t) =>
          !q ||
          t.id.toLowerCase().includes(q) ||
          t.label.toLowerCase().includes(q) ||
          g.label.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.tools.length > 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          TOOLS EFEKTIF {effectiveTools?.estimated ? '(ESTIMASI PROFIL)' : 'AKTIF'} ({effectiveIds.size} · PROFILE:{' '}
          {effectiveTools?.profile || 'default'})
        </Text>
        {effectiveIds.size === 0 ? (
          <Text style={styles.muted}>Agen ini saat ini tidak memiliki tool aktif.</Text>
        ) : (
          (effectiveTools?.groups ?? []).map((group) => (
            <View key={group.id} style={styles.groupBlock}>
              <Text style={styles.groupLabel}>
                {group.label} ({group.tools.length})
              </Text>
              <View style={styles.effWrap}>
                {group.tools.map((t) => (
                  <View key={t.id} style={styles.effPill}>
                    <Text style={styles.effText}>{t.id}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ATUR KEBIJAKAN TOOLS ({catalog?.groups?.length ?? 0} GRUP)</Text>

        <Text style={styles.subLabel}>Tool Profile Override</Text>
        <View style={styles.wrapRow}>
          {[{ id: '', label: 'Inherit' }, ...(catalog?.profiles ?? [])].map((prof) => {
            const active = selectedProfile === prof.id;
            return (
              <TouchableOpacity
                key={prof.id || '__inherit'}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedProfile(prof.id)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{prof.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.subLabel}>Mode Allowlist</Text>
        <View style={styles.wrapRow}>
          <TouchableOpacity
            style={[styles.chip, !strictAllowMode && styles.chipActive]}
            onPress={() => setStrictAllowMode(false)}>
            <Text style={[styles.chipText, !strictAllowMode && styles.chipTextActive]}>
              Ikuti Profile (+AlsoAllow / -Deny)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, strictAllowMode && styles.chipActive]}
            onPress={() => setStrictAllowMode(true)}>
            <Text style={[styles.chipText, strictAllowMode && styles.chipTextActive]}>
              Allowlist Ketat ({allowList.length})
            </Text>
          </TouchableOpacity>
        </View>

        <AppInput
          placeholder="Cari tool (exec, web_search, read, ...)"
          variant="card"
          autoCapitalize="none"
          value={query}
          onChangeText={setQuery}
        />

        <Text style={styles.hint}>
          Tap tool untuk ubah status: {strictAllowMode ? 'Default -> Allow -> Deny' : 'Default -> +Allow -> Deny'}
        </Text>

        {filteredGroups.map((group) => (
          <View key={group.id} style={styles.groupBlock}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.wrapRow}>
              {group.tools.map((tool) => {
                const mode = getToolState(tool.id);
                const isEff = effectiveIds.has(tool.id);
                return (
                  <TouchableOpacity
                    key={tool.id}
                    activeOpacity={0.75}
                    onPress={() => cycleToolState(tool.id)}
                    style={[
                      styles.toolBtn,
                      mode === 'allow' && styles.toolAllow,
                      mode === 'alsoAllow' && styles.toolAllow,
                      mode === 'deny' && styles.toolDeny,
                      mode === 'default' && isEff && styles.toolEffective,
                    ]}>
                    <Text
                      style={[
                        styles.toolBtnText,
                        (mode === 'allow' || mode === 'alsoAllow') && styles.toolAllowText,
                        mode === 'deny' && styles.toolDenyText,
                      ]}>
                      {mode === 'allow' ? '✓ ' : mode === 'alsoAllow' ? '+ ' : mode === 'deny' ? '✕ ' : ''}
                      {tool.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.saveRow}>
          <AppButton label="Simpan Kebijakan Tools" variant="magenta" loading={saving} onPress={handleSave} />
        </View>
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
  subLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.bold, marginBottom: 6, marginTop: SPACING.xs },
  hint: { color: COLORS.textDim, fontSize: 11, fontFamily: FONTS.regular, marginBottom: SPACING.md },
  muted: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  effWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  effPill: {
    backgroundColor: COLORS.statusSuccessBg,
    borderRadius: RADII.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  effText: { color: COLORS.statusSuccess, fontSize: 11, fontFamily: FONTS.mono },
  groupBlock: { marginBottom: SPACING.md },
  groupLabel: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.bold, marginBottom: 6 },
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
  toolBtn: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toolEffective: { borderColor: COLORS.statusInfo },
  toolAllow: { backgroundColor: COLORS.statusSuccessBg, borderColor: COLORS.statusSuccess },
  toolDeny: { backgroundColor: COLORS.statusDangerBg, borderColor: COLORS.statusDanger },
  toolBtnText: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.mono },
  toolAllowText: { color: COLORS.statusSuccess, fontFamily: FONTS.bold },
  toolDenyText: { color: COLORS.statusDangerAlt, fontFamily: FONTS.bold },
  saveRow: { marginTop: SPACING.md },
});

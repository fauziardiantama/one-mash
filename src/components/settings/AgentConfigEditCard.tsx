import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AgentConfigUpdateInput, AgentDetailData, AgentSummary, ModelOption } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';

const THINKING_LEVELS = ['', 'off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'adaptive'];
const VERBOSE_LEVELS = ['', 'off', 'on', 'full'];
const REASONING_LEVELS = ['', 'off', 'on', 'stream'];
const TYPING_MODES = ['', 'never', 'instant', 'thinking', 'message'];
const DELEGATION_MODES = ['', 'prefer', 'suggest'];

interface ChipSelectorProps {
  label: string;
  options: Array<{ value: string; text: string }>;
  selected: string;
  onSelect: (val: string) => void;
}

function ChipSelector({ label, options, selected, onSelect }: ChipSelectorProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value || '__default'}
              activeOpacity={0.75}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(opt.value)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.text}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

interface AgentConfigEditCardProps {
  agentId: string;
  detail?: AgentDetailData;
  summary?: AgentSummary;
  models: ModelOption[];
  allAgents: AgentSummary[];
  saving: boolean;
  onSave: (patch: AgentConfigUpdateInput) => Promise<void>;
}

export default function AgentConfigEditCard({
  agentId,
  detail,
  summary,
  models,
  allAgents,
  saving,
  onSave,
}: AgentConfigEditCardProps) {
  const s = detail?.summary ?? summary;
  const [name, setName] = useState(s?.name || agentId);
  const [description, setDescription] = useState(s?.description || '');
  const [emoji, setEmoji] = useState(s?.emoji || '');
  const [workspace, setWorkspace] = useState(s?.workspace || '');
  const [modelPrimary, setModelPrimary] = useState(s?.modelPrimary || '');
  const [modelFallbacks, setModelFallbacks] = useState<string[]>(s?.modelFallbacks || []);
  const [thinking, setThinking] = useState(s?.thinkingDefault || '');
  const [verbose, setVerbose] = useState(detail?.verboseDefault || s?.verboseDefault || '');
  const [reasoning, setReasoning] = useState(detail?.reasoningDefault || s?.reasoningDefault || '');
  const [typingMode, setTypingMode] = useState(detail?.typingMode || s?.typingMode || '');
  const [subagentsAllow, setSubagentsAllow] = useState<string[]>(detail?.subagentsAllow || []);
  const [delegationMode, setDelegationMode] = useState(detail?.subagentsDelegationMode || '');
  const [heartbeatEvery, setHeartbeatEvery] = useState(detail?.heartbeatEvery || s?.heartbeatEvery || '');

  useEffect(() => {
    setName(s?.name || agentId);
    setDescription(s?.description || '');
    setEmoji(s?.emoji || '');
    setWorkspace(s?.workspace || '');
    setModelPrimary(s?.modelPrimary || '');
    setModelFallbacks(s?.modelFallbacks || []);
    setThinking(s?.thinkingDefault || '');
    setVerbose(detail?.verboseDefault || s?.verboseDefault || '');
    setReasoning(detail?.reasoningDefault || s?.reasoningDefault || '');
    setTypingMode(detail?.typingMode || s?.typingMode || '');
    setSubagentsAllow(detail?.subagentsAllow || []);
    setDelegationMode(detail?.subagentsDelegationMode || '');
    setHeartbeatEvery(detail?.heartbeatEvery || s?.heartbeatEvery || '');
  }, [agentId, detail, s]);

  const toggleFallback = (ref: string) => {
    setModelFallbacks((prev) => (prev.includes(ref) ? prev.filter((x) => x !== ref) : [...prev, ref]));
  };

  const toggleSubagent = (target: string) => {
    if (target === '*') {
      setSubagentsAllow((prev) => (prev.includes('*') ? [] : ['*']));
      return;
    }
    setSubagentsAllow((prev) => {
      const cleaned = prev.filter((x) => x !== '*');
      return cleaned.includes(target) ? cleaned.filter((x) => x !== target) : [...cleaned, target];
    });
  };

  const handleSave = () =>
    onSave({
      name: name.trim() || agentId,
      description: description.trim() || null,
      emoji: emoji.trim() || null,
      workspace: workspace.trim() || null,
      modelPrimary: modelPrimary || null,
      modelFallbacks,
      thinkingDefault: thinking || null,
      verboseDefault: verbose || null,
      reasoningDefault: reasoning || null,
      typingMode: typingMode || null,
      subagentsAllow,
      subagentsDelegationMode: delegationMode || null,
      heartbeatEvery: heartbeatEvery.trim() || null,
    });

  const modelOptions = [
    { value: '', text: 'Inherit Default' },
    ...models.map((m) => ({ value: m.ref, text: m.name || m.ref })),
  ];

  const otherAgentTargets = ['*', ...allAgents.map((a) => a.id).filter((id) => id !== agentId)];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>IDENTITAS & KONFIGURASI OPENCLAW</Text>

      <AppInput label="Nama Agen" variant="card" value={name} onChangeText={setName} />
      <AppInput
        label="Deskripsi Agen"
        variant="card"
        multiline
        numberOfLines={2}
        placeholder="Deskripsi singkat fungsi agen..."
        value={description}
        onChangeText={setDescription}
      />
      <AppInput label="Emoji Identitas" variant="card" placeholder="🤖" value={emoji} onChangeText={setEmoji} />
      <AppInput
        label="Workspace Path"
        variant="card"
        autoCapitalize="none"
        value={workspace}
        onChangeText={setWorkspace}
      />

      <ChipSelector label="Primary Model" options={modelOptions} selected={modelPrimary} onSelect={setModelPrimary} />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Fallback Models ({modelFallbacks.length})</Text>
        <View style={styles.wrapRow}>
          {models.map((m) => {
            const active = modelFallbacks.includes(m.ref);
            return (
              <TouchableOpacity
                key={m.ref}
                activeOpacity={0.75}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleFallback(m.ref)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.name || m.ref}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ChipSelector
        label="Thinking Default"
        options={THINKING_LEVELS.map((v) => ({ value: v, text: v || 'Inherit' }))}
        selected={thinking}
        onSelect={setThinking}
      />
      <ChipSelector
        label="Verbose Default"
        options={VERBOSE_LEVELS.map((v) => ({ value: v, text: v || 'Inherit' }))}
        selected={verbose}
        onSelect={setVerbose}
      />
      <ChipSelector
        label="Reasoning Visibility"
        options={REASONING_LEVELS.map((v) => ({ value: v, text: v || 'Inherit' }))}
        selected={reasoning}
        onSelect={setReasoning}
      />
      <ChipSelector
        label="Typing Mode"
        options={TYPING_MODES.map((v) => ({ value: v, text: v || 'Inherit' }))}
        selected={typingMode}
        onSelect={setTypingMode}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Subagents Allowlist</Text>
        <View style={styles.wrapRow}>
          {otherAgentTargets.map((id) => {
            const active = subagentsAllow.includes(id);
            return (
              <TouchableOpacity
                key={id}
                activeOpacity={0.75}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleSubagent(id)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {id === '*' ? '* (Semua)' : `@${id}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ChipSelector
        label="Subagent Delegation Mode"
        options={DELEGATION_MODES.map((v) => ({ value: v, text: v || 'Default' }))}
        selected={delegationMode}
        onSelect={setDelegationMode}
      />

      <AppInput
        label="Heartbeat Interval (Opsional)"
        placeholder="Contoh: 30m atau kosongkan"
        autoCapitalize="none"
        variant="card"
        value={heartbeatEvery}
        onChangeText={setHeartbeatEvery}
      />

      <AppButton label="Simpan Konfigurasi" variant="magenta" loading={saving} onPress={handleSave} />
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
  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginBottom: 6,
    marginLeft: 4,
  },
  chipsScroll: { flexGrow: 0 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    marginRight: SPACING.xs,
  },
  chipActive: { backgroundColor: COLORS.surfaceControl, borderColor: COLORS.brandPinkSoft },
  chipText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.medium },
  chipTextActive: { color: COLORS.textPrimary, fontFamily: FONTS.bold },
});

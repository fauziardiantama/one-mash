import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AgentWorkspaceFile } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';

interface AgentWorkspaceFilesCardProps {
  files: AgentWorkspaceFile[];
  selectedName: string;
  fileLoading: boolean;
  savingFile: boolean;
  onSelectFile: (name: string) => void;
  onSaveFile: (name: string, content: string) => Promise<void>;
}

export default function AgentWorkspaceFilesCard({
  files,
  selectedName,
  fileLoading,
  savingFile,
  onSelectFile,
  onSaveFile,
}: AgentWorkspaceFilesCardProps) {
  const activeFile = files.find((f) => f.name === selectedName) ?? files[0];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setEditing(false);
    setDraft(activeFile?.content ?? '');
  }, [activeFile?.name, activeFile?.content]);

  const handleStartEdit = () => {
    setDraft(activeFile?.content ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!activeFile) return;
    try {
      await onSaveFile(activeFile.name, draft);
      setEditing(false);
    } catch (err: unknown) {
      Alert.alert('Gagal Menyimpan File', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>DOKUMEN OPENCLAW & WORKSPACE ({files.length})</Text>
      {files.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada dokumen workspace yang ditemukan.</Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
            {files.map((file) => {
              const active = activeFile?.name === file.name;
              return (
                <TouchableOpacity
                  key={file.name}
                  activeOpacity={0.75}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => onSelectFile(file.name)}>
                  <Text
                    style={[
                      styles.pillText,
                      active && styles.pillTextActive,
                      file.missing && styles.pillMissing,
                    ]}>
                    {file.name}
                    {file.missing ? ' (kosong)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {activeFile ? (
            <View style={styles.body}>
              <View style={styles.headerRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaText}>
                    Path: {activeFile.path || activeFile.name}
                    {typeof activeFile.size === 'number' ? ` · ${activeFile.size} bytes` : ''}
                  </Text>
                  {activeFile.hash ? (
                    <Text style={styles.hashText} numberOfLines={1}>
                      SHA256: {activeFile.hash}
                    </Text>
                  ) : null}
                </View>
                {!editing ? (
                  <TouchableOpacity style={styles.editBtn} onPress={handleStartEdit}>
                    <Text style={styles.editBtnText}>{activeFile.missing ? 'Buat' : 'Edit'}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {fileLoading && activeFile.content === undefined && !editing ? (
                <ActivityIndicator color={COLORS.brandPinkSoft} style={styles.loader} />
              ) : editing ? (
                <View style={styles.editorWrap}>
                  <AppInput
                    variant="mono"
                    multiline
                    numberOfLines={12}
                    style={styles.editorInput}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={`Isi dokumen ${activeFile.name}...`}
                  />
                  <View style={styles.editorActions}>
                    <AppButton
                      label="Batal"
                      variant="secondary"
                      onPress={() => setEditing(false)}
                      style={styles.flexBtn}
                    />
                    <AppButton
                      label="Simpan File"
                      variant="magenta"
                      loading={savingFile}
                      onPress={handleSave}
                      style={styles.flexBtn}
                    />
                  </View>
                </View>
              ) : activeFile.missing ? (
                <Text style={styles.emptyText}>
                  File {activeFile.name} belum dibuat pada workspace agen ini. Tekan Buat untuk menambahkan.
                </Text>
              ) : (
                <View style={styles.codeBox}>
                  <Text selectable style={styles.codeText}>
                    {activeFile.content ?? '(Klik tab file untuk memuat konten...)'}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </>
      )}
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
  tabRow: { flexGrow: 0, marginBottom: SPACING.md },
  pill: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.surfaceControl,
    borderColor: COLORS.brandPinkSoft,
  },
  pillText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.medium },
  pillTextActive: { color: COLORS.textPrimary, fontFamily: FONTS.bold },
  pillMissing: { opacity: 0.6 },
  body: { gap: SPACING.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  metaCol: { flex: 1 },
  metaText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.regular },
  hashText: { color: COLORS.textDim, fontSize: 11, fontFamily: FONTS.mono },
  editBtn: {
    backgroundColor: COLORS.surfaceControl,
    borderWidth: 1,
    borderColor: COLORS.brandPinkSoft,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  editBtnText: { color: COLORS.brandPinkSoft, fontSize: 12, fontFamily: FONTS.bold },
  editorWrap: { marginTop: SPACING.xs },
  editorInput: { minHeight: 220 },
  editorActions: { flexDirection: 'row', gap: SPACING.sm },
  flexBtn: { flex: 1 },
  loader: { marginVertical: SPACING.lg },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.regular, marginTop: SPACING.xs },
  codeBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  codeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.mono,
    lineHeight: 18,
  },
});

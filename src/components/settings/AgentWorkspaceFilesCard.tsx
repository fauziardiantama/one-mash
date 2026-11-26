import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AgentWorkspaceFile } from '../../store/types';
import { COLORS, FONTS, RADII, SPACING } from '../../theme';

interface AgentWorkspaceFilesCardProps {
  files: AgentWorkspaceFile[];
  selectedName: string;
  fileLoading: boolean;
  onSelectFile: (name: string) => void;
}

export default function AgentWorkspaceFilesCard({
  files,
  selectedName,
  fileLoading,
  onSelectFile,
}: AgentWorkspaceFilesCardProps) {
  const activeFile = files.find((f) => f.name === selectedName) ?? files[0];

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
              <Text style={styles.metaText}>
                Path: {activeFile.path || activeFile.name}
                {typeof activeFile.size === 'number' ? ` · ${activeFile.size} bytes` : ''}
              </Text>
              {activeFile.hash ? (
                <Text style={styles.hashText} numberOfLines={1}>
                  SHA256: {activeFile.hash}
                </Text>
              ) : null}

              {fileLoading && activeFile.content === undefined ? (
                <ActivityIndicator color={COLORS.brandPinkSoft} style={styles.loader} />
              ) : activeFile.missing ? (
                <Text style={styles.emptyText}>
                  File {activeFile.name} belum dibuat pada workspace agen ini.
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
  metaText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.regular },
  hashText: { color: COLORS.textDim, fontSize: 11, fontFamily: FONTS.mono },
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

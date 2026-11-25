import * as ImagePicker from 'expo-image-picker';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useStore } from '../../store';
import { COLORS, FONTS, RADII, SHADOWS, SPACING } from '../../theme';
import Icon from '../ui/Icon';

interface EditAvatarPopupProps {
  visible: boolean;
  onClose: () => void;
}

export default function EditAvatarPopup({ visible, onClose }: EditAvatarPopupProps) {
  const activeAgentId = useStore((s) => s.agents.activeAgentId);
  const profilePics = useStore((s) => s.agents.profilePics);
  const uploadAvatar = useStore((s) => s.agents.uploadAvatar);
  const removeAvatar = useStore((s) => s.agents.removeAvatar);

  if (!visible) return null;

  const hasCustomAvatar = Boolean(profilePics[activeAgentId]);

  const handlePickAvatar = async () => {
    onClose();
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      await uploadAvatar(activeAgentId, {
        uri: asset.uri,
        name: asset.fileName || `${activeAgentId}-avatar.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    } catch (err: unknown) {
      Alert.alert('Gagal Mengunggah Avatar', err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteAvatar = async () => {
    onClose();
    try {
      await removeAvatar(activeAgentId);
    } catch (err: unknown) {
      Alert.alert('Gagal Menghapus Avatar', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuCard}>
              <TouchableOpacity activeOpacity={0.7} style={styles.menuRow} onPress={handlePickAvatar}>
                <Icon name="user" size={18} color={COLORS.textPrimary} style={styles.menuIcon} />
                <Text style={styles.menuLabel}>Ubah avatar</Text>
              </TouchableOpacity>
              {hasCustomAvatar && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity activeOpacity={0.7} style={styles.menuRow} onPress={handleDeleteAvatar}>
                    <Icon name="trash-2" size={18} color={COLORS.statusDangerAlt} style={styles.menuIcon} />
                    <Text style={[styles.menuLabel, styles.dangerText]}>Hapus avatar</Text>
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.divider} />
              <TouchableOpacity activeOpacity={0.7} style={styles.menuRow} onPress={onClose}>
                <Icon name="type" size={18} color={COLORS.textPrimary} style={styles.menuIcon} />
                <Text style={styles.menuLabel}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayScrimLight,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 155,
  },
  menuCard: {
    width: 196,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    paddingVertical: SPACING.xs,
    ...SHADOWS.floating,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  menuIcon: {
    marginRight: SPACING.md,
  },
  menuLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  dangerText: {
    color: COLORS.statusDangerAlt,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.md,
  },
});

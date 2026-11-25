import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { buildProfilePicUrl } from '../../api/modules/agents';
import { useStore } from '../../store';
import { COLORS, FONTS, LAYOUT } from '../../theme';

interface AgentAvatarProps {
  agentId: string;
  name?: string;
  size?: number;
}

export default function AgentAvatar({
  agentId,
  name,
  size = LAYOUT.headerAvatarSize,
}: AgentAvatarProps) {
  const baseUrl = useStore((s) => s.connection.baseUrl);
  const picMeta = useStore((s) => s.agents.profilePics[agentId]);
  const [imgFailed, setImgFailed] = useState(false);

  const versionTag = picMeta?.sha256;
  const hasImageRecord = Boolean(picMeta);

  useEffect(() => {
    setImgFailed(false);
  }, [agentId, versionTag, baseUrl]);

  const letter = ((name || agentId || 'M').trim()[0] || 'M').toUpperCase();
  const radius = size / 2;
  const imageUri = hasImageRecord ? buildProfilePicUrl(agentId, versionTag) : null;

  if (imageUri && !imgFailed) {
    return (
      <Image
        source={{ uri: imageUri }}
        onError={() => setImgFailed(true)}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: radius },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}>
      <Text style={[styles.letter, { fontSize: Math.round(size * 0.41) }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.surfaceElevated,
  },
  fallback: {
    backgroundColor: COLORS.brandPinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: COLORS.textDark,
    fontFamily: FONTS.bold,
  },
});

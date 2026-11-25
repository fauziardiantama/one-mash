import { StyleProp, Text, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../../theme';

// Force Metro to bundle project-local Feather.ttf as assets_fonts_feather.ttf
// for direct React Native font fallback in Release APKs.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../../../assets/fonts/Feather.ttf');

export const FEATHER_GLYPHS = {
  menu: 61852,
  'message-circle': 61853,
  'file-text': 61804,
  zap: 61979,
  'check-square': 61741,
  grid: 61821,
  archive: 61707,
  settings: 61907,
  search: 61904,
  edit: 61791,
  camera: 61736,
  image: 61829,
  file: 61801,
  plus: 61888,
  'arrow-up': 61716,
  'arrow-down': 61708,
  'corner-up-left': 61774,
  mic: 61855,
  'chevron-left': 61743,
  'chevron-right': 61744,
  'credit-card': 61777,
  shield: 61910,
  'user-check': 61958,
  smartphone: 61921,
  bell: 61726,
  'pen-tool': 61876,
  lock: 61843,
  phone: 61878,
  x: 61974,
  'more-horizontal': 61864,
  'edit-2': 61792,
  user: 61957,
  users: 61962,
  'user-plus': 61960,
  type: 61951,
  list: 61841,
  clock: 61753,
  tv: 61948,
  check: 61739,
  globe: 61820,
  share: 61908,
  'more-vertical': 61865,
  'trash-2': 61942,
  'refresh-cw': 61896,
  cpu: 61776,
  upload: 61955,
  power: 61892,
  layers: 61835,
  square: 61924,
  sliders: 61920,
  activity: 61696,
  key: 61834,
} as const;

export type IconName = keyof typeof FEATHER_GLYPHS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export default function Icon({ name, size = 24, color = COLORS.textPrimary, style }: IconProps) {
  const code = FEATHER_GLYPHS[name];
  if (code == null) return null;
  return (
    <Text style={[{ fontFamily: FONTS.feather, fontSize: size, color }, style]}>
      {String.fromCharCode(code)}
    </Text>
  );
}

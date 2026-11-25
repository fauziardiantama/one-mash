import { COLORS } from './colors';
import { FONTS } from './typography';

export const CHAT_MARKDOWN_STYLE = {
  text: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.regular },
  textgroup: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.regular },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  heading1: { color: COLORS.textPrimary, fontSize: 32, fontFamily: FONTS.regular },
  heading2: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.regular },
  heading3: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONTS.regular },
  heading4: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.regular },
  heading5: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.regular },
  heading6: { color: COLORS.textPrimary, fontSize: 11, fontFamily: FONTS.regular },
  link: { color: COLORS.textPrimary, textDecorationLine: 'underline' as const },
};

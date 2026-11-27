import { forwardRef } from 'react';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

/** Wrapper ScrollView aware terhadap tinggi keyboard dengan preset perilaku seragam. */
const KeyboardScrollView = forwardRef<KeyboardAwareScrollViewRef, KeyboardAwareScrollViewProps>(
  (
    {
      bottomOffset = 48,
      extraKeyboardSpace = 16,
      keyboardShouldPersistTaps = 'handled',
      keyboardDismissMode = 'on-drag',
      ...rest
    },
    ref,
  ) => (
    <KeyboardAwareScrollView
      ref={ref}
      bottomOffset={bottomOffset}
      extraKeyboardSpace={extraKeyboardSpace}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      {...rest}
    />
  ),
);

KeyboardScrollView.displayName = 'KeyboardScrollView';

export default KeyboardScrollView;

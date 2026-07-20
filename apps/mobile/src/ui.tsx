import type { ReactNode } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  useColorScheme,
} from 'react-native';

import { useMobileStore } from './store';

export const usePalette = () => {
  const { state } = useMobileStore();
  const system = useColorScheme();
  const dark = state?.settings.theme === 'dark' || (state?.settings.theme === 'system' && system === 'dark');
  return dark
    ? {
        background: '#0c1220',
        surface: '#171f30',
        text: '#f6f8ff',
        muted: '#aeb9ce',
        border: '#34425d',
        accent: '#82b1ff',
        danger: '#ff8a80',
        testnet: '#ffd54f',
      }
    : {
        background: '#f6f8fc',
        surface: '#ffffff',
        text: '#14213d',
        muted: '#52627b',
        border: '#c8d0de',
        accent: '#1e5aae',
        danger: '#b3261e',
        testnet: '#7a5700',
      };
};

export const Screen = ({ children, title }: { readonly children: ReactNode; readonly title?: string }) => {
  const colors = usePalette();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        {title ? (
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

export const TestnetBanner = ({ text }: { readonly text: string }) => {
  const colors = usePalette();
  return (
    <View accessibilityRole="alert" style={[styles.banner, { borderColor: colors.testnet }]}>
      <Text style={[styles.bannerText, { color: colors.testnet }]}>{text}</Text>
    </View>
  );
};

export const Card = ({ children }: { readonly children: ReactNode }) => {
  const colors = usePalette();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
};

export const Body = ({
  children,
  muted = false,
  selectable = false,
}: {
  readonly children: ReactNode;
  readonly muted?: boolean;
  readonly selectable?: boolean;
}) => {
  const colors = usePalette();
  return (
    <Text selectable={selectable} style={[styles.body, { color: muted ? colors.muted : colors.text }]}>
      {children}
    </Text>
  );
};

export const Field = (props: TextInputProps) => {
  const colors = usePalette();
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.muted}
      style={[
        styles.field,
        { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
        props.style,
      ]}
    />
  );
};

export const Button = ({
  children,
  onPress,
  disabled = false,
  danger = false,
}: {
  readonly children: ReactNode;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly danger?: boolean;
}) => {
  const colors = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: danger ? colors.danger : colors.accent, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
};

export const LinkButton = ({ children, onPress }: { readonly children: ReactNode; readonly onPress: () => void }) => {
  const colors = usePalette();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
      <Text style={[styles.linkText, { color: colors.accent }]}>{children}</Text>
    </Pressable>
  );
};

export const Row = ({ children }: { readonly children: ReactNode }) => <View style={styles.row}>{children}</View>;

export const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { padding: 20, gap: 14, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', marginVertical: 8 },
  banner: { borderWidth: 2, borderRadius: 8, padding: 10, alignItems: 'center' },
  bannerText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  body: { fontSize: 16, lineHeight: 23 },
  field: { borderWidth: 1, borderRadius: 10, minHeight: 50, paddingHorizontal: 12, fontSize: 16 },
  button: {
    minHeight: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { paddingVertical: 10 },
  linkText: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
});

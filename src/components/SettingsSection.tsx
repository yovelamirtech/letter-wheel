import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { FONTS } from '../utils/fonts';

interface Props {
  title: string;
  children: React.ReactNode;
}

// כותרת מקטע + הכרטיס שמתחתיה במסך ההגדרות (סאונד, משוב, עזרה, מידע...).
export default function SettingsSection({ title, children }: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 28,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
});

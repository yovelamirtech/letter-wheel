import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { FONTS } from '../utils/fonts';

interface Props {
  label: string;
  onPress?: () => void;
  // תוכן בצד ימין של השורה (Toggle, למשל). כשיש onPress ואין right, מוצג
  // שברון ('‹') כברירת מחדל - מרמז שהשורה לחיצה.
  right?: React.ReactNode;
}

export default function SettingsRow({ label, onPress, right }: Props) {
  const content = right ?? (onPress ? <Text style={styles.chevron}>‹</Text> : null);
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      {content}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowLabel: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: colors.text,
    writingDirection: 'rtl',
  },
  chevron: {
    fontSize: 18,
    color: colors.textFaint,
  },
});

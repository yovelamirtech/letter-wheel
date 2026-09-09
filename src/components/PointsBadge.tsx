import React from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  value: number | string;
  textStyle?: TextStyle | TextStyle[];
  iconSize?: number;
  iconColor?: string;
}

// תג הנקודות המשותף לכל המסכים - טקסט הניקוד + אייקון יהלום וקטורי
// לצדו (Ionicons), במקום אימוג'י מוטמע בתוך המחרוזת עצמה.
export default function PointsBadge({ value, textStyle, iconSize = 14, iconColor }: Props) {
  return (
    <View style={styles.row}>
      <Text style={textStyle}>{value}</Text>
      <Ionicons name="diamond-outline" size={iconSize} color={iconColor ?? colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
});

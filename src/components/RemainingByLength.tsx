import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../utils/fonts';
import { colors } from '../theme/colors';
import { RemainingGroup } from '../hooks/useRemainingByLength';

// ריבוע קטן שמייצג אות אחת. מספיק גדול כדי שאפשר יהיה לספור ריבועים
// במבט חטוף, ומספיק קטן כדי שהרמז לא יתחרה בגלגל על תשומת הלב.
const SQUARE_SIZE = 6;
const SQUARE_GAP = 2;

interface Props {
  groups: RemainingGroup[];
}

/**
 * רמז מינימלי: כמה מילים נשארו למצוא בכל אורך.
 * אורך המילה מיוצג בריבועים (אות = ריבוע) במקום בספרה, כדי שהשורה
 * תיקרא כ"צורת מילה" ולא כשני מספרים זה לצד זה.
 */
export default function RemainingByLength({ groups }: Props) {
  if (groups.length === 0) return null;

  return (
    <View style={styles.container}>
      {groups.map((group) => (
        <View key={group.length} style={styles.group}>
          <View style={styles.squares}>
            {Array.from({ length: group.length }, (_, i) => (
              <View key={i} style={styles.square} />
            ))}
          </View>
          <Text style={styles.count}>×{group.remaining}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // הקבוצות נפרסות לרוחב, מהקצרה בימין לארוכה בשמאל (row-reverse, ככיוון
  // הקריאה של שאר המסך), ועוטפות לשורה נוספת כשנגמר הרוחב שההורה נתן.
  // כך הבלוק מתפרס לרוחב במקום להתארך למטה ולדחוף את רשימת המילים.
  container: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    columnGap: 8,
    rowGap: 3,
  },
  group: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  squares: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SQUARE_GAP,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 2,
    backgroundColor: colors.lineTrail,
  },
  count: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textFaint,
  },
});

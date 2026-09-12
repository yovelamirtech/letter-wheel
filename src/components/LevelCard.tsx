import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Level } from '../types';
import { colors } from '../theme/colors';
import { FONTS } from '../utils/fonts';
import { tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import PointsBadge from './PointsBadge';

interface Props {
  level: Level;
  unlocked: boolean;
  foundCount: number;
  onPress: (level: Level) => void;
}

// כרטיס שלב ברשימת השלבים: נעול (מנעול + עלות בנקודות) או פתוח (אותיות
// השלב + כמה מילים כבר נמצאו, עם כוכב אם הושלם).
export default function LevelCard({ level, unlocked, foundCount, onPress }: Props) {
  if (!unlocked) {
    // כרטיס נעול: תצוגה ממורכזת - מנעול באמצע, ומתחתיו רק
    // המספר הנדרש + אייקון הנקודות. בלי "דורש X נקודות".
    return (
      <TouchableOpacity style={[styles.card, styles.cardLocked]} disabled activeOpacity={1}>
        <Ionicons name="lock-closed-outline" size={22} color={colors.textFaint} style={styles.lockIconCentered} />
        <PointsBadge value={level.requiredScore} textStyle={styles.lockedCost} />
      </TouchableOpacity>
    );
  }

  const completed = foundCount >= level.wordCount;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        tapHaptic();
        playClickSound();
        onPress(level);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardRight}>
        <View style={styles.letterRow}>
          {level.letters.map((char, i) => (
            <View key={i} style={styles.letterBadge}>
              <Text style={styles.letterBadgeText}>{char}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.cardLeft}>
        {completed && <Ionicons name="star" size={16} color={colors.accentDeep} style={styles.completedBadge} />}
        <Text style={styles.progressText}>
          {foundCount}/{level.wordCount}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    minHeight: 76,
  },
  cardLocked: {
    backgroundColor: colors.cardLocked,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardLeft: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  letterRow: {
    flexDirection: 'row-reverse',
    marginTop: 6,
    gap: 6,
  },
  letterBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: colors.text,
  },
  lockIconCentered: {
    marginBottom: 4,
  },
  lockedCost: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: colors.textFaint,
    writingDirection: 'rtl',
  },
  progressText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  completedBadge: {
    marginBottom: 2,
  },
});

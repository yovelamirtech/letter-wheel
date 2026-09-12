import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoundWord } from '../types';
import { colors } from '../theme/colors';
import { FONTS } from '../utils/fonts';
import { MAX_CONTENT_WIDTH } from '../utils/responsive';
import PointsBadge from './PointsBadge';

interface Props {
  // מילים שנמצאו, בסדר תצוגה (בד"כ האחרונה שנוחשה למעלה)
  foundWords: FoundWord[];
}

// רשימת המילים שנמצאו במשחק, מוצמדת לתחתית המסך.
export default function FoundWordsList({ foundWords }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.list}>
        {foundWords.map((fw) => (
          <View key={fw.word} style={styles.row}>
            <View style={styles.wordRow}>
              <Text style={styles.wordText}>{fw.word}</Text>
              {fw.isPangram && <Ionicons name="star" size={14} color={colors.accentDeep} />}
            </View>
            <PointsBadge value={`+${fw.score}`} textStyle={styles.scoreText} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  wordRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  wordText: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: colors.text,
    writingDirection: 'rtl',
  },
  scoreText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: colors.textMuted,
  },
});

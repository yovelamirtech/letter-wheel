import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Level, StoredProgress } from '../types';
import { getFoundWordsForLevel } from '../utils/progress';
import { FONTS } from '../utils/fonts';
import { colors } from '../theme/colors';
import { isLevelUnlocked } from '../data/levels';
import { HEADER_ICON_SIZE, HEADER_INSET, headerIconStyles } from '../utils/ui';
import { tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import { MAX_CONTENT_WIDTH } from '../utils/responsive';
import PointsBadge from '../components/PointsBadge';

interface Props {
  levels: Level[];
  progress: StoredProgress;
  onSelectLevel: (level: Level) => void;
  onBackToSplash: () => void;
  onOpenSettings: () => void;
}

export default function LevelSelectScreen({
  levels,
  progress,
  onSelectLevel,
  onBackToSplash,
  onOpenSettings,
}: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            tapHaptic();
            playClickSound();
            onBackToSplash();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="home-outline" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>שלבים</Text>
        {/* גלגל ההגדרות יושב בפינה השמאלית העליונה בכל מסכי האפליקציה */}
        <View style={styles.headerLeft}>
          <PointsBadge value={progress.totalScore} textStyle={styles.totalScore} />
          <TouchableOpacity
            style={headerIconStyles.button}
            onPress={() => {
              tapHaptic();
              playClickSound();
              onOpenSettings();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="settings-outline" size={HEADER_ICON_SIZE} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={levels}
        keyExtractor={(item) => String(item.index)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const unlocked = isLevelUnlocked(item, progress.totalScore);
          const foundCount = getFoundWordsForLevel(progress, item.index).length;
          const completed = foundCount >= item.wordCount;

          if (!unlocked) {
            // כרטיס נעול: תצוגה ממורכזת - מנעול באמצע, ומתחתיו רק
            // המספר הנדרש + אייקון הנקודות. בלי "דורש X נקודות".
            return (
              <TouchableOpacity style={[styles.card, styles.cardLocked]} disabled activeOpacity={1}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={colors.textFaint}
                  style={styles.lockIconCentered}
                />
                <PointsBadge value={item.requiredScore} textStyle={styles.lockedCost} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                tapHaptic();
                playClickSound();
                onSelectLevel(item);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.cardRight}>
                <View style={styles.letterRow}>
                  {item.letters.map((char, i) => (
                    <View key={i} style={styles.letterBadge}>
                      <Text style={styles.letterBadgeText}>{char}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.cardLeft}>
                {completed && (
                  <Ionicons name="star" size={16} color={colors.accentDeep} style={styles.completedBadge} />
                )}
                <Text style={styles.progressText}>
                  {foundCount}/{item.wordCount}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: HEADER_INSET,
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: '#3A2E1F',
    writingDirection: 'rtl',
  },
  totalScore: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: '#7A6A52',
    writingDirection: 'rtl',
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  list: {
    width: '100%',
    alignSelf: 'center',
  },
  listContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F4C542',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    minHeight: 76,
  },
  cardLocked: {
    backgroundColor: '#EDE0C8',
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
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#3A2E1F',
  },
  lockIconCentered: {
    marginBottom: 4,
  },
  lockedCost: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#9C8B6F',
    writingDirection: 'rtl',
  },
  progressText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#5B4A32',
  },
  completedBadge: {
    marginBottom: 2,
  },
});

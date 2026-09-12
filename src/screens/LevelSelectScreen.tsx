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
import LevelCard from '../components/LevelCard';

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
        renderItem={({ item }) => (
          <LevelCard
            level={item}
            unlocked={isLevelUnlocked(item, progress.totalScore)}
            foundCount={getFoundWordsForLevel(progress, item.index).length}
            onPress={onSelectLevel}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
    writingDirection: 'rtl',
  },
  totalScore: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: colors.textMuted,
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
});

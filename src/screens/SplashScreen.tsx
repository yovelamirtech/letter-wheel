import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import { HEADER_ICON_SIZE, HEADER_INSET, HEADER_TOP, headerIconStyles } from '../utils/ui';
import { FONTS } from '../utils/fonts';
import { colors } from '../theme/colors';

interface Props {
  onStart: () => void;
  onOpenSettings: () => void;
}

export default function SplashScreen({ onStart, onOpenSettings }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity
        style={[headerIconStyles.button, styles.settingsButton]}
        onPress={() => {
          tapHaptic();
          playClickSound();
          onOpenSettings();
        }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="settings-outline" size={HEADER_ICON_SIZE} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.iconDecor}>
        <View style={styles.glowOuter} />
        <View style={styles.glowInner} />
        <View style={[styles.accentDot, styles.accentDotTopLeft]} />
        <View style={[styles.accentDot, styles.accentDotTopRight]} />
        <View style={[styles.accentDot, styles.accentDotBottomLeft]} />
        <View style={[styles.accentDot, styles.accentDotBottomRight]} />
        <View style={[styles.accentDot, styles.accentDotRight]} />
        <Image
          source={require('../../assets/splash-icon.png')}
          style={styles.iconImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>מעגל אותיות</Text>
      <Text style={styles.subtitle}>הרכיבו כמה שיותר מילים מהאותיות שבמעגל</Text>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => {
          tapHaptic();
          playClickSound();
          onStart();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>בואו נתחיל</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  // המידות מגיעות מ-headerIconStyles; כאן רק העיגון לפינה
  settingsButton: {
    position: 'absolute',
    top: HEADER_TOP,
    left: HEADER_INSET,
  },
  iconDecor: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  glowOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F7C948',
    opacity: 0.16,
  },
  glowInner: {
    position: 'absolute',
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: '#F7C948',
    opacity: 0.25,
  },
  accentDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  accentDotTopLeft: {
    width: 16,
    height: 16,
    top: 14,
    left: 22,
    backgroundColor: '#C9891B',
    opacity: 0.7,
  },
  accentDotTopRight: {
    width: 12,
    height: 12,
    top: 30,
    right: 10,
    backgroundColor: '#3A2E1F',
    opacity: 0.3,
  },
  accentDotBottomLeft: {
    width: 12,
    height: 12,
    bottom: 20,
    left: 6,
    backgroundColor: '#3A2E1F',
    opacity: 0.3,
  },
  accentDotBottomRight: {
    width: 18,
    height: 18,
    bottom: 8,
    right: 26,
    backgroundColor: '#C9891B',
    opacity: 0.7,
  },
  accentDotRight: {
    width: 9,
    height: 9,
    top: '48%',
    right: -4,
    backgroundColor: '#F7C948',
    opacity: 0.9,
  },
  iconImage: {
    width: 150,
    height: 150,
  },
  title: {
    // Secular One כבר מגיע במשקל כבד, ולכן אין כאן fontWeight - הוספת
    // משקל על פונט מותאם גורמת ל-Android לזייף הדגשה ולעוות את האותיות.
    fontFamily: FONTS.display,
    fontSize: 40,
    color: '#3A2E1F',
    letterSpacing: 1,
    lineHeight: 52,
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#7A6A52',
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#3A2E1F',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 28,
  },
  startButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#FFF8E7',
    writingDirection: 'rtl',
  },
});

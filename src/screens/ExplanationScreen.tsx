import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import { FONTS } from '../utils/fonts';
import { MAX_CONTENT_WIDTH } from '../utils/responsive';
import { colors } from '../theme/colors';

interface Props {
  onDone: () => void;
}

const INSTRUCTION_ICON_SIZE = 18;

function InstructionRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.instructionRow}>
      <Ionicons name={icon} size={INSTRUCTION_ICON_SIZE} color={colors.text} style={styles.instructionIcon} />
      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

export default function ExplanationScreen({ onDone }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>איך משחקים</Text>

      <View style={styles.instructionBox}>
        <InstructionRow
          icon="text-outline"
          text="גררו אצבע בין האותיות במעגל בלי להרים, כדי לבנות מילה."
        />
        <InstructionRow
          icon="hand-left-outline"
          text="ההגשה קורית אוטומטית ברגע שמרימים את האצבע - אין כפתור אישור."
        />
        <InstructionRow
          icon="diamond-outline"
          text="כל מילה שווה נקודות לפי אורכה, ובונוס גדול למילה שמשתמשת בכל האותיות במעגל."
        />
      </View>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => {
          tapHaptic();
          playClickSound();
          onDone();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.doneButtonText}>הבנתי, בואו נתחיל</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: colors.text,
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  instructionBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 36,
    gap: 14,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  instructionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
  },
  instructionIcon: {
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 21,
  },
  doneButton: {
    backgroundColor: colors.text,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 28,
  },
  doneButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: colors.background,
    writingDirection: 'rtl',
  },
});

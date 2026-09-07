import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import { FONTS } from '../utils/fonts';
import { MAX_CONTENT_WIDTH } from '../utils/responsive';

interface Props {
  onDone: () => void;
}

export default function ExplanationScreen({ onDone }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>איך משחקים</Text>

      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>
          🔤 גררו אצבע בין האותיות במעגל בלי להרים, כדי לבנות מילה.
        </Text>
        <Text style={styles.instructionText}>
          ✋ ההגשה קורית אוטומטית ברגע שמרימים את האצבע - אין כפתור אישור.
        </Text>
        <Text style={styles.instructionText}>
          💎 כל מילה שווה נקודות לפי אורכה, ובונוס גדול למילה שמשתמשת
          בכל האותיות במעגל.
        </Text>
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
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: '#3A2E1F',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  instructionBox: {
    backgroundColor: '#F4E9D0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 36,
    gap: 14,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  instructionText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#5B4A32',
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 21,
  },
  doneButton: {
    backgroundColor: '#3A2E1F',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 28,
  },
  doneButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#FFF8E7',
    writingDirection: 'rtl',
  },
});

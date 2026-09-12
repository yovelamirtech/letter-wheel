import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { playClickSound } from '../utils/sound';

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const TOGGLE_TRAVEL = 20; // מרחק ההחלקה של הכפתור בפיקסלים: רוחב המסילה (50) פחות הכפתור (24) פחות הריפוד משני הצדדים (3+3)

// מתג מותאם אישית במקום ה-Switch המובנה של react-native: על אנדרואיד/web
// ה-Switch המובנה מתעלם לפעמים מ-trackColor ומציג את צבע ה-accent הירוק
// של המערכת. הגרסה הזו בנויה מ-Animated.View כדי גם לשלוט בצבעים וגם
// להחליק את הכפתור בין המצבים במקום לקפוץ ביניהם.
export default function Toggle({ value, onValueChange }: Props) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackBackground = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.accentBorder, colors.card],
  });
  const thumbBackground = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.text],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOGGLE_TRAVEL],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        // הסדר חשוב: קודם לעדכן את הערך (שיכול לכבות/להדליק את הסאונד עצמו),
        // ורק אז לנגן את הצליל - כך שכיבוי המתג לא ישמיע צליל, והדלקתו כן.
        onValueChange(!value);
        playClickSound();
      }}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackBackground }]}>
        <Animated.View style={[styles.thumb, { backgroundColor: thumbBackground, transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});

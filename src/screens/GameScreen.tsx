import React, { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ALL_WORDS } from '../data/dictionary';
import { buildDictionarySet } from '../utils/wordValidator';
import { restoreState, submitWord } from '../utils/gameLogic';
import { FONTS } from '../utils/fonts';
import { colors } from '../theme/colors';
import { HEADER_ICON_SIZE, HEADER_INSET, headerIconStyles } from '../utils/ui';
import PointsBadge from '../components/PointsBadge';
import ReportModal from '../components/ReportModal';
import LetterCircle from '../components/LetterCircle';
import FoundWordsList from '../components/FoundWordsList';
import { toFinalFormAtEnd } from '../utils/hebrewLetters';
import { errorHaptic, successHaptic, tapHaptic } from '../utils/haptics';
import { playClickSound, playCorrectSound, playDuplicateSound, playIncorrectSound } from '../utils/sound';
import { GameState, Level } from '../types';
import { useRemainingByLength } from '../hooks/useRemainingByLength';
import { useReportForm } from '../hooks/useReportForm';
import { useLetterCircle } from '../hooks/useLetterCircle';
import RemainingByLength from '../components/RemainingByLength';
import { MAX_CONTENT_WIDTH, useCircleSize } from '../utils/responsive';

// יחס גודל האריח מתוך גודל המעגל - נשמר קבוע כדי שהאריחים יגדלו/יקטנו
// יחסית למעגל עצמו (שמשתנה לפי גודל המסך, ר' useCircleSize).
const TILE_SIZE_RATIO = 56 / 260;

interface Props {
  level: Level;
  initialFoundWords: string[]; // מילים שנמצאו בעבר בשלב הזה (מ-AsyncStorage)
  onWordFound: (word: string, scoreGained: number) => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

export default function GameScreen({
  level,
  initialFoundWords,
  onWordFound,
  onBack,
  onOpenSettings,
}: Props) {
  const puzzle = useMemo(() => ({ letters: level.letters }), [level]);
  // המילון: נטען פעם אחת בעליית המסך.
  const dictionary = useMemo(() => buildDictionarySet(ALL_WORDS), []);

  // גודל המעגל מחושב מחדש בכל שינוי מידות המסך (למשל סיבוב אייפד או
  // Split View), כדי שהמעגל ימלא את השטח הזמין בלי להיות זעיר על מסך גדול.
  const CIRCLE_SIZE = useCircleSize();

  const [state, setState] = useState<GameState>(() => restoreState(puzzle, initialFoundWords));
  const [feedback, setFeedback] = useState<{ score: number; isPangram: boolean } | null>(null);

  // דיווח על מילה שגויה - נשלח ל-Web3Forms ומגיע למייל של הצוות
  const wordReport = useReportForm({
    fromName: 'גלגל המילים - מילה',
    buildSubject: (word) => `דיווח על מילה שגויה: ${word}`,
    buildFields: (word, meaning) => ({
      'המילה': word,
      'הפירוש': meaning || 'לא צורף פירוש',
      'שלב': String(level.index + 1),
      'אותיות השלב': level.letters.join(' '),
    }),
  });

  // אנימציית סמל הפידבק (X למילה לא מזוהה, סמל רענון למילה שכבר נמצאה) - "פועם"
  // (גדל-קטן) ואז נעלם. שני המקרים חולקים את אותה אנימציה, רק הסמל/הצבע משתנה.
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [symbolFeedback, setSymbolFeedback] = useState<'invalid' | 'duplicate' | null>(null);

  function triggerSymbolFeedback(kind: 'invalid' | 'duplicate') {
    setSymbolFeedback(kind);
    feedbackScale.setValue(1);
    feedbackOpacity.setValue(1);
    Animated.sequence([
      Animated.timing(feedbackScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(feedbackScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.delay(120),
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setSymbolFeedback(null));
  }

  const stateRef = useRef(state);
  stateRef.current = state;

  function handleWordSubmitted(rawWord: string) {
    const word = toFinalFormAtEnd(rawWord);
    const result = submitWord({ ...stateRef.current, currentInput: word }, dictionary);
    setState(result.state);

    if (result.success) {
      successHaptic();
      playCorrectSound();
      const newFoundWord = result.state.foundWords[result.state.foundWords.length - 1];
      setFeedback({ score: newFoundWord.score, isPangram: newFoundWord.isPangram });
      onWordFound(newFoundWord.word, newFoundWord.score);
    } else {
      errorHaptic();
      const isDuplicate = result.reason === 'already_found';
      if (isDuplicate) {
        playDuplicateSound();
      } else {
        playIncorrectSound();
      }
      setFeedback(null);
      triggerSymbolFeedback(isDuplicate ? 'duplicate' : 'invalid');
    }
  }

  const { tileSize, tiles, selectedPath, dragPoint, tileScales, tileOffsets, panHandlers, shuffleLetters } =
    useLetterCircle({
      letters: level.letters,
      circleSize: CIRCLE_SIZE,
      tileSizeRatio: TILE_SIZE_RATIO,
      onWordSubmitted: handleWordSubmitted,
      onSelectionStart: () => {
        setFeedback(null);
        // מתחילים מילה חדשה - מבטלים מיד את אנימציית הסמל אם היא עדיין
        // רצה, כדי שהיא לא "תתקע" ותחסום את תצוגת המילה החדשה
        feedbackScale.stopAnimation();
        feedbackOpacity.stopAnimation();
        setSymbolFeedback(null);
      },
    });

  // רשימת המילים שנמצאו כמחרוזות בלבד - מזהה יציב לחישוב ה"נשארו",
  // כדי שהוא לא ירוץ מחדש בכל רינדור של גרירה (foundWords הוא מערך חדש
  // רק כשבאמת נמצאה מילה, אבל כאן זה מפורש).
  const foundWordStrings = useMemo(
    () => state.foundWords.map((fw) => fw.word),
    [state.foundWords]
  );
  const remainingByLength = useRemainingByLength(level.letters, foundWordStrings);

  // תצוגת המילים שנמצאו לפי סדר הניחוש ההפוך - האחרונה שנוחשה מופיעה למעלה.
  const foundWordsNewestFirst = useMemo(
    () => [...state.foundWords].reverse(),
    [state.foundWords]
  );

  const liveWord = selectedPath.map((t) => t.char).join('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              tapHaptic();
              playClickSound();
              onBack();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backButton}>‹ שלבים</Text>
          </TouchableOpacity>
          {/* הסדר כאן הוא row-reverse: הילד הראשון מופיע הכי ימינה.
              גלגל ההגדרות אחרון, כדי שיישב בפינה השמאלית העליונה
              באותו מקום שבו הוא מופיע בשאר המסכים. */}
          <View style={styles.headerLeft}>
            <PointsBadge value={state.totalScore} textStyle={styles.score} iconSize={HEADER_ICON_SIZE} />
            <TouchableOpacity
              style={headerIconStyles.button}
              onPress={wordReport.open}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="flag-outline" size={HEADER_ICON_SIZE} color={colors.text} />
            </TouchableOpacity>
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
        <Text style={styles.levelLabel}>
          {state.foundWords.length}/{level.wordCount} מילים
        </Text>

        {/* תצוגת המילה תוך כדי גרירה, או הודעת פידבק אחרי שחרור.
            ה-X מוצג כשכבת-על (position: absolute) בכוונה - כדי שהופעתו
            לא תזיז שום דבר אחר במסך, לא משנה מה גודל הטקסט/האנימציה שלו. */}
        <View style={styles.inputDisplay}>
          {!symbolFeedback && liveWord ? (
            <Text style={styles.inputText}>{liveWord}</Text>
          ) : !symbolFeedback && feedback ? (
            <View style={styles.feedbackRow}>
              {feedback.isPangram && (
                <Ionicons name="star" size={22} color={colors.accentDeep} />
              )}
              <Text style={styles.inputText}>+{feedback.score}</Text>
              <Ionicons name="diamond-outline" size={22} color={colors.text} />
            </View>
          ) : (
            <Text style={styles.inputText}> </Text>
          )}
          {symbolFeedback && (
            <Animated.View
              style={[
                styles.invalidXWrap,
                { transform: [{ scale: feedbackScale }], opacity: feedbackOpacity },
              ]}
            >
              <Ionicons
                name={symbolFeedback === 'duplicate' ? 'refresh' : 'close'}
                size={30}
                color={symbolFeedback === 'duplicate' ? colors.warning : colors.error}
              />
            </Animated.View>
          )}
        </View>

        {/* מעגל האותיות + קווי החיבור */}
        <LetterCircle
          circleSize={CIRCLE_SIZE}
          tileSize={tileSize}
          tiles={tiles}
          selectedPath={selectedPath}
          dragPoint={dragPoint}
          tileScales={tileScales}
          tileOffsets={tileOffsets}
          panHandlers={panHandlers}
        />

        {/* שורת הפקדים מתחת לגלגל: הרמז "כמה נשאר" ממלא את השטח הפנוי
            מימין לכפתור הערבוב, וה-spacer בצד שמאל שומר על הכפתור
            במרכז המסך בלי תלות ברוחב הרמז. */}
        <View style={styles.controlsRow}>
          <View style={styles.remainingSlot}>
            <RemainingByLength groups={remainingByLength} />
          </View>
          <TouchableOpacity
            style={styles.shuffleButton}
            onPress={shuffleLetters}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="ערבוב אותיות"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="shuffle-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.controlsSpacer} />
        </View>
      </View>

      {/* רשימת מילים שנמצאו - מוצמדת לתחתית המסך */}
      <FoundWordsList foundWords={foundWordsNewestFirst} />

      <ReportModal
        visible={wordReport.visible}
        submitted={wordReport.submitted}
        title="דיווח על מילה שגויה"
        message="ניסית מילה שאתה בטוח שהיא נכונה, אבל המשחק לא זיהה אותה? ספר לנו עליה ונבדוק אותה."
        primaryField={{
          label: 'מה המילה?',
          value: wordReport.primary,
          onChangeText: wordReport.setPrimary,
          placeholder: 'לדוגמה: שולחן',
        }}
        secondaryField={{
          label: 'מה הפירוש שלה?',
          value: wordReport.secondary,
          onChangeText: wordReport.setSecondary,
          placeholder: 'הסבר קצר על משמעות המילה',
          multiline: true,
        }}
        sending={wordReport.sending}
        error={wordReport.error}
        canSubmit={wordReport.primary.trim().length > 0}
        onSubmit={wordReport.submit}
        onClose={wordReport.close}
        confirmationTitle="תודה!"
        confirmationMessage="קיבלנו את הדיווח שלך ונבדוק אותו בהקדם."
        submitButtonStyle={styles.reportSubmitButton}
        submitTextStyle={styles.reportSubmitText}
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
  topSection: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: HEADER_INSET,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  score: { fontFamily: FONTS.bold, fontSize: 20, color: colors.text, writingDirection: 'rtl' },
  backButton: { fontFamily: FONTS.regular, fontSize: 16, color: colors.textMuted, writingDirection: 'rtl' },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  levelLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: colors.textFaint,
    writingDirection: 'rtl',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  wordCount: { fontFamily: FONTS.regular, fontSize: 16, color: colors.textMuted, writingDirection: 'rtl' },
  inputDisplay: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'visible',
  },
  inputText: {
    fontFamily: FONTS.medium,
    fontSize: 30,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  feedbackRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  // גובה השורה נקבע ע"י הגבוה מבין הרמז לכפתור. הרמז עוטף לשורות בתוך
  // חצי הרוחב הפנוי, כך שבפועל הוא כמעט תמיד נמוך מהכפתור ולא מוסיף
  // שום גובה למסך.
  controlsRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 8,
  },
  remainingSlot: {
    flex: 1,
    paddingLeft: 8,
  },
  // תאום הרוחב של הרמז בצד השני של הכפתור - זה מה ששומר על הכפתור
  // במרכז המסך.
  controlsSpacer: {
    flex: 1,
  },
  shuffleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardLocked,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invalidXWrap: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    bottom: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportSubmitButton: {
    backgroundColor: colors.text,
  },
  reportSubmitText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: colors.background,
    writingDirection: 'rtl',
  },
});

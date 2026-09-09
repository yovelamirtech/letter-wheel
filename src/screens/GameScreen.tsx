import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALL_WORDS } from '../data/dictionary';
import { computeCirclePositions, Point } from '../utils/circleLayout';
import { computeLineStyle, distance } from '../utils/lineGeometry';
import { buildDictionarySet } from '../utils/wordValidator';
import { restoreState, submitWord } from '../utils/gameLogic';
import { FONTS } from '../utils/fonts';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';
import {
  ALLOW_REPEATED_TILE_IN_WORD,
  CONFIRMATION_DURATION_MS,
  HEADER_ICON_SIZE,
  HEADER_INSET,
  headerIconStyles,
} from '../utils/ui';
import PointsBadge from '../components/PointsBadge';
import { toFinalFormAtEnd } from '../utils/hebrewLetters';
import { errorHaptic, successHaptic, tapHaptic } from '../utils/haptics';
import {
  playClickSound,
  playCorrectSound,
  playDuplicateSound,
  playIncorrectSound,
  playLetterClickSound,
} from '../utils/sound';
import { GameState, Level } from '../types';
import { useRemainingByLength } from '../hooks/useRemainingByLength';
import RemainingByLength from '../components/RemainingByLength';
import { submitToWeb3Forms } from '../utils/web3forms';
import { MAX_CONTENT_WIDTH, useCircleSize } from '../utils/responsive';

// יחס גודל האריח מתוך גודל המעגל - נשמר קבוע כדי שהאריחים יגדלו/יקטנו
// יחסית למעגל עצמו (שמשתנה לפי גודל המסך, ר' useCircleSize).
const TILE_SIZE_RATIO = 56 / 260;
const LINE_THICKNESS = 6;

interface SelectedTile {
  index: number;
  char: string;
  point: Point;
}

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
  const TILE_SIZE = Math.round(CIRCLE_SIZE * TILE_SIZE_RATIO);
  const RADIUS = CIRCLE_SIZE / 2 - TILE_SIZE / 2;
  const CENTER = useMemo(() => ({ x: CIRCLE_SIZE / 2, y: CIRCLE_SIZE / 2 }), [CIRCLE_SIZE]);
  // כמה קרוב צריך האצבע להיות למרכז אות כדי ש"תיגע" בה - קצת יותר סלחני
  // מרדיוס האריח עצמו, כדי שהגרירה תרגיש נוחה ולא תדרוש דיוק מושלם
  const HIT_RADIUS = TILE_SIZE * 0.68;

  const [state, setState] = useState<GameState>(() => restoreState(puzzle, initialFoundWords));
  const [feedback, setFeedback] = useState<{ score: number; isPangram: boolean } | null>(null);

  // דיווח על מילה שגויה - נשלח ל-Web3Forms ומגיע למייל של הצוות
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportWord, setReportWord] = useState('');
  const [reportMeaning, setReportMeaning] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // הודעת האישור נסגרת לבד; אפשר גם לסגור אותה מוקדם בנגיעה.
  // ה-cleanup מבטל את הטיימר אם המסך יורד או אם המשתמש סגר בעצמו,
  // כדי לא לעדכן state של קומפוננטה שכבר לא מוצגת.
  useEffect(() => {
    if (!reportSubmitted || !reportModalVisible) return;
    const timer = setTimeout(() => setReportModalVisible(false), CONFIRMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [reportSubmitted, reportModalVisible]);

  function openReportModal() {
    tapHaptic();
    playClickSound();
    setReportSubmitted(false);
    setReportWord('');
    setReportMeaning('');
    setReportError(null);
    setReportModalVisible(true);
  }

  function closeReportModal() {
    // בזמן שליחה חוסמים סגירה כדי שהמודאל לא ייעלם באמצע הבקשה
    if (reportSending) return;
    playClickSound();
    setReportError(null);
    setReportModalVisible(false);
  }

  async function submitReport() {
    if (reportSending || !reportWord.trim()) return;
    playClickSound();
    setReportSending(true);
    setReportError(null);

    const word = reportWord.trim();
    const result = await submitToWeb3Forms(`דיווח על מילה שגויה: ${word}`, 'גלגל המילים - מילה', {
      'המילה': word,
      'הפירוש': reportMeaning.trim() || 'לא צורף פירוש',
      'שלב': String(level.index + 1),
      'אותיות השלב': level.letters.join(' '),
    });

    setReportSending(false);

    if (!result.success) {
      errorHaptic();
      setReportError(result.message ?? 'השליחה נכשלה. נסו שוב.');
      return;
    }

    successHaptic();
    setReportSubmitted(true);
  }
  const [selectedPath, setSelectedPath] = useState<SelectedTile[]>([]);
  const [dragPoint, setDragPoint] = useState<Point | null>(null);

  // מוחזק ב-ref (לא state) כי אנחנו קוראים אותו בתוך handlers של
  // PanResponder, ששם ה-closure עלול להחזיק ערך "ישן" של ה-state
  const selectedPathRef = useRef<SelectedTile[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  // האם האצבע "עזבה" את האות האחרונה שנוספה מאז שנוספה - נחוץ כדי להבחין
  // בין "עדיין נשען על אותה אות" (לא מוסיפים שוב) לבין "עזב וחזר לאותה
  // אות" (הכוונה להוסיף אות כפולה ברצף, כמו ב"עורר")
  const awayFromLastRef = useRef(true);

  // סדר האותיות כפי שמוצג במעגל - נפרד מ-puzzle.letters כי אפשר לערבב
  // אותו (כפתור הערבוב) בלי לשנות שום דבר בלוגיקת המשחק עצמה, שמתייחסת
  // לאותיות כקבוצה (סדר לא משנה לבדיקת תקינות/ניקוד).
  const [letterOrder, setLetterOrder] = useState<string[]>(() => level.letters);

  function shuffleLetters() {
    tapHaptic();
    playClickSound();
    resetSelection();

    // מגרילים תמורה של המקומות (fromSlots[i] = מאיזה מקום הגיעה האות
    // שיושבת עכשיו במקום i), כדי שנוכל להזיז כל אות מהמקום הישן לחדש.
    const count = letterOrder.length;
    const fromSlots = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fromSlots[i], fromSlots[j]] = [fromSlots[j], fromSlots[i]];
    }

    setLetterOrder((prev) => fromSlots.map((from) => prev[from]));

    // האות מרונדרת מיד במקום החדש, ולכן מתחילים אותה מוזזת בהיסט של
    // "המקום הישן פחות החדש" ומחזירים אותו ל-0: העין רואה תנועה מהמקום
    // הישן לחדש. Easing.out => יוצאת מהר ונבלמת בהגעה.
    fromSlots.forEach((from, to) => {
      const offset = tileOffsets[to];
      if (!offset) return;
      offset.setValue({
        x: positions[from].x - positions[to].x,
        y: positions[from].y - positions[to].y,
      });
      Animated.timing(offset, {
        toValue: { x: 0, y: 0 },
        duration: 420,
        delay: to * 20,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }

  const positions = useMemo(
    () => computeCirclePositions(puzzle.letters.length, RADIUS, CENTER),
    [puzzle.letters.length]
  );

  const tiles: SelectedTile[] = useMemo(
    () => letterOrder.map((char, i) => ({ index: i, char, point: positions[i] })),
    [letterOrder, positions]
  );
  // ה-PanResponder נוצר פעם אחת בלבד (ראו useRef למטה) - ה-handlers שלו
  // "קפואים" על הקלוז'ר מהרינדור הראשון. tiles משתנה כשמערבבים אותיות
  // (letterOrder), אז צריך גישה דרך ref כדי שההנדלרים תמיד יראו את
  // הגרסה העדכנית, לא את זו שהייתה קיימת כשה-PanResponder נוצר.
  const tilesRef = useRef(tiles);
  tilesRef.current = tiles;
  // אותה סיבה: HIT_RADIUS תלוי עכשיו בגודל מסך דינמי (ר' useCircleSize),
  // ולכן חייב להגיע דרך ref כדי ש-findTileAt (שנקרא מתוך ה-PanResponder
  // הקפוא) יראה את הערך העדכני גם אחרי סיבוב מסך/שינוי גודל.
  const hitRadiusRef = useRef(HIT_RADIUS);
  hitRadiusRef.current = HIT_RADIUS;

  // ערך אנימציה (scale) לכל אות במעגל - "פועם" רגע כשהאצבע נוגעת בה
  const tileScales = useRef<Animated.Value[]>([]).current;
  if (tileScales.length !== tiles.length) {
    tileScales.length = 0;
    for (let i = 0; i < tiles.length; i++) tileScales.push(new Animated.Value(1));
  }

  // היסט (translate) לכל מקום במעגל - משמש לאנימציית הערבוב: האות מרונדרת
  // כבר במקום החדש, וההיסט "מחזיר" אותה ויזואלית למקום הישן ומתאפס בהדרגה.
  const tileOffsets = useRef<Animated.ValueXY[]>([]).current;
  if (tileOffsets.length !== tiles.length) {
    tileOffsets.length = 0;
    for (let i = 0; i < tiles.length; i++) tileOffsets.push(new Animated.ValueXY({ x: 0, y: 0 }));
  }

  function pulseTile(index: number) {
    tapHaptic();
    playLetterClickSound();
    const val = tileScales[index];
    if (!val) return;
    val.setValue(1);
    Animated.sequence([
      Animated.timing(val, { toValue: 1.22, duration: 70, useNativeDriver: true }),
      Animated.timing(val, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
  }

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

  function findTileAt(point: Point): SelectedTile | null {
    let closest: SelectedTile | null = null;
    let closestDist = hitRadiusRef.current;
    for (const tile of tilesRef.current) {
      const d = distance(point, tile.point);
      if (d < closestDist) {
        closest = tile;
        closestDist = d;
      }
    }
    return closest;
  }

  function resetSelection() {
    selectedPathRef.current = [];
    setSelectedPath([]);
    setDragPoint(null);
  }

  function finishWord() {
    const path = selectedPathRef.current;
    resetSelection();

    if (path.length < 2) return; // אות בודדת - אין מילה כזו, אין טעם להראות שגיאה

    const rawWord = path.map((t) => t.char).join('');
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const point = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
        const tile = findTileAt(point);
        setFeedback(null);
        // מתחילים מילה חדשה - מבטלים מיד את אנימציית הסמל אם היא עדיין
        // רצה, כדי שהיא לא "תתקע" ותחסום את תצוגת המילה החדשה
        feedbackScale.stopAnimation();
        feedbackOpacity.stopAnimation();
        setSymbolFeedback(null);
        if (tile) {
          selectedPathRef.current = [tile];
          setSelectedPath([tile]);
          pulseTile(tile.index);
        } else {
          selectedPathRef.current = [];
          setSelectedPath([]);
        }
        awayFromLastRef.current = false;
        setDragPoint(point);
      },
      onPanResponderMove: (evt) => {
        const point = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
        setDragPoint(point);

        const tile = findTileAt(point);
        const path = selectedPathRef.current;
        const last = path[path.length - 1];

        if (!tile) {
          // האצבע יצאה מכל אות - מסמנים שאפשר "לחזור" לאות האחרונה בהמשך
          awayFromLastRef.current = true;
          return;
        }

        if (last && tile.index === last.index) {
          if (!awayFromLastRef.current) {
            return; // עדיין נשען על אותה אות ברצף - לא מוסיפים שוב
          }
          // האצבע עזבה את האות הזו וחזרה אליה - כוונה מפורשת לחזור על האות.
          // אבל כל אריח בגלגל הוא אות יחידה (ר' usesOnlyAvailableLetters),
          // אז מילה כזו תמיד תיפסל - חוסמים כבר כאן במקום לתת ניסיון אבוד.
          if (!ALLOW_REPEATED_TILE_IN_WORD) return;
        }

        if (!last) {
          // לא התחלנו בתוך אות (למשל אצבע ירדה מחוץ למעגל) - מתחילים כאן
          selectedPathRef.current = [tile];
          setSelectedPath([tile]);
          pulseTile(tile.index);
          awayFromLastRef.current = false;
          return;
        }

        // אותה סיבה כמו למעלה: אריח שכבר נבחר במילה (לא רק האחרון) לא יכול
        // להתווסף שוב כשחזרה על אותיות חסומה.
        if (!ALLOW_REPEATED_TILE_IN_WORD && path.some((t) => t.index === tile.index)) {
          return;
        }

        // חשוב: כשחזרה על אותיות מותרת (ALLOW_REPEATED_TILE_IN_WORD), אין כאן
        // "ביטול בגרירה אחורה" בכוונה. מילים אמיתיות בעברית הרבה פעמים חוזרות
        // על אותה אות (למשל "בלבל" = ב-ל-ב-ל), אז גרירה חזרה לאות קודמת
        // חייבת להוסיף אותה מחדש למילה, לא לבטל אותה. אם המשתמש טעה בדרך,
        // השחרור פשוט יגיש מילה לא תקינה והוא יתחיל שוב - אין "עלות" לטעות
        // כי אין כפתור אישור נפרד.
        const next = [...path, tile];
        selectedPathRef.current = next;
        setSelectedPath(next);
        pulseTile(tile.index);
        awayFromLastRef.current = false;
      },
      onPanResponderRelease: finishWord,
      onPanResponderTerminate: finishWord,
    })
  ).current;

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
  const selectedIndices = new Set(selectedPath.map((t) => t.index));

  return (
    <View style={styles.container}>
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
              onPress={openReportModal}
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
        <View
          style={[styles.circleContainer, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}
          {...panResponder.panHandlers}
        >
          {/* קווים בין אותיות שכבר נבחרו */}
          {selectedPath.slice(1).map((tile, i) => {
            const from = selectedPath[i].point;
            const style = computeLineStyle(from, tile.point, LINE_THICKNESS);
            return <View key={`line-${i}`} style={[styles.line, style]} pointerEvents="none" />;
          })}
          {/* קו "זנב" מהאות האחרונה שנבחרה עד למיקום האצבע כרגע */}
          {selectedPath.length > 0 && dragPoint && (
            <View
              style={[
                styles.line,
                styles.trailLine,
                computeLineStyle(selectedPath[selectedPath.length - 1].point, dragPoint, LINE_THICKNESS),
              ]}
              pointerEvents="none"
            />
          )}

          {tiles.map((tile) => {
            const isSelected = selectedIndices.has(tile.index);
            return (
              <Animated.View
                key={tile.index}
                style={[
                  styles.letterTile,
                  {
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    borderRadius: TILE_SIZE / 2,
                    left: tile.point.x - TILE_SIZE / 2,
                    top: tile.point.y - TILE_SIZE / 2,
                  },
                  isSelected && styles.letterTileSelected,
                  {
                    transform: [
                      { translateX: tileOffsets[tile.index].x },
                      { translateY: tileOffsets[tile.index].y },
                      { scale: tileScales[tile.index] },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.letterText,
                    { fontSize: Math.round(TILE_SIZE * 0.464) },
                    isSelected && styles.letterTextSelected,
                  ]}
                >
                  {tile.char}
                </Text>
              </Animated.View>
            );
          })}
        </View>

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
      <View style={styles.foundListWrapper}>
        <ScrollView style={styles.foundList}>
          {foundWordsNewestFirst.map((fw) => (
            <View key={fw.word} style={styles.foundRow}>
              <View style={styles.foundWordRow}>
                <Text style={styles.foundWordText}>{fw.word}</Text>
                {fw.isPangram && (
                  <Ionicons name="star" size={14} color={colors.accentDeep} />
                )}
              </View>
              <PointsBadge value={`+${fw.score}`} textStyle={styles.foundScoreText} />
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReportModal}
      >
        {reportSubmitted ? (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              playClickSound();
              setReportModalVisible(false);
            }}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>תודה!</Text>
              <Text style={styles.modalMessage}>
                קיבלנו את הדיווח שלך ונבדוק אותו בהקדם.
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>דיווח על מילה שגויה</Text>
              <Text style={styles.modalMessage}>
                ניסית מילה שאתה בטוח שהיא נכונה, אבל המשחק לא זיהה אותה? ספר
                לנו עליה ונבדוק אותה.
              </Text>

              <Text style={styles.fieldLabel}>מה המילה?</Text>
              <TextInput
                style={styles.input}
                value={reportWord}
                onChangeText={setReportWord}
                placeholder="לדוגמה: שולחן"
                placeholderTextColor="#B7A97E"
                textAlign="right"
                editable={!reportSending}
              />

              <Text style={styles.fieldLabel}>מה הפירוש שלה?</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={reportMeaning}
                onChangeText={setReportMeaning}
                placeholder="הסבר קצר על משמעות המילה"
                placeholderTextColor="#B7A97E"
                textAlign="right"
                multiline
                editable={!reportSending}
              />

              {reportError !== null && <Text style={styles.errorText}>{reportError}</Text>}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalConfirmButton,
                    (reportSending || !reportWord.trim()) && styles.modalButtonDisabled,
                  ]}
                  onPress={submitReport}
                  activeOpacity={0.8}
                  disabled={reportSending || !reportWord.trim()}
                >
                  <Text style={styles.modalConfirmText}>{reportSending ? 'שולח...' : 'שליחה'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton, reportSending && styles.modalButtonDisabled]}
                  onPress={closeReportModal}
                  activeOpacity={0.8}
                  disabled={reportSending}
                >
                  <Text style={styles.modalCancelText}>ביטול</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    paddingTop: 48,
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
  score: { fontFamily: FONTS.bold, fontSize: 20, color: '#3A2E1F', writingDirection: 'rtl' },
  backButton: { fontFamily: FONTS.regular, fontSize: 16, color: '#7A6A52', writingDirection: 'rtl' },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  levelLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#9C8B6F',
    writingDirection: 'rtl',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  wordCount: { fontFamily: FONTS.regular, fontSize: 16, color: '#7A6A52', writingDirection: 'rtl' },
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
    color: '#3A2E1F',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  feedbackRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  circleContainer: {
    position: 'relative',
    marginVertical: 16,
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
    backgroundColor: '#EDE0C8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9A227',
  },
  trailLine: {
    backgroundColor: '#D8C08A',
  },
  letterTile: {
    position: 'absolute',
    backgroundColor: '#F4C542',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.showcase,
  },
  letterTileSelected: {
    backgroundColor: '#3A2E1F',
  },
  letterText: {
    fontFamily: FONTS.bold,
    color: '#3A2E1F',
  },
  letterTextSelected: {
    color: '#F4C542',
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
  foundListWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D8C9A8',
    marginTop: 8,
  },
  foundList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  foundRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D8C9A8',
  },
  foundWordRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  foundWordText: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: '#3A2E1F',
    writingDirection: 'rtl',
  },
  foundScoreText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: '#7A6A52',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 46, 31, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#3A2E1F',
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#7A6A52',
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#5B4A32',
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    fontFamily: FONTS.regular,
    backgroundColor: '#F2E6C9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7D6AC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#3A2E1F',
    writingDirection: 'rtl',
    marginBottom: 16,
  },
  inputMultiline: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontFamily: FONTS.regular,
    marginTop: 10,
    fontSize: 13,
    color: '#B4342A',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modalConfirmButton: {
    backgroundColor: '#3A2E1F',
  },
  modalConfirmText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#FFF8E7',
    writingDirection: 'rtl',
  },
  modalCancelButton: {
    backgroundColor: '#EDE0C8',
  },
  modalCancelText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#3A2E1F',
    writingDirection: 'rtl',
  },
});

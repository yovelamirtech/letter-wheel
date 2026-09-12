import { useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder } from 'react-native';
import { computeCirclePositions, Point } from '../utils/circleLayout';
import { distance } from '../utils/lineGeometry';
import { ALLOW_REPEATED_TILE_IN_WORD } from '../utils/ui';
import { tapHaptic } from '../utils/haptics';
import { playClickSound, playLetterClickSound } from '../utils/sound';

export interface CircleTile {
  index: number;
  char: string;
  point: Point;
}

interface UseLetterCircleOptions {
  letters: string[];
  circleSize: number;
  tileSizeRatio: number;
  // נקרא ברגע שהאצבע נוגעת במעגל מחדש - הזדמנות למסך שמחזיק ב-hook הזה
  // לנקות פידבק ויזואלי ישן (למשל סמל "X" ממילה קודמת) לפני שמתחילים חדש.
  onSelectionStart?: () => void;
  // נקרא כשהאצבע משתחררת עם מילה בת שתי אותיות לפחות - האות עצמן, לא הבדיקה.
  onWordSubmitted: (word: string) => void;
}

/**
 * מנהל את כל הגרירה על מעגל האותיות: מיקום האותיות, זיהוי איזו אות
 * האצבע נוגעת בה, מסלול הבחירה, אנימציות ה"פעימה" של אריח שנבחר,
 * וערבוב האותיות. לא יודע כלום על תקינות מילים או ניקוד - זה מוגש
 * החוצה כמחרוזת גולמית דרך onWordSubmitted.
 */
export function useLetterCircle({
  letters,
  circleSize,
  tileSizeRatio,
  onSelectionStart,
  onWordSubmitted,
}: UseLetterCircleOptions) {
  const tileSize = Math.round(circleSize * tileSizeRatio);
  const radius = circleSize / 2 - tileSize / 2;
  const center = useMemo(() => ({ x: circleSize / 2, y: circleSize / 2 }), [circleSize]);
  // כמה קרוב צריך האצבע להיות למרכז אות כדי ש"תיגע" בה - קצת יותר סלחני
  // מרדיוס האריח עצמו, כדי שהגרירה תרגיש נוחה ולא תדרוש דיוק מושלם
  const hitRadius = tileSize * 0.68;

  // סדר האותיות כפי שמוצג במעגל - נפרד מ-letters כי אפשר לערבב אותו
  // (כפתור הערבוב) בלי לשנות שום דבר בלוגיקת המשחק עצמה.
  const [letterOrder, setLetterOrder] = useState<string[]>(() => letters);
  const [selectedPath, setSelectedPath] = useState<CircleTile[]>([]);
  const [dragPoint, setDragPoint] = useState<Point | null>(null);

  // מוחזק ב-ref (לא state) כי אנחנו קוראים אותו בתוך handlers של
  // PanResponder, ששם ה-closure עלול להחזיק ערך "ישן" של ה-state
  const selectedPathRef = useRef<CircleTile[]>([]);
  // האם האצבע "עזבה" את האות האחרונה שנוספה מאז שנוספה - נחוץ כדי להבחין
  // בין "עדיין נשען על אותה אות" (לא מוסיפים שוב) לבין "עזב וחזר לאותה
  // אות" (הכוונה להוסיף אות כפולה ברצף, כמו ב"עורר")
  const awayFromLastRef = useRef(true);

  const positions = useMemo(
    () => computeCirclePositions(letters.length, radius, center),
    [letters.length, radius, center]
  );

  const tiles: CircleTile[] = useMemo(
    () => letterOrder.map((char, i) => ({ index: i, char, point: positions[i] })),
    [letterOrder, positions]
  );

  // ה-PanResponder נוצר פעם אחת בלבד (ראו useRef למטה) - ה-handlers שלו
  // "קפואים" על הקלוז'ר מהרינדור הראשון. tiles משתנה כשמערבבים אותיות
  // (letterOrder), אז צריך גישה דרך ref כדי שההנדלרים תמיד יראו את
  // הגרסה העדכנית, לא את זו שהייתה קיימת כשה-PanResponder נוצר.
  const tilesRef = useRef(tiles);
  tilesRef.current = tiles;
  // אותה סיבה: hitRadius תלוי עכשיו בגודל מסך דינמי (ר' useCircleSize),
  // ולכן חייב להגיע דרך ref כדי ש-findTileAt (שנקרא מתוך ה-PanResponder
  // הקפוא) יראה את הערך העדכני גם אחרי סיבוב מסך/שינוי גודל.
  const hitRadiusRef = useRef(hitRadius);
  hitRadiusRef.current = hitRadius;
  const onSelectionStartRef = useRef(onSelectionStart);
  onSelectionStartRef.current = onSelectionStart;
  const onWordSubmittedRef = useRef(onWordSubmitted);
  onWordSubmittedRef.current = onWordSubmitted;

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

  function findTileAt(point: Point): CircleTile | null {
    let closest: CircleTile | null = null;
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
    const word = path.map((t) => t.char).join('');
    onWordSubmittedRef.current(word);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const point = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
        const tile = findTileAt(point);
        onSelectionStartRef.current?.();
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

  return {
    tileSize,
    tiles,
    selectedPath,
    dragPoint,
    tileScales,
    tileOffsets,
    panHandlers: panResponder.panHandlers,
    shuffleLetters,
  };
}

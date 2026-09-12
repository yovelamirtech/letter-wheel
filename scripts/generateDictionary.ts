/**
 * סקריפט build-time (לא רץ באפליקציה עצמה) שמעבד שני מקורות מילים גולמיים:
 *   - hspell_simple.txt: צורות הבסיס של hspell (129,574 מילים)
 *   - hspell_expanded.txt: אותו מילון אחרי הצמדת כל צירופי מילות היחס/חיבור
 *     התקניים (ו-, ש-, כ-, ב-, ל-, מ-, ה- וכו') לכל מילה - כ-5.4 מיליון
 *     צורות. הרבה מהצורות האלה (כמו "שאני", "ובבית", "לזה") הן בעצמן
 *     מילים נפוצות שלא מופיעות בנפרד ב-hspell_simple, כי הן תמיד נכתבות
 *     מוצמדות. הוספת המקור הזה היא שהופכת השלב הבא (הצלבת תדירויות) ליעיל
 *     יותר - הוא יכול "לתפוס" גם מילים מוצמדות נפוצות, לא רק צורות בודדות.
 *
 * התהליך:
 *   1. מאחדים את שני המקורות (עם דה-דופליקציה) ומסננים מילים לא תקינות
 *      (תווים לא-עבריים, אורך קיצוני)
 *   2. מצליבים מול רשימת תדירויות אמיתית (he_freq.txt - מבוססת קורפוס
 *      כתוביות אמיתי, 50,000 מילים) - נשארות רק מילים שבאמת בשימוש.
 *      זו הסיבה שהשיטה הזו עדיפה על ניחוש לשוני של סיומות: במקום לנחש
 *      איזו מילה היא "נטייה" של איזו, פשוט בודקים שימוש אמיתי.
 *   3. שומרים מילון נקי כ-JSON לטעינה מהירה באפליקציה
 *   4. מייצרים רשימת "חידות מוכנות" - סטים של N אותיות (ברירת מחדל 5,
 *      ראו LETTER_COUNT) עם מספיק מילים אפשריות ולפחות פנגרם אחד
 *
 * הרצה: npx tsx scripts/generateDictionary.ts
 * למצב מתקדם עתידי עם 6 אותיות: שנו את LETTER_COUNT ל-6 והריצו שוב
 * (זה ייצור puzzles6.json נפרד, בלי לדרוס את puzzles.json של 5 אותיות).
 */
import fs from 'node:fs';
import path from 'node:path';
import { normalizeWordLetters } from '../src/utils/hebrewLetters';
import { calculateScore } from '../src/utils/gameLogic';

/**
 * PRNG עם seed קבוע (mulberry32) - כדי שהרצה חוזרת של הסקריפט תמיד
 * תפיק בדיוק את אותן 60 החידות, גם אם ההרצה קרתה בגלל שינוי לא-קשור
 * (כמו סגנון קוד או תיקון קטן). Math.random() רגיל היה משנה את כל
 * בנק החידות מחדש בכל הרצה - זה בדיוק מה שרצינו למנוע.
 * לייצר סט חידות *שונה* בכוונה: פשוט משנים את SEED למספר אחר.
 */
const SEED = 42;
function createRng(seed: number) {
  let state = seed;
  return function rng() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(SEED);

const RAW_PATH = path.join(__dirname, 'hspell_simple.txt');
const EXPANDED_PATH = path.join(__dirname, 'hspell_expanded.txt');
const FREQ_PATH = path.join(__dirname, 'he_freq.txt');
const OUT_WORDS_PATH = path.join(__dirname, '..', 'src', 'data', 'words.json');

// === כאן קובעים כמה אותיות יש בחידה ===
const LETTER_COUNT = 5;
const OUT_PUZZLES_PATH = path.join(
  __dirname,
  '..',
  'src',
  'data',
  LETTER_COUNT === 5 ? 'puzzles.json' : `puzzles${LETTER_COUNT}.json`
);

// זהה ל-normalizeFinalLetter ב-src/utils/hebrewLetters.ts - מנרמלת מחרוזת
// שלמה במקום אות בודדת.
const normalize = normalizeWordLetters;

const HEBREW_ONLY = /^[\u05D0-\u05EA]+$/;
const MIN_LEN = 2;
const MAX_LEN = 12;

function loadLines(filePath: string): string[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function loadAndCleanHspell(): string[] {
  // מאחדים את שני המקורות: צורות הבסיס + צורות מוצמדות-קידומת. הסדר לא
  // משנה כי ה-Set למטה מדפלק ממילא.
  const lines = [...loadLines(RAW_PATH), ...loadLines(EXPANDED_PATH)];

  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const word of lines) {
    if (!HEBREW_ONLY.test(word)) continue; // מסנן גרשיים, מספרים וכו'
    if (word.length < MIN_LEN || word.length > MAX_LEN) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    cleaned.push(word);
  }

  return cleaned;
}

function loadFrequencySet(): Set<string> {
  const raw = fs.readFileSync(FREQ_PATH, 'utf-8');
  const words = raw
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);
  return new Set(words);
}

interface PuzzleCandidate {
  letters: string[];
  pangramWord: string;
  wordCount: number;
  sampleWords: string[];
  difficulty: number;
  achievableScore: number;
}

/**
 * מונה כמה פעמים כל אות (אחרי נרמול) מופיעה בכל מילות המילון הנקי.
 * זה הבסיס לחישוב "נדירות" אמיתית - לא ניחוש, אלא מדידה בפועל.
 */
function computeLetterFrequencies(words: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const w of words) {
    for (const l of normalize(w)) {
      freq[l] = (freq[l] ?? 0) + 1;
    }
  }
  return freq;
}

/**
 * מערבבת את סדר האותיות שיוצג במעגל/בכרטיס השלב, כדי שהסדר לא יחשוף
 * במקרה את המילה הכי ארוכה (הפנגרם) שממנה נלקח סט האותיות - כי בלי
 * ערבוב, סדר האותיות תמיד זהה לסדר האותיות במילת הפנגרם המקורית.
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * ציון קושי לחידה: משלב שני גורמים -
 *  1. נדירות האותיות (סכום 1/תדירות לכל אות בחידה) - אותיות נדירות = קשה יותר
 *  2. כמות המילים האפשריות בפועל (wordCount) - פחות מילים = קשה יותר
 * מחלקים את (1) ב-(2) כדי לקבל ציון יחיד: גם אותיות נדירות וגם מעט מילים
 * מחמירים זה את זה. ציון גבוה יותר = קשה יותר.
 */
function computeDifficulty(
  letters: string[],
  wordCount: number,
  letterFreq: Record<string, number>
): number {
  const raritySum = letters.reduce((sum, l) => sum + 1 / (letterFreq[l] ?? 1), 0);
  return raritySum / wordCount;
}

function generatePuzzles(
  words: string[],
  letterCount: number,
  targetCount: number,
  letterFreq: Record<string, number>
): PuzzleCandidate[] {
  const wordLetterSets = words.map((w) => {
    const normalized = normalize(w);
    const letters = new Set(normalized);
    return {
      word: w,
      letters,
      // אין reuse: לכל אות בגלגל אריח יחיד, אז מילה עם אות כפולה
      // (כמו "מטיילת") לא ניתנת להרכבה ולא תיכנס למאגר המילים התקין.
      hasNoRepeatedLetters: letters.size === normalized.length,
    };
  });

  const pangramCandidates = wordLetterSets.filter(
    (w) => w.letters.size === letterCount && w.hasNoRepeatedLetters
  );
  console.log(`מועמדי פנגרם (${letterCount} אותיות ייחודיות, בלי reuse): ${pangramCandidates.length}`);

  const puzzles: PuzzleCandidate[] = [];
  const shuffled = [...pangramCandidates].sort(() => rng() - 0.5);

  for (const candidate of shuffled) {
    if (puzzles.length >= targetCount) break;

    const letterSet = candidate.letters;
    const matchingWords = wordLetterSets.filter((w) => {
      if (!w.hasNoRepeatedLetters) return false;
      for (const l of w.letters) {
        if (!letterSet.has(l)) return false;
      }
      return true;
    });

    // טווח "כמות משחקית" - מותאם לגודל המילון אחרי הצלבת תדירויות
    if (matchingWords.length < 8 || matchingWords.length > 60) continue;

    const key = [...letterSet].sort().join('');
    if (puzzles.some((p) => [...p.letters].sort().join('') === key)) continue;

    const letters = shuffle([...letterSet]);
    const puzzleLetters = { letters };
    const achievableScore = matchingWords.reduce(
      (sum, w) => sum + calculateScore(w.word, puzzleLetters),
      0
    );
    puzzles.push({
      letters,
      pangramWord: candidate.word,
      wordCount: matchingWords.length,
      sampleWords: matchingWords.slice(0, 5).map((w) => w.word),
      difficulty: computeDifficulty(letters, matchingWords.length, letterFreq),
      achievableScore,
    });
  }

  // ממיינים מהקל לקשה - כך אינדקס 0 = שלב 1 = הכי קל
  puzzles.sort((a, b) => a.difficulty - b.difficulty);

  return puzzles;
}

function main() {
  console.log('טוען ומנקה את הרשימה...');
  const hspellWords = loadAndCleanHspell();
  console.log(`מילים תקינות אחרי סינון ראשוני: ${hspellWords.length}`);

  console.log('מצליב מול רשימת תדירויות אמיתית...');
  const freqSet = loadFrequencySet();
  const words = hspellWords.filter((w) => freqSet.has(w));
  console.log(`מילים אחרי הצלבה: ${words.length} (${hspellWords.length - words.length} הוסרו)`);

  fs.mkdirSync(path.dirname(OUT_WORDS_PATH), { recursive: true });
  fs.writeFileSync(OUT_WORDS_PATH, JSON.stringify(words, null, 2), 'utf-8');
  console.log(`נשמר: ${OUT_WORDS_PATH} (${(fs.statSync(OUT_WORDS_PATH).size / 1024 / 1024).toFixed(2)}MB)`);

  console.log(`מייצר חידות (${LETTER_COUNT} אותיות)...`);
  const letterFreq = computeLetterFrequencies(words);
  const puzzles = generatePuzzles(words, LETTER_COUNT, 60, letterFreq);
  fs.writeFileSync(OUT_PUZZLES_PATH, JSON.stringify(puzzles, null, 2), 'utf-8');
  console.log(`נשמר: ${OUT_PUZZLES_PATH} (${puzzles.length} חידות, ממוינות מהקל לקשה)`);

  console.log('\nהחידה הקלה ביותר:', puzzles[0]);
  console.log('\nהחידה הקשה ביותר:', puzzles[puzzles.length - 1]);
}

main();

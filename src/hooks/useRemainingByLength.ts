import { useMemo } from 'react';
import { ALL_WORDS } from '../data/dictionary';
import { MIN_WORD_LENGTH, usesOnlyAvailableLetters } from '../utils/wordValidator';

export interface RemainingGroup {
  length: number; // אורך המילה באותיות
  remaining: number; // כמה מילים באורך הזה עוד לא נמצאו
}

/**
 * כל המילים הפתירות בשלב, מקובצות לפי אורך.
 *
 * בבנק החידות (puzzles.json) שמור רק wordCount הכולל, בלי הפילוח לפי אורך,
 * אז מחשבים אותו כאן מהמילון המלא באותה בדיקה שמשמשת את validateWord -
 * כך שהספירה תמיד תואמת בדיוק את מה שהמשחק יקבל כמילה חוקית.
 * זו סריקה של כל המילון (~43 אלף מילים, עשרות אלפיות שנייה), ולכן היא
 * ממומשת (useMemo) לפי האותיות בלבד ורצה פעם אחת לכל שלב.
 */
function countSolutionsByLength(letters: string[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const word of ALL_WORDS) {
    if (word.length < MIN_WORD_LENGTH) continue;
    if (!usesOnlyAvailableLetters(word, letters)) continue;
    counts.set(word.length, (counts.get(word.length) ?? 0) + 1);
  }
  return counts;
}

/**
 * כמה מילים נשארו למצוא בכל אורך מילה.
 * מחזירה רק אורכים שעדיין נשאר בהם משהו, ממוין מהקצר לארוך, כדי
 * שהתצוגה לא תיסתם באורכים שכבר הושלמו.
 */
export function useRemainingByLength(letters: string[], foundWords: string[]): RemainingGroup[] {
  // האותיות הן מערך חדש בכל רינדור של המסך, אז מפתח היציבות הוא התוכן שלו
  // (lettersKey) ולא ה-reference של letters עצמו.
  const lettersKey = letters.join('');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- letters מוחלף רק כש-lettersKey משתנה
  const totals = useMemo(() => countSolutionsByLength(letters), [lettersKey]);

  return useMemo(() => {
    const remaining = new Map(totals);
    for (const word of foundWords) {
      const left = remaining.get(word.length);
      if (left !== undefined) remaining.set(word.length, left - 1);
    }

    return [...remaining.entries()]
      .filter(([, count]) => count > 0)
      .sort((a, b) => a[0] - b[0])
      .map(([length, count]) => ({ length, remaining: count }));
  }, [totals, foundWords]);
}

import { useFonts } from 'expo-font';
import { SecularOne_400Regular } from '@expo-google-fonts/secular-one';
import { Heebo_400Regular, Heebo_500Medium, Heebo_700Bold } from '@expo-google-fonts/heebo';

// פונטי ברירת המחדל של המערכת נראים רזים ו"אקראיים" בעברית, במיוחד
// בכותרת הגדולה של מסך הפתיחה. Secular One הוא פונט תצוגה עברי עם
// משקל אחיד ורחב, ו-Heebo הוא פונט טקסט עברי נקי שמתאים לו כזוג.
export const FONTS = {
  display: 'SecularOne_400Regular',
  regular: 'Heebo_400Regular',
  medium: 'Heebo_500Medium',
  bold: 'Heebo_700Bold',
} as const;

// כל הפונטים נטענים בבת אחת בשורש האפליקציה, כדי שלא יהיה הבזק של
// פונט ברירת מחדל לפני שהפונט האמיתי מוכן.
// כל האייקונים באפליקציה (הגדרות, מנעול, דגל, יהלום הניקוד, כוכב הפנגרם
// וכו') הם אייקוני Ionicons וקטוריים ולא תלויים בפונט כלל - אין אימוג'ים
// מוטמעים בטקסט שדורשים טיפול מיוחד כאן.
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    SecularOne_400Regular,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
  });

  // אם טעינת הפונטים נכשלה אין טעם לתקוע את האפליקציה על מסך המתנה -
  // עדיף להמשיך עם פונט ברירת המחדל של המערכת.
  return loaded || error !== null;
}

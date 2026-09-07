import { useWindowDimensions } from 'react-native';

// רוחב מקסימלי לתוכן הראשי (כרטיסים, טפסים, מודאלים) בכל המסכים.
// בטלפון זה תמיד רחב יותר מהמסך ולכן לא משנה כלום; באייפד זה מונע
// מהתוכן להימתח לרוחב המסך המלא ולהיראות "מרוח".
export const MAX_CONTENT_WIDTH = 480;

// סף הרוחב שממנו ואילך מתייחסים למכשיר כטאבלט (iPad מיני במאונך הוא
// כ-744pt, אז 680 תופס גם אותו וגם מסכים גדולים יותר, בלי להשפיע על טלפונים).
const TABLET_WIDTH_THRESHOLD = 680;

export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_WIDTH_THRESHOLD;
}

// גודל מעגל האותיות במסך המשחק: תלוי גם ברוחב וגם בגובה הזמינים, כדי
// שבמצבים עם גובה מוגבל (למשל iPad ב-Split View) המעגל לא יידחס.
export function useCircleSize(): number {
  const { width, height } = useWindowDimensions();
  const available = Math.min(width - 64, height * 0.42);
  return Math.round(clamp(available, 220, 340));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

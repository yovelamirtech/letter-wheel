import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';

// כמה זמן הודעת האישור ("הדיווח נשלח") נשארת על המסך לפני שהיא נסגרת מעצמה.
// משותף למסך ההגדרות ולמסך המשחק כדי ששני הדיווחים יתנהגו אותו דבר.
export const CONFIRMATION_DURATION_MS = 1000;

// גלגל ההגדרות מופיע בשלושה מסכים שונים. כדי שהוא לא "יקפוץ" בין מעברי
// מסכים, המידות והמיקום מוגדרים כאן פעם אחת במקום להשתכפל בכל מסך.
export const HEADER_INSET = 16; // מרחק אופקי מקצה המסך
export const HEADER_TOP = 48; // מרחק אנכי מראש המסך

// כל אריח בגלגל הוא אות יחידה (ר' usesOnlyAvailableLetters ב-wordValidator),
// אז מילה שגוררת חזרה לאריח שכבר נבחר תמיד תיפסל בבדיקת התקינות. לכן
// חוסמים את זה כבר בגרירה עצמה, כדי שהמשתמש לא "יבזבז" ניסיון על מילה
// שבלתי אפשרית מבנה. שמור כדגל (ולא נמחק) למקרה שנרצה להחזיר את האפשרות
// אם יתווספו אריחים עם אותיות כפולות בעתיד.
export const ALLOW_REPEATED_TILE_IN_WORD = false;

export const HEADER_ICON_SIZE = 18;

export const headerIconStyles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: radii.lg,
    backgroundColor: colors.cardLocked,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// פלטת "זהב-קלף" (parchment & gold) של גלגל אותיות. שם המשחק האחות
// (בול פגיעה) משתמש באותו מבנה טוקנים עם ערכים אחרים - שתי הפלטות "חמות"
// אבל שונות בכוונה, כדי שכל משחק יישאר מזוהה בפני עצמו.
export const colors = {
  background: '#FFF8E7',
  surface: '#F2E6C9',
  card: '#F4C542',
  cardLocked: '#EDE0C8',

  text: '#3A2E1F',
  textMuted: '#7A6A52',
  textFaint: '#9C8B6F',
  textOnAccent: '#FFF8E7',

  accent: '#F7C948',
  accentStrong: '#F4C542',
  accentDeep: '#C9891B',
  accentBorder: '#E7D6AC',

  border: '#D8C9A8',
  placeholder: '#B7A97E',

  error: '#C0392B',
  errorDeep: '#B4342A',
  warning: '#B5651D',
  danger: '#D64545',

  line: '#C9A227',
  lineTrail: '#D8C08A',
} as const;

import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { radii } from './radii';
import { FONTS } from '../utils/fonts';

// סגנונות משותפים לכל המודאלים באפליקציה (דיווח על מילה/באג, אישור מחיקת
// התקדמות) - כדי שלא יתפזרו כמה עותקים כמעט-זהים של אותו overlay/card/כפתורים.
export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 46, 31, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    fontFamily: FONTS.regular,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    writingDirection: 'rtl',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  buttons: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: colors.cardLocked,
  },
  cancelText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: colors.text,
    writingDirection: 'rtl',
  },
  errorText: {
    fontFamily: FONTS.regular,
    marginTop: 10,
    fontSize: 13,
    color: colors.errorDeep,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import { isHapticEnabled, isSoundEffectsEnabled, setHapticEnabled, setSoundEffectsEnabled } from '../utils/settings';
import { CONFIRMATION_DURATION_MS } from '../utils/ui';
import { submitToWeb3Forms } from '../utils/web3forms';
import { FONTS } from '../utils/fonts';
import { MAX_CONTENT_WIDTH } from '../utils/responsive';

interface Props {
  onBack: () => void;
  onResetProgress: () => void;
}

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

// עמוד מדיניות הפרטיות מתארח כקובץ README מוצג ב-GitHub, כדי שלא יהיה
// צורך באחסון ותחזוקה של דף אינטרנט נפרד. אפל דורשת קישור נגיש מתוך
// האפליקציה עצמה (לא רק במטא-דאטה של החנות) לאפליקציות שמציגות פרסומות.
const PRIVACY_POLICY_URL = 'https://github.com/yovelamirtech/letter-wheel/blob/main/PRIVACY.md';

const TOGGLE_TRAVEL = 20; // מרחק ההחלקה של הכפתור בפיקסלים: רוחב המסילה (50) פחות הכפתור (24) פחות הריפוד משני הצדדים (3+3)

// מתג מותאם אישית במקום ה-Switch המובנה של react-native: על אנדרואיד/web
// ה-Switch המובנה מתעלם לפעמים מ-trackColor ומציג את צבע ה-accent הירוק
// של המערכת. הגרסה הזו בנויה מ-Animated.View כדי גם לשלוט בצבעים וגם
// להחליק את הכפתור בין המצבים במקום לקפוץ ביניהם.
function Toggle({ value, onValueChange }: ToggleProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackBackground = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E7D6AC', '#F4C542'],
  });
  const thumbBackground = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFF8E7', '#3A2E1F'],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOGGLE_TRAVEL],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        // הסדר חשוב: קודם לעדכן את הערך (שיכול לכבות/להדליק את הסאונד עצמו),
        // ורק אז לנגן את הצליל - כך שכיבוי המתג לא ישמיע צליל, והדלקתו כן.
        onValueChange(!value);
        playClickSound();
      }}
    >
      <Animated.View style={[styles.toggleTrack, { backgroundColor: trackBackground }]}>
        <Animated.View
          style={[styles.toggleThumb, { backgroundColor: thumbBackground, transform: [{ translateX }] }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ onBack, onResetProgress }: Props) {
  const [soundEffectsEnabled, setSoundEffectsEnabledState] = useState(isSoundEffectsEnabled());
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [bugReportVisible, setBugReportVisible] = useState(false);
  const [bugReportSentVisible, setBugReportSentVisible] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSending, setBugSending] = useState(false);
  const [bugError, setBugError] = useState<string | null>(null);

  function handleSoundEffectsChange(enabled: boolean) {
    setSoundEffectsEnabledState(enabled);
    setSoundEffectsEnabled(enabled);
  }

  function handleHapticChange(enabled: boolean) {
    setHapticEnabledState(enabled);
    setHapticEnabled(enabled);
  }

  function handleConfirmReset() {
    playClickSound();
    setConfirmVisible(false);
    onResetProgress();
  }

  // הודעת האישור נסגרת לבד; אפשר גם לסגור אותה מוקדם בנגיעה.
  // ה-cleanup מבטל את הטיימר אם המסך יורד או אם המשתמש סגר בעצמו,
  // כדי לא לעדכן state של קומפוננטה שכבר לא מוצגת.
  useEffect(() => {
    if (!bugReportSentVisible) return;
    const timer = setTimeout(() => setBugReportSentVisible(false), CONFIRMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [bugReportSentVisible]);

  function handleOpenPrivacyPolicy() {
    tapHaptic();
    playClickSound();
    Linking.openURL(PRIVACY_POLICY_URL);
  }

  function handleOpenBugReport() {
    tapHaptic();
    playClickSound();
    setBugError(null);
    setBugReportVisible(true);
  }

  function handleCloseBugReport() {
    // בזמן שליחה חוסמים סגירה כדי שהמודאל לא ייעלם באמצע הבקשה
    if (bugSending) return;
    playClickSound();
    setBugError(null);
    setBugReportVisible(false);
  }

  async function handleSubmitBugReport() {
    if (bugSending || !bugTitle.trim()) return;
    tapHaptic();
    playClickSound();
    setBugSending(true);
    setBugError(null);

    const result = await submitToWeb3Forms(`דיווח על באג: ${bugTitle.trim()}`, 'גלגל המילים - באג', {
      'כותרת': bugTitle.trim(),
      'מה קרה': bugDescription.trim() || 'לא צורף תיאור',
    });

    setBugSending(false);

    if (!result.success) {
      setBugError(result.message ?? 'השליחה נכשלה. נסו שוב.');
      return;
    }

    setBugReportVisible(false);
    setBugTitle('');
    setBugDescription('');
    setBugReportSentVisible(true);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            tapHaptic();
            playClickSound();
            onBack();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButton}>‹ חזרה</Text>
        </TouchableOpacity>
        <Text style={styles.title}>הגדרות</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>סאונד</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>אפקטים קוליים</Text>
            <Toggle value={soundEffectsEnabled} onValueChange={handleSoundEffectsChange} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>משוב</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>רטט (משוב הפטי)</Text>
            <Toggle value={hapticEnabled} onValueChange={handleHapticChange} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>עזרה</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleOpenBugReport}>
            <Text style={styles.rowLabel}>דיווח על באג</Text>
            <Text style={styles.chevron}>‹</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>מידע</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.rowLabel}>מדיניות פרטיות</Text>
            <Text style={styles.chevron}>‹</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() => {
            playClickSound();
            setConfirmVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.dangerButtonText}>מחיקת התקדמות</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>מחיקת התקדמות</Text>
            <Text style={styles.modalMessage}>
              האם אתם בטוחים? הפעולה תמחק את כל הניקוד והמילים שנמצאו, ולא ניתן לבטל אותה.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleConfirmReset}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>כן, למחוק</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  playClickSound();
                  setConfirmVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>לא</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={bugReportVisible} transparent animationType="fade" onRequestClose={handleCloseBugReport}>
        <View style={styles.modalOverlay}>
          <View style={styles.bugReportCard}>
            <Text style={styles.modalTitle}>דיווח על באג</Text>

            <Text style={styles.fieldLabel}>כותרת</Text>
            <TextInput
              style={styles.textInput}
              placeholder="תיאור קצר של הבעיה"
              placeholderTextColor="#B3A488"
              value={bugTitle}
              onChangeText={setBugTitle}
              textAlign="right"
              editable={!bugSending}
            />

            <Text style={styles.fieldLabel}>מה קרה?</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="ספרו לנו מה קרה, ואיך אפשר לשחזר את הבעיה"
              placeholderTextColor="#B3A488"
              value={bugDescription}
              onChangeText={setBugDescription}
              multiline
              numberOfLines={4}
              textAlign="right"
              editable={!bugSending}
            />

            {bugError !== null && <Text style={styles.errorText}>{bugError}</Text>}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.bugSubmitButton,
                  (bugSending || !bugTitle.trim()) && styles.modalButtonDisabled,
                ]}
                onPress={handleSubmitBugReport}
                activeOpacity={0.8}
                disabled={bugSending || !bugTitle.trim()}
              >
                <Text style={styles.bugSubmitText}>{bugSending ? 'שולח...' : 'שליחה'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, bugSending && styles.modalButtonDisabled]}
                onPress={handleCloseBugReport}
                activeOpacity={0.8}
                disabled={bugSending}
              >
                <Text style={styles.modalCancelText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={bugReportSentVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBugReportSentVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            playClickSound();
            setBugReportSentVisible(false);
          }}
        >
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>תודה! הדיווח נשלח</Text>
          </View>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: '#3A2E1F',
    writingDirection: 'rtl',
  },
  backButton: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: '#7A6A52',
    writingDirection: 'rtl',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#7A6A52',
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 28,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#F2E6C9',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E7D6AC',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowLabel: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: '#3A2E1F',
    writingDirection: 'rtl',
  },
  chevron: {
    fontSize: 18,
    color: '#9C8A66',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7D6AC',
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dangerButton: {
    marginTop: 32,
    backgroundColor: '#D64545',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#FFF8E7',
    writingDirection: 'rtl',
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
  bugReportCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#7A6A52',
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 14,
    marginBottom: 6,
  },
  textInput: {
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
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 10,
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
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmButton: {
    backgroundColor: '#D64545',
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
  bugSubmitButton: {
    backgroundColor: '#F4C542',
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
  bugSubmitText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#3A2E1F',
    writingDirection: 'rtl',
  },
  modalCancelText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#3A2E1F',
    writingDirection: 'rtl',
  },
  comingSoonCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 40,
  },
  comingSoonText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#3A2E1F',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});

import React, { useState } from 'react';
import { Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import { isHapticEnabled, isSoundEffectsEnabled, setHapticEnabled, setSoundEffectsEnabled } from '../utils/settings';
import { useReportForm } from '../hooks/useReportForm';
import ReportModal from '../components/ReportModal';
import Toggle from '../components/Toggle';
import { FONTS } from '../utils/fonts';
import { colors } from '../theme/colors';
import { modalStyles } from '../theme/modalStyles';
import { MAX_CONTENT_WIDTH } from '../utils/responsive';

interface Props {
  onBack: () => void;
  onResetProgress: () => void;
}

// עמוד מדיניות הפרטיות מתארח כקובץ README מוצג ב-GitHub, כדי שלא יהיה
// צורך באחסון ותחזוקה של דף אינטרנט נפרד. אפל דורשת קישור נגיש מתוך
// האפליקציה עצמה (לא רק במטא-דאטה של החנות) לאפליקציות שמציגות פרסומות.
const PRIVACY_POLICY_URL = 'https://github.com/yovelamirtech/letter-wheel/blob/main/PRIVACY.md';

export default function SettingsScreen({ onBack, onResetProgress }: Props) {
  const [soundEffectsEnabled, setSoundEffectsEnabledState] = useState(isSoundEffectsEnabled());
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled());
  const [confirmVisible, setConfirmVisible] = useState(false);

  const bugReport = useReportForm({
    fromName: 'גלגל המילים - באג',
    buildSubject: (title) => `דיווח על באג: ${title}`,
    buildFields: (title, description) => ({
      'כותרת': title,
      'מה קרה': description || 'לא צורף תיאור',
    }),
  });

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

  function handleOpenPrivacyPolicy() {
    tapHaptic();
    playClickSound();
    Linking.openURL(PRIVACY_POLICY_URL);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <TouchableOpacity style={styles.row} onPress={bugReport.open}>
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
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>מחיקת התקדמות</Text>
            <Text style={modalStyles.message}>
              האם אתם בטוחים? הפעולה תמחק את כל הניקוד והמילים שנמצאו, ולא ניתן לבטל אותה.
            </Text>
            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={[modalStyles.button, styles.dangerConfirmButton]}
                onPress={handleConfirmReset}
                activeOpacity={0.8}
              >
                <Text style={styles.dangerConfirmText}>כן, למחוק</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={() => {
                  playClickSound();
                  setConfirmVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.cancelText}>לא</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ReportModal
        visible={bugReport.visible}
        submitted={bugReport.submitted}
        title="דיווח על באג"
        message="ספרו לנו מה קרה, ואיך אפשר לשחזר את הבעיה, ונבדוק אותה."
        primaryField={{
          label: 'כותרת',
          value: bugReport.primary,
          onChangeText: bugReport.setPrimary,
          placeholder: 'תיאור קצר של הבעיה',
        }}
        secondaryField={{
          label: 'מה קרה?',
          value: bugReport.secondary,
          onChangeText: bugReport.setSecondary,
          placeholder: 'ספרו לנו מה קרה, ואיך אפשר לשחזר את הבעיה',
          multiline: true,
        }}
        sending={bugReport.sending}
        error={bugReport.error}
        canSubmit={bugReport.primary.trim().length > 0}
        onSubmit={bugReport.submit}
        onClose={bugReport.close}
        confirmationTitle="תודה!"
        confirmationMessage="הדיווח נשלח."
        submitButtonStyle={styles.bugSubmitButton}
        submitTextStyle={styles.bugSubmitText}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 12,
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
    color: colors.text,
    writingDirection: 'rtl',
  },
  backButton: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: colors.textMuted,
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
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 28,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.accentBorder,
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
    color: colors.text,
    writingDirection: 'rtl',
  },
  chevron: {
    fontSize: 18,
    color: colors.textFaint,
  },
  dangerButton: {
    marginTop: 32,
    backgroundColor: colors.danger,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: colors.background,
    writingDirection: 'rtl',
  },
  dangerConfirmButton: {
    backgroundColor: colors.danger,
  },
  dangerConfirmText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: colors.background,
    writingDirection: 'rtl',
  },
  bugSubmitButton: {
    backgroundColor: colors.card,
  },
  bugSubmitText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: colors.text,
    writingDirection: 'rtl',
  },
});

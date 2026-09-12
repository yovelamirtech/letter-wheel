import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import { isHapticEnabled, isSoundEffectsEnabled, setHapticEnabled, setSoundEffectsEnabled } from '../utils/settings';
import { useReportForm } from '../hooks/useReportForm';
import ReportModal from '../components/ReportModal';
import ConfirmModal from '../components/ConfirmModal';
import SettingsSection from '../components/SettingsSection';
import SettingsRow from '../components/SettingsRow';
import Toggle from '../components/Toggle';
import { FONTS } from '../utils/fonts';
import { colors } from '../theme/colors';
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
        <SettingsSection title="סאונד">
          <SettingsRow
            label="אפקטים קוליים"
            right={<Toggle value={soundEffectsEnabled} onValueChange={handleSoundEffectsChange} />}
          />
        </SettingsSection>

        <SettingsSection title="משוב">
          <SettingsRow
            label="רטט (משוב הפטי)"
            right={<Toggle value={hapticEnabled} onValueChange={handleHapticChange} />}
          />
        </SettingsSection>

        <SettingsSection title="עזרה">
          <SettingsRow label="דיווח על באג" onPress={bugReport.open} />
        </SettingsSection>

        <SettingsSection title="מידע">
          <SettingsRow label="מדיניות פרטיות" onPress={handleOpenPrivacyPolicy} />
        </SettingsSection>

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

      <ConfirmModal
        visible={confirmVisible}
        title="מחיקת התקדמות"
        message="האם אתם בטוחים? הפעולה תמחק את כל הניקוד והמילים שנמצאו, ולא ניתן לבטל אותה."
        confirmLabel="כן, למחוק"
        confirmButtonStyle={styles.dangerConfirmButton}
        confirmTextStyle={styles.dangerConfirmText}
        onConfirm={handleConfirmReset}
        onCancel={() => {
          playClickSound();
          setConfirmVisible(false);
        }}
      />

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

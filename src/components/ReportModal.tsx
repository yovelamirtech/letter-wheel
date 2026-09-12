import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { modalStyles } from '../theme/modalStyles';
import { playClickSound } from '../utils/sound';

interface FieldConfig {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}

interface Props {
  visible: boolean;
  submitted: boolean;
  title: string;
  message: string;
  primaryField: FieldConfig;
  secondaryField: FieldConfig;
  sending: boolean;
  error: string | null;
  canSubmit: boolean;
  onSubmit: () => void;
  onClose: () => void;
  confirmationTitle: string;
  confirmationMessage: string;
  submitButtonStyle?: object;
  submitTextStyle?: object;
}

// מודאל דיווח גנרי (משמש גם לדיווח על מילה שגויה במשחק וגם לדיווח על באג
// בהגדרות): שני שדות טקסט, שליחה, ומסך "תודה" שנסגר בנגיעה או לבד.
export default function ReportModal({
  visible,
  submitted,
  title,
  message,
  primaryField,
  secondaryField,
  sending,
  error,
  canSubmit,
  onSubmit,
  onClose,
  confirmationTitle,
  confirmationMessage,
  submitButtonStyle,
  submitTextStyle,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {submitted ? (
        <TouchableOpacity
          style={modalStyles.overlay}
          activeOpacity={1}
          onPress={() => {
            playClickSound();
            onClose();
          }}
        >
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>{confirmationTitle}</Text>
            <Text style={[modalStyles.message, styles.noMarginBottom]}>{confirmationMessage}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <KeyboardAvoidingView
          style={modalStyles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>{title}</Text>
            <Text style={modalStyles.message}>{message}</Text>

            {[primaryField, secondaryField].map((field) => (
              <React.Fragment key={field.label}>
                <Text style={modalStyles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={[modalStyles.input, field.multiline && modalStyles.inputMultiline]}
                  value={field.value}
                  onChangeText={field.onChangeText}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.placeholder}
                  textAlign="right"
                  multiline={field.multiline}
                  editable={!sending}
                />
              </React.Fragment>
            ))}

            {error !== null && <Text style={modalStyles.errorText}>{error}</Text>}

            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={[
                  modalStyles.button,
                  submitButtonStyle,
                  (sending || !canSubmit) && modalStyles.buttonDisabled,
                ]}
                onPress={onSubmit}
                activeOpacity={0.8}
                disabled={sending || !canSubmit}
              >
                <Text style={submitTextStyle}>{sending ? 'שולח...' : 'שליחה'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton, sending && modalStyles.buttonDisabled]}
                onPress={onClose}
                activeOpacity={0.8}
                disabled={sending}
              >
                <Text style={modalStyles.cancelText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  noMarginBottom: {
    marginBottom: 0,
  },
});

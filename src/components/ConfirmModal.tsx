import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { modalStyles } from '../theme/modalStyles';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonStyle?: object;
  confirmTextStyle?: object;
}

// מודאל אישור פעולה גנרי (כרגע: מחיקת התקדמות). לא אחראי על סאונד/רטט -
// אלה באחריות ה-callbacks שמועברים אליו.
export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'ביטול',
  onConfirm,
  onCancel,
  confirmButtonStyle,
  confirmTextStyle,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>
          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={[modalStyles.button, confirmButtonStyle]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={confirmTextStyle}>{confirmLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

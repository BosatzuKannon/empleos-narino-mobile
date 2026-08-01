// =======================================================
// CUSTOM DIALOG — Diálogo de confirmación reutilizable
// Basado en react-native-paper Dialog.
// Reglas UI: texto estrictamente alineado a la izquierda,
// colores provenientes únicamente de constants/Colors.ts
// =======================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import { Colors } from '@/constants/Colors';

export type DialogVariant = 'confirm' | 'danger' | 'info';

export interface CustomDialogProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  loading?: boolean;
  hideCancel?: boolean;
}

interface VariantConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
}

const VARIANT_CONFIG: Record<DialogVariant, VariantConfig> = {
  confirm: { icon: 'help-circle', color: Colors.primary, background: Colors.primaryBackground },
  danger: { icon: 'alert-circle', color: Colors.error, background: Colors.errorBackground },
  info: { icon: 'information-circle', color: Colors.info, background: Colors.infoBackground },
};

const CustomDialog = ({
  visible,
  title,
  message,
  variant = 'confirm',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  onDismiss,
  loading = false,
  hideCancel = false,
}: CustomDialogProps) => {
  const config = VARIANT_CONFIG[variant];
  const dismiss = onDismiss ?? onCancel;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={dismiss} style={styles.dialog}>
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: config.background }]}>
            <Ionicons name={config.icon} size={26} color={config.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <Dialog.Content>
          <Text style={styles.message}>{message}</Text>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          {!hideCancel && (
            <Button
              mode="text"
              textColor={Colors.textSecondary}
              onPress={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}
          <Button
            mode="contained"
            buttonColor={config.color}
            textColor={Colors.white}
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'left',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'left',
  },
  actions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});

export default CustomDialog;

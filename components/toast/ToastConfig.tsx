// =======================================================
// CONFIGURACIÓN GLOBAL DE react-native-toast-message
// Variantes: success, error, info, warning
// Reglas UI: texto estrictamente alineado a la izquierda,
// colores provenientes únicamente de constants/Colors.ts
// =======================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BaseToast,
  type BaseToastProps,
  type ToastConfig,
  type ToastConfigParams,
} from 'react-native-toast-message';
import { Colors } from '@/constants/Colors';

type IconName = keyof typeof Ionicons.glyphMap;

interface VariantStyle {
  color: string;
  background: string;
  icon: IconName;
}

const VARIANT_STYLES: Record<string, VariantStyle> = {
  success: { color: Colors.success, background: Colors.successBackground, icon: 'checkmark-circle' },
  error: { color: Colors.error, background: Colors.errorBackground, icon: 'alert-circle' },
  info: { color: Colors.info, background: Colors.infoBackground, icon: 'information-circle' },
  warning: { color: Colors.warning, background: Colors.warningBackground, icon: 'warning' },
};

interface AppToastProps extends BaseToastProps {
  type?: string;
}

function AppToast({ type = 'info', text1, text2, onPress }: AppToastProps) {
  const variant = VARIANT_STYLES[type] ?? VARIANT_STYLES.info;

  return (
    <BaseToast
      onPress={onPress}
      style={[styles.base, { borderLeftColor: variant.color }]}
      contentContainerStyle={styles.content}
      text1Style={[styles.text1, { color: variant.color }]}
      text1NumberOfLines={2}
      text2Style={styles.text2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={[styles.iconBadge, { backgroundColor: variant.background }]}>
          <Ionicons name={variant.icon} size={24} color={variant.color} />
        </View>
      )}
    />
  );
}

export const toastConfig: ToastConfig = {
  success: (params: ToastConfigParams<unknown>) => <AppToast {...params} />,
  error: (params: ToastConfigParams<unknown>) => <AppToast {...params} />,
  info: (params: ToastConfigParams<unknown>) => <AppToast {...params} />,
  warning: (params: ToastConfigParams<unknown>) => <AppToast {...params} />,
};

const styles = StyleSheet.create({
  base: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 14,
    borderLeftWidth: 5,
    backgroundColor: Colors.surface,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  content: {
    paddingHorizontal: 0,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  text1: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  text2: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'left',
    lineHeight: 18,
  },
});

// =======================================================
// CONFIGURACIÓN GLOBAL DE react-native-toast-message
// Variantes: success, error, info, warning
// Toast 100% custom: contraste garantizado (título oscuro sobre
// fondo blanco), sin depender de los estilos internos de la
// librería. El color semántico vive en el icono y el borde.
// Colores desde constants/Colors.ts.
// =======================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
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

interface AppToastProps {
  type?: string;
  text1?: string;
  text2?: string;
  onPress?: () => void;
  hide?: () => void;
}

function AppToast({ type = 'info', text1, text2, onPress, hide }: AppToastProps) {
  const variant = VARIANT_STYLES[type] ?? VARIANT_STYLES.info;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress ?? hide}
      style={[styles.base, { borderLeftColor: variant.color }]}
    >
      <View style={[styles.iconBadge, { backgroundColor: variant.background }]}>
        <Ionicons name={variant.icon} size={24} color={variant.color} />
      </View>
      <View style={styles.content}>
        {text1 ? (
          <Text style={styles.text1} numberOfLines={2}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={styles.text2} numberOfLines={3}>
            {text2}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingRight: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  text1: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'left',
    color: Colors.textPrimary,
  },
  text2: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'left',
    lineHeight: 18,
    marginTop: 2,
  },
});

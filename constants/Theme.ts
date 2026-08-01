// =======================================================
// TEMA DE MATERIAL 3 PARA react-native-paper
// Reutiliza la paleta global de constants/Colors.ts
// =======================================================

import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { Colors } from './Colors';

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 8,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    onPrimary: Colors.white,
    primaryContainer: Colors.primaryBackground,
    onPrimaryContainer: Colors.primaryDark,
    secondary: Colors.primaryLight,
    onSecondary: Colors.white,
    secondaryContainer: Colors.primaryBackground,
    onSecondaryContainer: Colors.primaryDark,
    tertiary: Colors.info,
    onTertiary: Colors.white,
    error: Colors.error,
    onError: Colors.white,
    errorContainer: Colors.errorBackground,
    onErrorContainer: Colors.error,
    background: Colors.background,
    onBackground: Colors.textPrimary,
    surface: Colors.surface,
    onSurface: Colors.textPrimary,
    surfaceVariant: '#F5F5F5',
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    outlineVariant: Colors.divider,
    inverseSurface: Colors.textPrimary,
    inverseOnSurface: Colors.white,
    inversePrimary: Colors.primaryLight,
  },
};

export default paperTheme;

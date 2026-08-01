// =======================================================
// PALETA GLOBAL DE LA APLICACIÓN
// Fuente única de color: importar siempre desde aquí.
// =======================================================

export const Colors = {
  // Brand / Verde primario
  primary: '#558B2F',
  primaryDark: '#33691E',
  primaryLight: '#8BC34A',
  primaryLighter: '#AED581',
  primaryBackground: '#E8F5E9',
  primaryBorder: '#C8E6C9',

  // Semánticos: éxito
  success: '#2E7D32',
  successBackground: '#E8F5E9',
  successBorder: '#C8E6C9',

  // Semánticos: error
  error: '#C62828',
  errorBackground: '#FFEBEE',
  errorBorder: '#FFCDD2',

  // Semánticos: advertencia
  warning: '#EF6C00',
  warningBackground: '#FFF3E0',
  warningBorder: '#FFE0B2',

  // Semánticos: información
  info: '#1565C0',
  infoBackground: '#E3F2FD',
  infoBorder: '#90CAF9',

  // Neutros / texto
  textPrimary: '#212121',
  textSecondary: '#666666',
  textDisabled: '#9E9E9E',
  textHint: '#BDBDBD',

  // Superficies y bordes
  background: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  divider: '#EEEEEE',

  // Base
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export default Colors;

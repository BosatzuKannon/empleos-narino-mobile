// =======================================================
// useAppAlerts — Servicio centralizado de alertas
//  - showSuccess / showError / showInfo / showWarning : toasts
//  - confirm(options)  : Promise<boolean> (Sí / No)
//  - alert(options)    : Promise<void>  (solo botón Aceptar)
//  - dialogElement     : <CustomDialog /> a renderizar en la pantalla
// =======================================================

import { useCallback, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import CustomDialog, {
  type CustomDialogProps,
  type DialogVariant,
} from '@/components/CustomDialog';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ConfirmOptions {
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

export interface AlertOptions {
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
}

interface DialogState {
  options: Omit<CustomDialogProps, 'visible' | 'onConfirm' | 'onCancel' | 'onDismiss'>;
  resolve: (value: boolean) => void;
}

export function useAppAlerts() {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  // ---------------- TOASTS ----------------
  const showToast = useCallback((type: ToastType, text1: string, text2?: string) => {
    Toast.show({ type, text1, text2, position: 'bottom' });
  }, []);

  const showSuccess = useCallback(
    (text1: string, text2?: string) => showToast('success', text1, text2),
    [showToast],
  );

  const showError = useCallback(
    (text1: string, text2?: string) => showToast('error', text1, text2),
    [showToast],
  );

  const showInfo = useCallback(
    (text1: string, text2?: string) => showToast('info', text1, text2),
    [showToast],
  );

  const showWarning = useCallback(
    (text1: string, text2?: string) => showToast('warning', text1, text2),
    [showToast],
  );

  // ---------------- DIALOGS ----------------
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setDialogState({
        options: {
          title: options.title,
          message: options.message,
          variant: options.variant,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          hideCancel: false,
        },
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setDialogState({
        options: {
          title: options.title,
          message: options.message,
          variant: options.variant,
          confirmText: options.confirmText,
          hideCancel: true,
        },
        resolve: () => resolve(),
      });
    });
  }, []);

  const closeDialog = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialogState(null);
  }, []);

  const handleConfirm = useCallback(() => closeDialog(true), [closeDialog]);
  const handleCancel = useCallback(() => closeDialog(false), [closeDialog]);

  const dialogElement = dialogState ? (
    <CustomDialog
      visible
      title={dialogState.options.title ?? ''}
      message={dialogState.options.message ?? ''}
      variant={dialogState.options.variant}
      confirmText={dialogState.options.confirmText}
      cancelText={dialogState.options.cancelText}
      hideCancel={dialogState.options.hideCancel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onDismiss={handleCancel}
    />
  ) : null;

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    confirm,
    alert,
    dialogElement,
  };
}

export default useAppAlerts;

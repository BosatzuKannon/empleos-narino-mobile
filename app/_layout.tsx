import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments, type Href } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";
import { toastConfig } from '@/components/toast/ToastConfig';
import { paperTheme } from '@/constants/Theme';
import { configureNotifications, registerPushToken } from '@/lib/pushNotifications';
import { extractRouteFromResponse } from '@/lib/notificationRouting';
import { useAuthStore } from '@/store/authStore';

// URL de la Play Store
const APP_PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.bosatzu.empleosnarino'; 

// =======================================================
// COMPONENTE DE BLOQUEO DE ACTUALIZACIÓN (MODAL)
// =======================================================
const BlockingUpdateModal = ({ isVisible, message }: { isVisible: boolean; message: string }) => {
  const handleUpdate = () => {
    Linking.openURL(APP_PLAYSTORE_URL);
  };
  
  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    container: {
      width: '85%',
      backgroundColor: '#ffffff',
      borderRadius: 15,
      padding: 25,
      alignItems: 'center',
    },
    icon: {
      marginBottom: 15,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#CC0000',
      marginBottom: 10,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: '#333',
      textAlign: 'center',
      marginBottom: 20,
    },
    button: {
      backgroundColor: '#558B2F',
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Ionicons name="alert-circle-outline" size={50} color="#CC0000" style={modalStyles.icon} />
          <Text style={modalStyles.title}>¡Actualización Obligatoria!</Text>
          <Text style={modalStyles.message}>{message}</Text>
          <TouchableOpacity 
            style={modalStyles.button} 
            onPress={handleUpdate}
          >
            <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />
            <Text style={modalStyles.buttonText}>Actualizar Ahora</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// =======================================================
// VISTA DE CARGA INICIAL
// =======================================================
const LoadingView = () => (
  <View style={loadingStyles.container}>
    <ActivityIndicator size="large" color="#558B2F" />
    <Text style={loadingStyles.text}>Cargando aplicación...</Text>
  </View>
);

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
});

// Hook para verificar si el usuario ya vio el onboarding 
function useOnboardingStatus() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(value === 'true');
      } catch (e) {
        console.error("Error reading onboarding status:", e);
      } finally {
        setIsReady(true);
      }
    };
    checkStatus();
  }, []);

  return { hasSeenOnboarding, isReady };
}

function MainNavigation() {
  const { isAuthenticated, isLoading, isOutdated, outdatedMessage, user } = useAuthStore(); 
  const { hasSeenOnboarding, isReady: isOnboardingReady } = useOnboardingStatus();
  const router = useRouter(); 
  const segments = useSegments(); 

  const [hasRedirected, setHasRedirected] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const protectedRoutes = ['applications', 'offers', 'profile', 'my-services'];
  const currentTopSegment = (segments[0] ?? '') as string;
  const isAuthRoute = currentTopSegment === 'auth';
  const isOnboardingScreen = currentTopSegment === 'onboarding';
  const isOnboardingRoleScreen = currentTopSegment === 'onboarding-role';
  const isTryingToAccessProtected = protectedRoutes.includes(segments[1] ?? ''); 

  // Usuarios creados vía Google aún no eligieron rol (PENDING) -> forzar onboarding de rol
  const userRole = user?.['custom:user_type'];
  const hasPendingRole = !!isAuthenticated && userRole === 'PENDING';

  // Deep linking: escucha el toque en una notificación y guarda la ruta destino
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        setPendingRoute(extractRouteFromResponse(response));
      },
    );

    // App abierta desde la notificación (estado muerto o en segundo plano)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      setPendingRoute(extractRouteFromResponse(response));
    });

    return () => subscription.remove();
  }, []);

  // Navega a la ruta pendiente solo cuando el usuario está autenticado y la app lista
  useEffect(() => {
    if (!pendingRoute || !isAuthenticated || isOutdated || isLoading) return;
    router.navigate(pendingRoute as Href);
    setPendingRoute(null);
  }, [pendingRoute, isAuthenticated, isOutdated, isLoading, router]);
  
  useEffect(() => {
    // Si ya redirigimos o no estamos listos, no hacer nada
    if (hasRedirected || isLoading || !isOnboardingReady || isOutdated) {
      return;
    }

    // Si no ha visto el onboarding y no está en onboarding, redirigir
    if (!hasSeenOnboarding && !isOnboardingScreen) {
      setHasRedirected(true);
      router.replace('/onboarding');
      return;
    }

    // Usuario autenticado con rol PENDING (Google) -> forzar selección de rol
    if (hasPendingRole && !isOnboardingRoleScreen) {
      setHasRedirected(true);
      router.replace('/onboarding-role' as Href);
      return;
    }

    // Si ya vio el onboarding pero no está autenticado y trata de acceder a rutas protegidas
    if (hasSeenOnboarding && !isAuthenticated && isTryingToAccessProtected) {
      setHasRedirected(true);
      router.replace('/auth/login');
      return;
    }
    
    // Si está autenticado y está en auth u onboarding, redirigir a tabs
    if (isAuthenticated && (isAuthRoute || isOnboardingScreen)) {
      setHasRedirected(true);
      router.replace('/(tabs)');
      return;
    }

    // Si está en una situación válida, marcar como redirigido para evitar ciclos
    setHasRedirected(true);
  }, [
    isAuthenticated, 
    isLoading, 
    isOutdated, 
    hasSeenOnboarding, 
    isOnboardingReady, 
    segments,
    hasRedirected, // Agregar hasRedirected como dependencia
    hasPendingRole,
    isOnboardingRoleScreen
  ]);

  // Reset hasRedirected cuando cambian las condiciones principales
  useEffect(() => {
    setHasRedirected(false);
  }, [isAuthenticated, hasSeenOnboarding, user]);

  if (isLoading || !isOnboardingReady) {
    return <LoadingView />; 
  }

  if (isOutdated) {
    return (
      <BlockingUpdateModal 
        isVisible={true} 
        message={outdatedMessage || "Es necesario actualizar la aplicación para continuar."} 
      />
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const checkAppVersion = useAuthStore((state) => state.checkAppVersion);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      await checkAppVersion();

      if (useAuthStore.getState().isAuthenticated) {
        await configureNotifications();
        await registerPushToken();
      }
    };
    init();
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <MainNavigation />
      <Toast config={toastConfig} /> 
    </PaperProvider>
  );
}
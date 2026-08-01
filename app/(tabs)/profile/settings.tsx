import GradientBackground from '@/components/GradientBackground';
import apiFetch from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// --- PALETA DE COLORES CONSISTENTE CON PROFILE SCREEN ---
const PRIMARY_GREEN = '#558B2F';
const DARK_TEXT = '#333333';
const GREY_TEXT = '#666666';
const CARD_BACKGROUND = '#ffffff';
const SEPARATOR_COLOR = '#f0f0f0';

const PREFERENCES_API = `${process.env.EXPO_PUBLIC_API_URL}/settings/preferences`;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Preferences {
  emailTransactional: boolean;
  emailMarketing: boolean;
  pushNotifications: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  emailTransactional: true,
  emailMarketing: false,
  pushNotifications: true,
};

interface PreferenceRow {
  key: keyof Preferences;
  icon: IoniconName;
  title: string;
  description: string;
}

const PREFERENCE_ROWS: PreferenceRow[] = [
  {
    key: 'pushNotifications',
    icon: 'notifications-outline',
    title: 'Notificaciones Push',
    description: 'Recibe avisos sobre postulaciones y vacantes.',
  },
  {
    key: 'emailTransactional',
    icon: 'mail-unread-outline',
    title: 'Emails transaccionales',
    description: 'Confirmaciones y estado de tus solicitudes.',
  },
  {
    key: 'emailMarketing',
    icon: 'megaphone-outline',
    title: 'Emails de marketing',
    description: 'Promociones y novedades de Empleos Nariño.',
  },
];

const SettingsScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Preferences | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ preferences?: Preferences }>(PREFERENCES_API, {
        authenticated: true,
      });

      if (isMounted.current && data?.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      if (isMounted.current) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se pudieron cargar tus preferencias.',
          position: 'bottom',
        });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleToggle = async (key: keyof Preferences, value: boolean) => {
    const previous = preferences[key];

    setPreferences((prev) => ({ ...prev, [key]: value }));
    setSavingKey(key);

    try {
      await apiFetch(PREFERENCES_API, {
        method: 'PATCH',
        authenticated: true,
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      setPreferences((prev) => ({ ...prev, [key]: previous }));
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo guardar el cambio. Inténtalo de nuevo.',
        position: 'bottom',
      });
    } finally {
      if (isMounted.current) {
        setSavingKey(null);
      }
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeAreaContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Cargando preferencias...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Header con botón de regreso */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={24} color={DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>

          <View style={styles.optionsGroup}>
            {PREFERENCE_ROWS.map((row, index) => (
              <View
                key={row.key}
                style={[
                  styles.listItemContainer,
                  index === PREFERENCE_ROWS.length - 1 && styles.lastItem,
                ]}
              >
                <View style={styles.rowContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={row.icon} size={26} color={PRIMARY_GREEN} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <Text style={styles.rowDescription}>{row.description}</Text>
                  </View>
                  <Switch
                    value={preferences[row.key]}
                    onValueChange={(value) => handleToggle(row.key, value)}
                    trackColor={{ false: '#c8c8c8', true: PRIMARY_GREEN }}
                    thumbColor="#ffffff"
                    ios_backgroundColor="#c8c8c8"
                    disabled={savingKey !== null}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={PRIMARY_GREEN}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Los cambios se guardan automáticamente al activar o desactivar
              cada opción.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    marginBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: SEPARATOR_COLOR,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
  },
  headerSpacer: {
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: GREY_TEXT,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  optionsGroup: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  listItemContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR_COLOR,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_TEXT,
    textAlign: 'left',
  },
  rowDescription: {
    fontSize: 13,
    color: GREY_TEXT,
    marginTop: 2,
    textAlign: 'left',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 15,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: DARK_TEXT,
    lineHeight: 18,
    textAlign: 'left',
  },
});

export default SettingsScreen;

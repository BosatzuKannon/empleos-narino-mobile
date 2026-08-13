import GradientBackground from '@/components/GradientBackground';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message'; // <-- IMPORTACIÓN AÑADIDA

// --- PALETA DE COLORES Y ESTILOS BASADOS EN HomeScreen ---
const PRIMARY_GREEN = '#558B2F';
const ERROR_RED = '#CC0000';
const DARK_TEXT = '#333333';
const GREY_TEXT = '#666666';
const CARD_BACKGROUND = '#ffffff';
const SEPARATOR_COLOR = '#f0f0f0';

// --- Opciones de la Sección de Configuración (SOLO Configuración de Perfil) ---
const SETTINGS_OPTIONS = [
  { icon: 'create-outline', title: 'Configuración de Perfil', description: 'Edita tu información personal', route: 'edit-profile' },
];

// --- Opciones de la Sección de Preferencias ---
const PREFERENCES_OPTIONS = [
  { icon: 'notifications-outline', title: 'Configuración', description: 'Notificaciones y preferencias', route: 'settings' },
];

// --- Opciones de la Sección Acerca de ---
const ABOUT_OPTIONS = [
  { icon: 'help-circle-outline', title: 'Centro de Ayuda', description: '', route: 'help' },
  { icon: 'book-outline', title: 'Términos y Condiciones', description: '', route: 'terms' },
  { icon: 'shield-checkmark-outline', title: 'Política de Privacidad', description: '', route: 'privacy' },
];

const ProfileScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const displayName = user
    ? `${user.given_name || ''} ${user.family_name || ''}`.trim() || 'Usuario'
    : 'Usuario';
  const userEmail = user?.email || '';

  // Función de navegación
  const handlePress = (route: string) => {
    switch(route) {
      case 'privacy':
        router.push('/profile/privacy');
        break;
      case 'terms':
        router.push('/profile/terms');
        break;
      case 'help':
        router.push('/profile/help');
        break;
      case 'edit-profile':
        router.push('/profile/edit-profile');
        break;
      case 'settings':
        router.push('/profile/settings');
        break;
      case 'support':
        router.push('/profile/support');
        break;
      default:
        console.log(`Ruta no definida: ${route}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      Toast.show({ type: 'success', text1: 'Sesión cerrada con éxito.', position: 'bottom' });
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    } finally {
      router.replace('/');
    }
  };

  const SettingsListItem = ({ icon, title, description, onPress, isLogout = false }: any) => (
    <View style={isLogout ? {} : styles.listItemContainer}>
      <List.Item
        title={title}
        description={description}
        descriptionStyle={styles.listItemDescription} 
        left={props => (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={28}
              color={isLogout ? ERROR_RED : PRIMARY_GREEN} 
              style={styles.listItemIcon}
            />
          </View>
        )}
        right={props => (
          !isLogout && (
            <Ionicons
              name="chevron-forward-outline"
              size={26}
              color={GREY_TEXT}
            />
          )
        )}
        onPress={onPress}
        titleStyle={isLogout ? styles.logoutTitle : styles.listItemTitle}
        style={styles.listItem}
      />
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* --- Cabecera de Saludo y Perfil (DINÁMICA) --- */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.userName}>{displayName}</Text>
            {userEmail ? <Text style={styles.userEmail}>{userEmail}</Text> : null}
          </View>

          {/* --- Card de Acción Destacada: APOYA ESTE EMPRENDIMIENTO NARIÑENSE --- */}
          <Card
            style={[styles.mainActionCard, { backgroundColor: CARD_BACKGROUND }]}
            onPress={() => handlePress('support')}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconCircle, { backgroundColor: PRIMARY_GREEN }]}>
                 <Ionicons name="heart-outline" size={38} color="#fff" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Apoya este emprendimiento nariñense</Text>
                <Text style={styles.cardSubtitle}>Tu apoyo hace la diferencia</Text>
              </View>
              <Ionicons name="arrow-forward-outline" size={28} color={GREY_TEXT} />
            </View>
          </Card>

          {/* --- Sección de MI CUENTA --- */}
          <Text style={styles.sectionTitle}>Mi Cuenta</Text>
          <View style={styles.optionsGroup}>
            {SETTINGS_OPTIONS.map((item) => (
              <SettingsListItem
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onPress={() => handlePress(item.route)}
              />
            ))}
          </View>
          
          {/* --- Sección de PREFERENCIAS --- */}
          <Text style={styles.sectionTitle}>Preferencias</Text>
          <View style={styles.optionsGroup}>
            {PREFERENCES_OPTIONS.map((item) => (
              <SettingsListItem
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onPress={() => handlePress(item.route)}
              />
            ))}
          </View>

          {/* --- Sección de ACERCA DE --- */}
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.optionsGroup}>
            {ABOUT_OPTIONS.map((item) => (
              <SettingsListItem
                key={item.title}
                icon={item.icon}
                title={item.title}
                onPress={() => handlePress(item.route)}
                description={item.description}
              />
            ))}
            {/* Elemento de versión de App sin interacción */}
             <View style={styles.versionContainer}>
                <Text style={styles.versionText}>Versión 3.1.1 (Build 202608)</Text>
             </View>
          </View>

          {/* --- Botón de Cerrar Sesión --- */}
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: PRIMARY_GREEN }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40, 
  },
  header: {
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '500',
    color: GREY_TEXT,
  },
  userName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: DARK_TEXT,
  },
  userEmail: { // Nuevo estilo para mostrar el correo
    fontSize: 14,
    color: GREY_TEXT,
    marginTop: 4,
    paddingLeft: 5,
  },
  mainActionCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
  },
  cardSubtitle: {
    fontSize: 14,
    color: GREY_TEXT,
    marginTop: 2,
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
    marginBottom: 30,
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
  listItem: {
    paddingVertical: 2,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_TEXT,
    marginLeft: 15, 
  },
  listItemDescription: {
    color: GREY_TEXT, 
    fontSize: 13,
    marginLeft: 15, 
  },
  iconContainer: {
    width: 40, 
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10, 
  },
  listItemIcon: {
    alignSelf: 'center', 
    marginRight: 5, 
    width: 32,
    textAlign: 'center'
  },
  versionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SEPARATOR_COLOR,
  },
  versionText: {
    fontSize: 13,
    color: GREY_TEXT,
    textAlign: 'center',
  },
  logoutButton: {
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ERROR_RED,
    marginLeft: 15, 
  }
});

export default ProfileScreen;

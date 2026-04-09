import GradientBackground from '@/components/GradientBackground';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- PALETA DE COLORES CONSISTENTE CON PROFILE SCREEN ---
const PRIMARY_GREEN = '#558B2F';
const DARK_TEXT = '#333333';
const GREY_TEXT = '#666666';
const CARD_BACKGROUND = '#ffffff';

const PrivacyPolicyScreen = () => {
  const router = useRouter();

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
          <Text style={styles.headerTitle}>Política de Privacidad</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Card de Introducción */}
          <View style={styles.introCard}>
            <View style={[styles.iconCircle, { backgroundColor: PRIMARY_GREEN }]}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.introTitle}>Tu Privacidad es Nuestra Prioridad</Text>
            <Text style={styles.introText}>
              En Empleos Nariño nos comprometemos a proteger tu información personal 
              y ser transparentes sobre cómo la utilizamos.
            </Text>
          </View>

          {/* Sección de Recopilación de Información */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información que Recopilamos</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Información de perfil (nombre, email, información profesional)</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Datos de postulación a ofertas laborales</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Información de uso de la aplicación</Text>
            </View>
          </View>

          {/* Sección de Uso de Información */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cómo Utilizamos tu Información</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Facilitar el proceso de postulación a empleos</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Personalizar tu experiencia en la aplicación</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Mejorar nuestros servicios</Text>
            </View>
          </View>

          {/* Sección PRINCIPAL: Compartición de Información */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compartición de Información</Text>
            <View style={styles.highlightCard}>
              <Ionicons name="information-circle-outline" size={24} color={PRIMARY_GREEN} />
              <Text style={styles.highlightText}>
                <Text style={styles.boldText}>NO compartimos tu información personal con terceros</Text>, 
                excepto cuando te postulas a una oferta laboral.
              </Text>
            </View>
            
            <Text style={styles.subsectionTitle}>Cuando te postulas a una oferta:</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="business-outline" size={16} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Compartimos tu información únicamente con el empleador </Text> 
                de la oferta a la que te postulas
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="document-text-outline" size={16} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                Solo se comparte la información necesaria para el proceso de selección
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="eye-off-outline" size={16} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                Tu información no es visible para otros usuarios ni empresas
              </Text>
            </View>
          </View>

          {/* Sección de Seguridad */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Protección de tus Datos</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Implementamos medidas de seguridad avanzadas</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Acceso restringido a información sensible</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Cumplimiento con normativas de protección de datos</Text>
            </View>
          </View>

          {/* Sección de Tus Derechos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tus Derechos</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Acceder a tu información personal</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Corregir información inexacta</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Solicitar la eliminación de tu cuenta</Text>
            </View>
          </View>

          {/* Contacto */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>¿Preguntas o Consultas?</Text>
            <Text style={styles.contactText}>
              Si tienes alguna pregunta sobre nuestra política de privacidad, 
              contáctanos en:{' '}
              <Text style={styles.contactEmail}>carlos87jaramillo@gmail.com</Text>
            </Text>
          </View>

          {/* Fecha de actualización */}
          <View style={styles.updateSection}>
            <Text style={styles.updateText}>Última actualización: Septiembre 2025</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    marginBottom:50
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  introCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_TEXT,
    textAlign: 'center',
    marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    color: GREY_TEXT,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 15,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_TEXT,
    marginTop: 15,
    marginBottom: 10,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: DARK_TEXT,
    marginLeft: 10,
    lineHeight: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletIcon: {
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: DARK_TEXT,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: PRIMARY_GREEN,
  },
  contactSection: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: GREY_TEXT,
    lineHeight: 20,
  },
  contactEmail: {
    color: PRIMARY_GREEN,
    fontWeight: '600',
  },
  updateSection: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  updateText: {
    fontSize: 12,
    color: GREY_TEXT,
    fontStyle: 'italic',
  },
});

export default PrivacyPolicyScreen;
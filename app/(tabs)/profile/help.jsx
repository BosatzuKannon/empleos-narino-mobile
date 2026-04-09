import GradientBackground from '@/components/GradientBackground';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- PALETA DE COLORES CONSISTENTE CON PROFILE SCREEN ---
const PRIMARY_GREEN = '#558B2F';
const DARK_TEXT = '#333333';
const GREY_TEXT = '#666666';
const CARD_BACKGROUND = '#ffffff';

const HelpCenterScreen = () => {
  const router = useRouter();

  const handleContactPress = () => {
    Linking.openURL('mailto:carlos87jaramillo@gmail.com?subject=Consulta%20Empleos%20Nariño');
  };

  const handleWhatsAppPress = () => {
    Linking.openURL('https://wa.me/573175345577?text=Hola,%20necesito%20ayuda%20con%20Empleos%20Nariño');
  };

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
          <Text style={styles.headerTitle}>Centro de Ayuda</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Card de Introducción */}
          <View style={styles.introCard}>
            <View style={[styles.iconCircle, { backgroundColor: PRIMARY_GREEN }]}>
              <Ionicons name="help-circle-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.introTitle}>¿Cómo podemos ayudarte?</Text>
            <Text style={styles.introText}>
              Encuentra respuestas a las preguntas más frecuentes y contacta con nuestro equipo de soporte.
            </Text>
          </View>

          {/* Sección: Preguntas Frecuentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>¿Cómo creo una cuenta?</Text>
              <Text style={styles.faqAnswer}>
                Ve a la sección de registro, completa tu información personal y verifica tu email.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>¿Cómo publico una oferta laboral?</Text>
              <Text style={styles.faqAnswer}>
                En la pestaña "Mis Ofertas", haz click en el botón "+" y completa el formulario con los detalles de la vacante.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>¿Cuánto cuesta publicar una oferta?</Text>
              <Text style={styles.faqAnswer}>
                La publicación tiene un costo de $8.000 pesos por oferta, con duración de 1 mes.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>¿Cómo me postulo a una oferta?</Text>
              <Text style={styles.faqAnswer}>
                En la pantalla de inicio, busca la oferta que te interese y haz click en "Postularse ahora".
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>¿Puedo editar mi perfil?</Text>
              <Text style={styles.faqAnswer}>
                Sí, ve a "Configuración de Perfil" en tu cuenta para actualizar tu información.
              </Text>
            </View>
          </View>

          {/* Sección: Solución de Problemas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solución de Problemas</Text>
            
            <View style={styles.troubleshootItem}>
              <Ionicons name="refresh-circle-outline" size={20} color={PRIMARY_GREEN} />
              <View style={styles.troubleshootContent}>
                <Text style={styles.troubleshootTitle}>La aplicación no carga</Text>
                <Text style={styles.troubleshootDescription}>
                  Verifica tu conexión a internet y reinicia la aplicación.
                </Text>
              </View>
            </View>

            <View style={styles.troubleshootItem}>
              <Ionicons name="image-outline" size={20} color={PRIMARY_GREEN} />
              <View style={styles.troubleshootContent}>
                <Text style={styles.troubleshootTitle}>No puedo subir imágenes</Text>
                <Text style={styles.troubleshootDescription}>
                  Asegúrate de dar permisos de cámara y galería a la aplicación.
                </Text>
              </View>
            </View>

            <View style={styles.troubleshootItem}>
              <Ionicons name="log-in-outline" size={20} color={PRIMARY_GREEN} />
              <View style={styles.troubleshootContent}>
                <Text style={styles.troubleshootTitle}>Problemas para iniciar sesión</Text>
                <Text style={styles.troubleshootDescription}>
                  Verifica tu email y contraseña. Si olvidaste tu contraseña, usa la opción "Recuperar contraseña".
                </Text>
              </View>
            </View>
          </View>

          {/* Sección: Contacto de Soporte */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>¿No encuentras lo que buscas?</Text>
            <Text style={styles.contactSubtitle}>Contáctanos directamente</Text>
            
            <TouchableOpacity style={styles.contactButton} onPress={handleContactPress}>
              <Ionicons name="mail-outline" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>Enviar Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactButton, styles.whatsappButton]} onPress={handleWhatsAppPress}>
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            <View style={styles.contactInfo}>
              <Text style={styles.contactInfoText}>
                <Text style={styles.bold}>Horario de atención:</Text> Lunes a Viernes 8:00 AM - 6:00 PM
              </Text>
              <Text style={styles.contactInfoText}>
                <Text style={styles.bold}>Email:</Text> carlos87jaramillo@empleosnarino.com
              </Text>
              <Text style={styles.contactInfoText}>
                <Text style={styles.bold}>Tiempo de respuesta:</Text> Máximo 24 horas
              </Text>
            </View>
          </View>

          {/* Sección: Actualizaciones */}
          <View style={styles.updateSection}>
            <Ionicons name="megaphone-outline" size={20} color={PRIMARY_GREEN} />
            <Text style={styles.updateText}>
              ¿Tienes sugerencias para mejorar la aplicación? ¡Nos encantaría escucharte!
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
    marginBottom:30
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
  faqItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_TEXT,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: GREY_TEXT,
    lineHeight: 20,
  },
  troubleshootItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  troubleshootContent: {
    flex: 1,
    marginLeft: 12,
  },
  troubleshootTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  troubleshootDescription: {
    fontSize: 13,
    color: GREY_TEXT,
    lineHeight: 18,
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
    marginBottom: 5,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: 14,
    color: GREY_TEXT,
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  contactInfo: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactInfoText: {
    fontSize: 13,
    color: GREY_TEXT,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '600',
    color: DARK_TEXT,
  },
  updateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  updateText: {
    flex: 1,
    fontSize: 13,
    color: DARK_TEXT,
    marginLeft: 10,
    lineHeight: 18,
  },
});

export default HelpCenterScreen;
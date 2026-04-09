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

const TermsConditionsScreen = () => {
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
          <Text style={styles.headerTitle}>Términos y Condiciones</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Card de Introducción */}
          <View style={styles.introCard}>
            <View style={[styles.iconCircle, { backgroundColor: PRIMARY_GREEN }]}>
              <Ionicons name="document-text-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.introTitle}>Términos de Uso</Text>
            <Text style={styles.introText}>
              Al utilizar Empleos Nariño, aceptas los siguientes términos y condiciones. 
              Por favor léelos cuidadosamente.
            </Text>
          </View>

          {/* Sección: Aceptación de Términos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
            <Text style={styles.paragraph}>
              Al registrarte y utilizar la aplicación Empleos Nariño, aceptas cumplir 
              con estos términos y condiciones en su totalidad.
            </Text>
          </View>

          {/* Sección: Uso de la Plataforma */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Uso de la Plataforma</Text>
            
            <Text style={styles.subsectionTitle}>Como Usuario Buscador de Empleo:</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Puedes buscar y postularte a ofertas laborales</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Debes proporcionar información veraz y actualizada</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Eres responsable de la información que compartes</Text>
            </View>

            <Text style={styles.subsectionTitle}>Como Empresa Publicadora:</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Debes publicar ofertas laborales reales y verificadas</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Cumplir con las leyes laborales colombianas</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Procesar las postulaciones de manera ética</Text>
            </View>
          </View>

          {/* Sección: Publicación de Ofertas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Publicación de Ofertas Laborales</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Las ofertas deben incluir información veraz sobre salario, horarios y beneficios</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Prohibida la discriminación por género, edad, raza o religión</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Cumplimiento del salario mínimo legal vigente</Text>
            </View>
          </View>

          {/* Sección: Proceso de Postulación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Proceso de Postulación</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Al postularte, autorizas compartir tu información con el empleador</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Los empleadores se comprometen a manejar tu información confidencialmente</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="ellipse" size={8} color={PRIMARY_GREEN} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Empleos Nariño no garantiza la contratación</Text>
            </View>
          </View>

          {/* Sección: Conducta Prohibida */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Conducta Prohibida</Text>
            <View style={styles.warningCard}>
              <Ionicons name="warning-outline" size={24} color="#FF6B35" />
              <Text style={styles.warningText}>
                No está permitido: Publicar información falsa, acosar a otros usuarios, 
                utilizar la plataforma para fines ilícitos, o suplantar identidades.
              </Text>
            </View>
          </View>

          {/* Sección: Propiedad Intelectual */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Propiedad Intelectual</Text>
            <Text style={styles.paragraph}>
              Todos los derechos de propiedad intelectual sobre la plataforma Empleos Nariño 
              son propiedad de sus creadores. El contenido publicado por usuarios es de su responsabilidad.
            </Text>
          </View>

          {/* Sección: Limitación de Responsabilidad */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Limitación de Responsabilidad</Text>
            <Text style={styles.paragraph}>
              Empleos Nariño actúa como intermediario entre buscadores de empleo y empresas. 
              No nos hacemos responsables por acuerdos laborales entre las partes.
            </Text>
          </View>

          {/* Sección: Modificaciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Modificaciones de los Términos</Text>
            <Text style={styles.paragraph}>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Las changes serán notificadas a través de la aplicación.
            </Text>
          </View>

          {/* Sección: Ley Aplicable - CORREGIDA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Ley Aplicable</Text>
            <Text style={styles.paragraph}>
              Estos términos se rigen por las leyes de la República de Colombia. 
              Cualquier disputa será resuelta en los tribunales competentes de Pasto, Nariño.
            </Text>
          </View>

          {/* Contacto */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>¿Tienes Preguntas?</Text>
            <Text style={styles.contactText}>
              Si tienes alguna duda sobre estos términos y condiciones, 
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
  paragraph: {
    fontSize: 14,
    color: DARK_TEXT,
    lineHeight: 20,
    marginBottom: 10,
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: DARK_TEXT,
    marginLeft: 10,
    lineHeight: 20,
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

export default TermsConditionsScreen;
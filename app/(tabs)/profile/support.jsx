import GradientBackground from '@/components/GradientBackground';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Alert,
    Clipboard,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- PALETA DE COLORES ---
const PRIMARY_GREEN = '#558B2F';
const DARK_TEXT = '#333333';
const GREY_TEXT = '#666666';
const CARD_BACKGROUND = '#ffffff';

const SupportScreen = () => {
  const router = useRouter();

  const handleSupportPress = (type: string) => {
    switch(type) {
      case 'nequi':
        Alert.alert(
          'Donar por Nequi',
          'Puedes enviar tu aporte al número: 317 534 55 77\n\n¿Quieres copiar el número al portapapeles?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Copiar Número', 
              onPress: () => {
                Clipboard.setString('3175345577');
                Alert.alert('Éxito', 'Número copiado al portapapeles');
              }
            },
            { 
              text: 'Abrir Nequi', 
              onPress: () => Linking.openURL('https://nequi.com') 
            }
          ]
        );
        break;
      case 'contact':
        Linking.openURL('https://wa.me/573175345577');
        break;
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    Clipboard.setString(text);
    Alert.alert('Éxito', message);
  };

  const SupportCard = ({ icon, title, description, buttonText, onPress, color = PRIMARY_GREEN }: any) => (
    <View style={styles.supportCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <Ionicons name={icon} size={32} color="#fff" />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.supportButton, { backgroundColor: color }]}
        onPress={onPress}
      >
        <Text style={styles.supportButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeAreaContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back-outline" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Apoya este Emprendimiento</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={[styles.iconCircleLarge, { backgroundColor: PRIMARY_GREEN }]}>
              <Ionicons name="heart" size={48} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Tu Apoyo Hace la Diferencia</Text>
            <Text style={styles.heroSubtitle}>
              Esta aplicación es desarrollada con 💚 para el departamento de Nariño
            </Text>
          </View>

          {/* Story Section */}
          <View style={styles.storyCard}>
            <Text style={styles.storyTitle}>Nuestra Historia</Text>
            <Text style={styles.storyText}>
              💻 Esta aplicación no está respaldada por ninguna empresa grande ni entidad gubernamental. 
              Soy un desarrollador independiente comprometido con mejorar las oportunidades laborales 
              en nuestro querido departamento de Nariño.
            </Text>
            <Text style={styles.storyText}>
              🚀 Cada funcionalidad, cada mejora y cada hora de desarrollo representa un esfuerzo 
              personal y recursos invertidos para brindarte la mejor experiencia posible.
            </Text>
            <Text style={styles.storyText}>
              🌟 Tu apoyo me permite continuar manteniendo la aplicación, agregar nuevas funciones 
              y asegurar que siga siendo completamente gratuita para todos los nariñenses.
            </Text>
          </View>

          {/* Donation Section - Destacada */}
          <View style={styles.donationHighlight}>
            <View style={styles.donationHeader}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.donationTitle}>Donación por Nequi</Text>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <View style={styles.nequiCard}>
              <View style={styles.nequiInfo}>
                <Ionicons name="phone-portrait-outline" size={40} color="#8247B4" />
                <View style={styles.nequiDetails}>
                  <Text style={styles.nequiNumber}>317 534 55 77</Text>
                  <Text style={styles.nequiLabel}>Número de Nequi</Text>
                </View>
              </View>
              <View style={styles.nequiActions}>
                <TouchableOpacity 
                  style={[styles.nequiButton, styles.copyButton]}
                  onPress={() => copyToClipboard('3175345577', 'Número de Nequi copiado')}
                >
                  <Ionicons name="copy-outline" size={20} color="#8247B4" />
                  <Text style={[styles.nequiButtonText, { color: '#8247B4' }]}>Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.nequiButton, styles.donateButton]}
                  onPress={() => handleSupportPress('nequi')}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                  <Text style={[styles.nequiButtonText, { color: '#FFFFFF' }]}>Donar</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.donationNote}>
              💜 Puedes enviar cualquier monto, por pequeño que sea. ¡Cada aporte cuenta!
            </Text>
          </View>

          {/* Support Options */}
          <Text style={styles.sectionTitle}>Otras Formas de Apoyar</Text>

          <SupportCard
            icon="bulb-outline"
            title="Sugerencias e Ideas"
            description="¿Tienes ideas para mejorar la app? Tu feedback es invaluable para hacer crecer este proyecto y adaptarlo a las necesidades reales de Nariño."
            buttonText="Enviar Ideas"
            onPress={() => handleSupportPress('contact')}
            color="#FF9800"
          />

          <SupportCard
            icon="business-outline"
            title="Para Empresas"
            description="Si representas una empresa interesada en patrocinar, colaborar o publicar ofertas laborales, estaré encantado de conversar contigo."
            buttonText="Contactar"
            onPress={() => handleSupportPress('contact')}
            color="#9C27B0"
          />

          {/* Cost Breakdown */}
          <View style={styles.costSection}>
            <Text style={styles.costTitle}>¿A dónde va tu apoyo?</Text>
            <View style={styles.costList}>
              <View style={styles.costItem}>
                <Ionicons name="server-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.costText}>Servidores y hosting</Text>
              </View>
              <View style={styles.costItem}>
                <Ionicons name="cloud-upload-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.costText}>Almacenamiento de archivos</Text>
              </View>
              <View style={styles.costItem}>
                <Ionicons name="code-slash-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.costText}>Desarrollo de nuevas funciones</Text>
              </View>
              <View style={styles.costItem}>
                <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.costText}>Mantenimiento y seguridad</Text>
              </View>
            </View>
          </View>

          {/* Final Message */}
          <View style={styles.finalMessage}>
            <Ionicons name="heart-circle-outline" size={40} color={PRIMARY_GREEN} />
            <Text style={styles.finalText}>
              Gracias por considerar apoyar este proyecto. Tu contribución, sin importar el monto, 
              me ayuda a seguir trabajando para hacer de Nariño un departamento con más y mejores 
              oportunidades laborales para todos.
            </Text>
            <Text style={styles.finalSignature}>
              - Un desarrollador nariñense
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
    marginBottom:40
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_TEXT,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_TEXT,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: GREY_TEXT,
    textAlign: 'center',
    lineHeight: 22,
  },
  storyCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 15,
  },
  storyText: {
    fontSize: 14,
    color: GREY_TEXT,
    lineHeight: 20,
    marginBottom: 12,
  },
  donationHighlight: {
    marginBottom: 30,
  },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  donationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  nequiCard: {
    backgroundColor: '#F8F5FF',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#8247B4',
    marginBottom: 10,
  },
  nequiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  nequiDetails: {
    marginLeft: 15,
    flex: 1,
  },
  nequiNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8247B4',
    marginBottom: 5,
  },
  nequiLabel: {
    fontSize: 14,
    color: GREY_TEXT,
  },
  nequiActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nequiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  copyButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8247B4',
  },
  donateButton: {
    backgroundColor: '#8247B4',
  },
  nequiButtonText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  donationNote: {
    fontSize: 14,
    color: GREY_TEXT,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 15,
    marginTop: 10,
  },
  supportCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: GREY_TEXT,
    lineHeight: 18,
  },
  supportButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  costSection: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  costTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_TEXT,
    marginBottom: 15,
    textAlign: 'center',
  },
  costList: {
    gap: 12,
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costText: {
    fontSize: 14,
    color: GREY_TEXT,
    marginLeft: 10,
    flex: 1,
  },
  finalMessage: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  finalText: {
    fontSize: 16,
    color: GREY_TEXT,
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: 15,
  },
  finalSignature: {
    fontSize: 14,
    fontStyle: 'italic',
    color: DARK_TEXT,
    fontWeight: '500',
  },
});

export default SupportScreen;
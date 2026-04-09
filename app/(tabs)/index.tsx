import hiringPlaceholder from '@/assets/images/hiring.png';
import logo from '@/assets/images/logo.png';
import GradientBackground from '@/components/GradientBackground';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/offers/getActiveOffers';
const APPLY_API_URL = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/offers/applyToJob';

const getImageUri = (imagenKey: string) => {
  if (!imagenKey) return null;
  if (imagenKey.startsWith('http')) return imagenKey;
  return `https://empleos-narino-files.s3.us-east-2.amazonaws.com/${imagenKey}`;
};

const formatCurrency = (value: any) => {
  if (value == null) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return `${value}`;
  return `$ ${num.toLocaleString()}`;
};

const mapOffer = (offer: any) => ({
  id: offer.pk || offer.id || `${offer.titulo}-${offer.created_at}`,
  title: offer.titulo || '',
  company: offer.empresa || '',
  description: offer.descripcion || '',
  location: offer.municipio || '',
  workplaceType: offer.tipo_trabajo || '',
  availablePositions: offer.cupos ?? 0,
  salary: formatCurrency(offer.salario),
  contractType: offer.tipo_contrato || '',
  image: offer.imagen ? getImageUri(offer.imagen) : '',
  raw: offer,
});

const OfferCard = ({ offer, onPress }: { offer: any, onPress: (offer: any) => void }) => (
  <TouchableOpacity style={styles.offerCard} onPress={() => onPress(offer)}>
    <View style={styles.cardHeader}>
      <Text style={styles.jobTitle}>{offer.title}</Text>
      <Ionicons name="bookmark-outline" size={24} color="#666666" />
    </View>
    <Text style={styles.companyName}>{offer.company}</Text>
    <View style={styles.detailsContainer}>
      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={14} color="#666666" />
        <Text style={styles.detailText}>{offer.location}</Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="briefcase-outline" size={14} color="#666666" />
        <Text style={styles.detailText}>{offer.workplaceType}</Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="cash-outline" size={14} color="#666666" />
        <Text style={styles.detailText}>{offer.salary}</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.detailsButton} onPress={() => onPress(offer)}>
      <Text style={styles.detailsButtonText}>Ver detalles</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<any>();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCongratsModalVisible, setIsCongratsModalVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  
  // 🆕 NUEVOS ESTADOS para el modal de Información/Error
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [applying, setApplying] = useState(false);

  const isEnterprise = user ? user['custom:user_type'] === 'enterprise' : false;

  const fetchActiveOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);

      if (!res.ok) {
        console.error('Error fetching active offers, status:', res.status);
        setOffers([]);
        return;
      }

      const json = await res.json();
      const backendData = json?.data || [];
      const mapped = backendData.map(mapOffer);

      mapped.sort((a: any, b: any) => {
        const da = new Date(a.raw?.created_at || 0).getTime();
        const db = new Date(b.raw?.created_at || 0).getTime();
        return db - da;
      });

      setOffers(mapped);
    } catch (err) {
      console.error('❌ Error al obtener ofertas activas:', err);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveOffers();
    }, [])
  );

  const handleSelectOffer = (offer: any) => {
    setSelectedOffer(offer);
    setIsModalVisible(true);
  };

  const handleApply = async () => {
    if (!selectedOffer) return;

    if (!isAuthenticated || !user?.sub) {
      setIsModalVisible(false);
      setIsLoginModalVisible(true);
      return;
    }

    setApplying(true);
    try {
      const response = await fetch(APPLY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.sub,
          offer_id: selectedOffer.raw.pk.replace('OFFER#', '')
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsModalVisible(false);
        setIsCongratsModalVisible(true);
      } else {
        // 🚨 REEMPLAZO DEL ALERT POR EL MODAL PERSONALIZADO
        setIsModalVisible(false);
        setInfoTitle('Aviso');
        setInfoMessage(data.message || 'No se pudo enviar la aplicación');
        setIsInfoModalVisible(true);
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      setIsModalVisible(false);
      // 🚨 REEMPLAZO DEL ALERT POR EL MODAL PERSONALIZADO
      setInfoTitle('Error de conexión');
      setInfoMessage('No se pudo conectar con el servidor. Intenta nuevamente.');
      setIsInfoModalVisible(true);
    } finally {
      setApplying(false);
    }
  };

  const handleLogin = () => {
    setIsLoginModalVisible(false);
    navigation.navigate('auth'); 
  };

  const handleContinueWithoutLogin = () => {
    setIsLoginModalVisible(false);
    setIsModalVisible(true);
  };

  const handleSupportNavigation = () => {
    navigation.navigate('profile', { screen: 'support' });
  };

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appHeader}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.appNameText}>Empleos Nariño</Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.titleText}>Encuentra tu próximo empleo</Text>
              <TouchableOpacity onPress={handleSupportNavigation} style={styles.supportLinkContainer}>
                <Ionicons name="heart-outline" size={14} color="#558B2F" />
                <Text style={styles.supportLinkText}>Apoya este emprendimiento local</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.profileIconContainer}
              onPress={() => {
                if (isAuthenticated) {
                  navigation.navigate('profile');
                } else {
                  navigation.navigate('auth');
                }
              }}
            >
              <Ionicons
                name={isAuthenticated ? "person-circle" : "person-circle-outline"}
                size={40}
                color="#558B2F"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar empleo..."
              placeholderTextColor="#CCCCCC"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Ofertas para ti</Text>
          <View style={styles.offersContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#166907" style={{ marginTop: 50 }} />
            ) : filteredOffers.length > 0 ? (
              filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onPress={handleSelectOffer}
                />
              ))
            ) : (
              <Text style={styles.noResultsText}>
                {offers.length === 0 ? 'No hay ofertas activas disponibles.' : 'No se encontraron ofertas.'}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Modal de detalles de la oferta */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedOffer?.title}</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close-circle-outline" size={30} color="#666666" />
                  </TouchableOpacity>
                </View>

                <Image
                  source={
                    selectedOffer?.image
                      ? { uri: selectedOffer.image }
                      : hiringPlaceholder
                  }
                  style={styles.modalImage}
                />

                <Text style={styles.modalCompany}>{selectedOffer?.company}</Text>

                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="location-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{selectedOffer?.location}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="briefcase-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>
                      {selectedOffer?.workplaceType}
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="cash-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{selectedOffer?.salary}</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Descripción</Text>
                <Text style={styles.modalDescription}>
                  {selectedOffer?.description}
                </Text>

                <View style={styles.infoPillsContainer}>
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillLabel}>Contrato:</Text>
                    <Text style={styles.infoPillText}>
                      {selectedOffer?.contractType}
                    </Text>
                  </View>
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillLabel}>Cupos:</Text>
                    <Text style={styles.infoPillText}>
                      {selectedOffer?.availablePositions}
                    </Text>
                  </View>
                </View>

              </ScrollView>
              
              {!isEnterprise && (
                <TouchableOpacity
                  style={[styles.applyButton, applying && styles.applyButtonDisabled]}
                  onPress={handleApply}
                  disabled={applying}
                >
                  {applying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.applyButtonText}>
                      {isAuthenticated ? 'Postularse ahora' : 'Iniciar sesión para postularse'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de felicitación */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isCongratsModalVisible}
          onRequestClose={() => setIsCongratsModalVisible(false)}
        >
          <View style={styles.congratsModalOverlay}>
            <View style={styles.congratsModalContent}>
              <Ionicons name="checkmark-circle-outline" size={60} color="#558B2F" style={{ marginBottom: 15 }} />
              <Text style={styles.congratsModalTitle}>¡Felicidades!</Text>
              <Text style={styles.congratsModalText}>Tu postulación ha sido enviada exitosamente. La empresa te contactará si tu perfil coincide con lo que están buscando.</Text>
              <TouchableOpacity style={styles.congratsCloseButton} onPress={() => setIsCongratsModalVisible(false)}>
                <Text style={styles.congratsCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 🆕 MODAL DE INFORMACIÓN/ERROR (Reemplazo del Alert) */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isInfoModalVisible}
          onRequestClose={() => setIsInfoModalVisible(false)}
        >
          <View style={styles.congratsModalOverlay}>
            <View style={styles.congratsModalContent}>
              <Ionicons name="information-circle-outline" size={60} color="#EF6C00" style={{ marginBottom: 15 }} />
              <Text style={styles.congratsModalTitle}>{infoTitle}</Text>
              <Text style={styles.congratsModalText}>{infoMessage}</Text>
              <TouchableOpacity 
                style={[styles.congratsCloseButton, { backgroundColor: '#EF6C00' }]} 
                onPress={() => setIsInfoModalVisible(false)}
              >
                <Text style={styles.congratsCloseButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal personalizado para login */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isLoginModalVisible}
          onRequestClose={() => setIsLoginModalVisible(false)}
        >
          <View style={styles.loginModalOverlay}>
            <View style={styles.loginModalContent}>
              <View style={styles.loginModalHeader}>
                <Ionicons name="log-in-outline" size={50} color="#558B2F" />
                <Text style={styles.loginModalTitle}>Iniciar Sesión Requerido</Text>
              </View>

              <Text style={styles.loginModalText}>
                Para postularte a esta oferta necesitas tener una cuenta. ¿Te gustaría iniciar sesión o crear una cuenta?
              </Text>

              <View style={styles.loginModalButtons}>
                <TouchableOpacity
                  style={styles.loginSecondaryButton}
                  onPress={handleContinueWithoutLogin}
                >
                  <Text style={styles.loginSecondaryButtonText}>Ahora no</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginPrimaryButton}
                  onPress={handleLogin}
                >
                  <Ionicons name="log-in" size={20} color="#FFFFFF" style={styles.loginButtonIcon} />
                  <Text style={styles.loginPrimaryButtonText}>Iniciar Sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  appNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 0,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  supportLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4, 
    marginBottom: 5, 
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  supportLinkText: {
    fontSize: 14,
    color: '#558B2F', 
    marginLeft: 5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  profileIconContainer: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  offersContainer: {
    paddingBottom: 20,
  },
  offerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flexShrink: 1,
    paddingRight: 10,
  },
  companyName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#666666',
  },
  detailsButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  detailsButtonText: {
    color: '#558B2F',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    flexShrink: 1,
    paddingRight: 10,
  },
  modalCompany: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  modalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  modalDetailText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666666',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  infoPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    justifyContent: 'space-around',
  },
  infoPill: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  infoPillLabel: {
    fontSize: 12,
    color: '#666666',
  },
  infoPillText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 2,
  },
  applyButton: {
    marginTop: 25,
    paddingVertical: 15,
    backgroundColor: '#558B2F',
    borderRadius: 15,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666666',
  },
  congratsModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  congratsModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  congratsModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  congratsModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  congratsCloseButton: {
    backgroundColor: '#558B2F',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  congratsCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loginModalContent: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loginModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 10,
    textAlign: 'center',
  },
  loginModalText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  loginModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  loginPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#558B2F',
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#558B2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginSecondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  loginPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginSecondaryButtonText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 16,
  },
  loginButtonIcon: {
    marginRight: 8,
  },
});

export default HomeScreen;
import hiringPlaceholder from '@/assets/images/hiring.png';
import logo from '@/assets/images/logo.png';
import { apiFetch } from '@/lib/apiClient';
import GradientBackground from '@/components/GradientBackground';
import ServiceCard from '@/components/ServiceCard';
import ServiceDetailsModal from '@/components/ServiceDetailsModal';
import { fetchActiveServices, type Service } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import {
  getUserRole,
  isEnterpriseUser,
} from '@/lib/roleUtils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/offers/getActiveOffers`;
const APPLY_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/offers/applyToJob`;
const USER_APPLICATIONS_API = `${process.env.EXPO_PUBLIC_API_URL}/offers/getUserApplications`;
const PROFILE_API = `${process.env.EXPO_PUBLIC_API_URL}/profile`;

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
  id: offer.id,
  title: offer.title || '',
  company: offer.company?.name || '',
  description: offer.description || '',
  location: offer.location || '',
  workplaceType: offer.contractType || '',
  salary: formatCurrency(offer.salary),
  contractType: offer.contractType || '',
  createdAt: offer.createdAt || new Date().toISOString(),
  imageUrl: offer.requirements || null,
  availablePositions: offer.availablePositions ?? 1,
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

type FeedTab = 'offers' | 'services';

const FeedSegmentedControl = ({
  activeTab,
  onTabChange,
}: {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}) => (
  <View style={styles.segmentedContainer}>
    <TouchableOpacity
      style={[styles.segmentButton, activeTab === 'offers' && styles.segmentButtonActive]}
      onPress={() => onTabChange('offers')}
    >
      <Ionicons name="briefcase-outline" size={16} color={activeTab === 'offers' ? '#FFFFFF' : '#666666'} />
      <Text style={[styles.segmentText, activeTab === 'offers' && styles.segmentTextActive]}>
        Empleos
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.segmentButton, activeTab === 'services' && styles.segmentButtonActive]}
      onPress={() => onTabChange('services')}
    >
      <Ionicons name="construct-outline" size={16} color={activeTab === 'services' ? '#FFFFFF' : '#666666'} />
      <Text style={[styles.segmentText, activeTab === 'services' && styles.segmentTextActive]}>
        Servicios
      </Text>
    </TouchableOpacity>
  </View>
);

const HomeScreen = () => {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedTab>('offers');
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCongratsModalVisible, setIsCongratsModalVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  
  // 🆕 NUEVOS ESTADOS para el modal de Información/Error
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [applying, setApplying] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  const isEnterprise = isEnterpriseUser(user);

  // DEBUG: expone la estructura real del token/usuario y el rol detectado
  useEffect(() => {
    console.log('Current User Data/Role:', user);
    console.log('Detected Role (normalized):', getUserRole(user));
    console.log('isEnterprise:', isEnterprise, '| showTabSelector:', !isEnterprise);
  }, [user, isEnterprise]);

  // Empresas SOLO ven el feed de servicios; candidatos ven ambos feeds.
  const showTabSelector = !isEnterprise;
  const effectiveTab: FeedTab = isEnterprise ? 'services' : activeTab;

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
      const backendData = Array.isArray(json) ? json : (json?.offers || json?.data || []);
      const mapped = backendData.map(mapOffer);

      mapped.sort((a: any, b: any) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
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

  const loadActiveServices = async () => {
    setServicesLoading(true);
    try {
      const res = await fetchActiveServices();
      setServices(res);
    } catch (err) {
      console.error('❌ Error al obtener servicios activos:', err);
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveOffers();
      loadActiveServices();
    }, [])
  );

  const handleSelectOffer = async (offer: any) => {
    setSelectedOffer(offer);
    setIsModalVisible(true);
    setAlreadyApplied(false);

    if (!isAuthenticated || !user?.sub) {
      setHasResume(false);
      return;
    }

    try {
      const [appsJson, profileJson] = await Promise.all([
        apiFetch(`${USER_APPLICATIONS_API}/${user.sub}`, { authenticated: true }),
        fetch(`${PROFILE_API}/${user.sub}`).then(async (r) =>
          r.ok ? r.json() : { profile: null },
        ),
      ]);

      const applications = appsJson?.applications || appsJson?.data || [];
      setAlreadyApplied(applications.some((app: any) => app.jobId === offer.id));

      const profile = profileJson?.profile || null;
      setHasResume(!!profile?.resume);
    } catch {
      setAlreadyApplied(false);
      setHasResume(false);
    }
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setIsServiceModalVisible(true);
  };

  const handleApply = async () => {
    if (!selectedOffer || !user?.sub) return;
    setApplying(true);
    try {
      await apiFetch(`${APPLY_API_URL}/${user.sub}`, {
        method: 'POST',
        authenticated: true,
        body: JSON.stringify({
          offer_id: selectedOffer.id,
          offer_title: selectedOffer.title,
          empresa: selectedOffer.company,
        }),
      });

      setIsModalVisible(false);
      setIsCongratsModalVisible(true);
      setAlreadyApplied(true);
    } catch (error) {
      console.error('Error applying to job:', error);
      setIsModalVisible(false);
      setInfoTitle('Aviso');
      setInfoMessage((error as any)?.message || 'No se pudo enviar la aplicación');
      setIsInfoModalVisible(true);
    } finally {
      setApplying(false);
    }
  };

  const handleLogin = () => {
    setIsLoginModalVisible(false);
    router.push('/(tabs)/auth');
  };

  const handleContinueWithoutLogin = () => {
    setIsLoginModalVisible(false);
    setIsModalVisible(true);
  };

  const handleSupportNavigation = () => {
    router.push('/(tabs)/profile');
  };

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.municipality.toLowerCase().includes(searchQuery.toLowerCase())
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
                  router.push('/(tabs)/profile');
                } else {
                  router.push('/(tabs)/auth');
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

          {showTabSelector && (
            <FeedSegmentedControl
              activeTab={effectiveTab}
              onTabChange={setActiveTab}
            />
          )}

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={effectiveTab === 'offers' ? 'Buscar empleo...' : 'Buscar servicio...'}
              placeholderTextColor="#CCCCCC"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>
            {effectiveTab === 'offers' ? 'Ofertas para ti' : 'Servicios de talento local'}
          </Text>
          <View style={styles.offersContainer}>
            {effectiveTab === 'offers' ? (
              loading ? (
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
              )
            ) : servicesLoading ? (
              <ActivityIndicator size="large" color="#166907" style={{ marginTop: 50 }} />
            ) : filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={handleSelectService}
                />
              ))
            ) : (
              <Text style={styles.noResultsText}>
                {services.length === 0
                  ? 'Aún no hay servicios disponibles.'
                  : 'No se encontraron servicios.'}
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

                <View style={styles.modalImageContainer}>
                  {imageLoading && selectedOffer?.imageUrl && (
                    <ActivityIndicator
                      size="large"
                      color="#558B2F"
                      style={styles.imageSpinner}
                    />
                  )}
                  <Image
                    source={
                      selectedOffer?.imageUrl
                        ? { uri: selectedOffer.imageUrl }
                        : hiringPlaceholder
                    }
                    style={styles.modalImage}
                    onLoadStart={() => setImageLoading(true)}
                    onLoad={() => setImageLoading(false)}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                </View>

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

              {!isEnterprise && (() => {
                let btnText: string;
                let btnAction: (() => void) | null;
                let btnDisabled: boolean;

                if (!isAuthenticated) {
                  btnText = 'Inicia sesión para postularte';
                  btnAction = () => {
                    setIsModalVisible(false);
                    router.push('/(tabs)/auth');
                  };
                  btnDisabled = false;
                } else if (alreadyApplied) {
                  btnText = 'Ya te postulaste a esta oferta';
                  btnAction = null;
                  btnDisabled = true;
                } else if (!hasResume) {
                  btnText = 'Completa tu hoja de vida para postularte';
                  btnAction = () => {
                    setIsModalVisible(false);
                    router.push('/(tabs)/profile/edit-profile');
                  };
                  btnDisabled = false;
                } else {
                  btnText = 'Aplicar a esta oferta';
                  btnAction = handleApply;
                  btnDisabled = applying;
                }

                const isGray = btnDisabled && alreadyApplied;

                return (
                  <TouchableOpacity
                    style={[styles.applyButton, (applying || isGray) && styles.applyButtonDisabled]}
                    onPress={() => btnAction?.()}
                    disabled={btnDisabled}
                  >
                    {applying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.applyButtonText}>{btnText}</Text>
                    )}
                  </TouchableOpacity>
                );
              })()}
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

        {/* Modal de detalles del servicio (talent marketplace) */}
        <ServiceDetailsModal
          visible={isServiceModalVisible}
          service={selectedService}
          onClose={() => setIsServiceModalVisible(false)}
        />
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
  modalImageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    marginBottom: 15,
  },
  imageSpinner: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 15,
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
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#558B2F',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
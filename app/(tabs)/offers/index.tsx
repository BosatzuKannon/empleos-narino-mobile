import { apiFetch } from '@/lib/apiClient';
import GradientBackground from '@/components/GradientBackground';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, // Importación añadida para el campo de búsqueda
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import hiringPlaceholder from '@/assets/images/hiring.png';
import logo from '@/assets/images/logo.png';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/offers/getOffersByUser`;
// Constantes para el cambio de estado
const UPDATE_STATUS_API = `${process.env.EXPO_PUBLIC_API_URL}/offers/updateOfferStatus`;
// Email de administrador
const ADMIN_EMAIL = 'carlos87jaramillo@gmail.com';

// Estados posibles para cambiar en el modal
const MODAL_OFFER_STATUSES = [
    'activo', 
    'inactivo',
    'verificando_pago'
];

// Definición de los estados disponibles para los chips de filtro
const OFFER_STATUSES = [
    'Todos', 
    'activo', 
    'inactivo',
    'cerrada',
    'verificando pago'
];

/**
 * Helper CORREGIDO para construir la URI de la imagen.
 */
const getImageUri = (imagenKey) => {
  if (!imagenKey) return null;
  if (imagenKey.startsWith('http')) return imagenKey;
  // Asume que las imágenes de ofertas y comprobantes usan la misma base S3
  return `https://empleos-narino-files.s3.us-east-2.amazonaws.com/${imagenKey}`;
};

const formatCurrency = (value) => {
  if (value == null) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return `${value}`;
  // Formato simple con separadores de miles
  return `$ ${num.toLocaleString()}`;
};

// Mapear la respuesta del backend al shape esperado por la UI
const STATUS_LABELS = {
  'ACTIVE': 'activo',
  'INACTIVE': 'inactivo',
  'PENDING_PAYMENT': 'verificando_pago',
  'CLOSED': 'cerrada',
};

const mapOffer = (offer) => ({
  id: offer.id,
  title: offer.title || '',
  company: offer.company?.name || '',
  description: offer.description || '',
  location: offer.location || '',
  workplaceType: offer.contractType || '',
  salary: formatCurrency(offer.salary),
  contractType: offer.contractType || '',
  offerStatus: STATUS_LABELS[offer.status] || 'verificando_pago',
  applicantCount: offer._count?.applications ?? (Array.isArray(offer.applicants) ? offer.applicants.length : 0),
  paymentProofImageKey: offer.paymentProofImageKey || null,
  createdAt: offer.createdAt || new Date().toISOString(),
  imageUrl: offer.requirements || null,
  availablePositions: offer.availablePositions ?? 1,
});

// CORRECCIÓN 1: Asegurar que 'status' no sea nulo o indefinido antes de toLowerCase()
const getStatusStyle = (status) => {
    // Si status es null, undefined, o no es string, retorna un estilo seguro
    if (!status || typeof status !== 'string') {
      return styles.statusWaiting; 
    }
    
    // Normalización de estados para el mapeo de estilos
    let normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'inactiva' || normalizedStatus === 'vencida' || normalizedStatus === 'inactivo') {
        normalizedStatus = 'vencida';
    } else if (normalizedStatus === 'verificando pago' || normalizedStatus === 'verificando_pago') {
        normalizedStatus = 'verificando_pago';
    } else if (normalizedStatus === 'activa' || normalizedStatus === 'activo') {
        normalizedStatus = 'activa';
    } else if (normalizedStatus === 'cerrada') {
        normalizedStatus = 'cerrada';
    }
    
    switch (normalizedStatus) {
      case 'activo':
      case 'activa':
        return styles.statusActive;
      case 'vencida':
      case 'inactiva': 
      case 'inactivo':
        return styles.statusExpired;
      case 'cerrada':
        return styles.statusClosed;
      case 'verificando_pago':
      case 'en espera de pago':
      case 'verificando pago': 
      default:
        return styles.statusWaiting;
    }
};

const OfferCard = ({ offer, onPress }) => (
  <TouchableOpacity style={styles.offerCard} onPress={() => onPress(offer)} activeOpacity={0.7}>
    <View style={styles.cardRow}>
      <View style={styles.cardIconCircle}>
        <Ionicons name="briefcase-outline" size={20} color="#558B2F" />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.jobTitle} numberOfLines={1}>{offer.title}</Text>
          <Text style={[styles.statusText, getStatusStyle(offer.offerStatus)]}>
            {offer.offerStatus}
          </Text>
        </View>
        <Text style={styles.companyName} numberOfLines={1}>{offer.company}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{offer.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
    </View>
    <View style={styles.metaRow}>
      <View style={styles.metaChip}>
        <Ionicons name="location-outline" size={12} color="#666666" />
        <Text style={styles.metaChipText}>{offer.location}</Text>
      </View>
      <View style={styles.metaChip}>
        <Ionicons name="briefcase-outline" size={12} color="#666666" />
        <Text style={styles.metaChipText}>{offer.workplaceType}</Text>
      </View>
      <View style={[styles.metaChip, styles.metaChipPrice]}>
        <Ionicons name="cash-outline" size={12} color="#558B2F" />
        <Text style={[styles.metaChipText, styles.metaChipTextPrice]}>{offer.salary}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Componente Chip de Filtro (para la vista principal)
const StatusChip = ({ status, isSelected, onPress }) => {
  let statusKey;
  if (status === 'activa' || status === 'activo') statusKey = 'activa';
  else if (status === 'inactiva' || status === 'inactivo') statusKey = 'vencida'; 
  else if (status === 'verificando pago' || status === 'verificando_pago') statusKey = 'verificando_pago'; 
  else statusKey = 'verificando_pago'; // Default para 'Todos'

  const statusStyle = getStatusStyle(statusKey);
  
  const chipBackgroundColor = isSelected ? statusStyle.color : '#f0f0f0';
  const chipTextColor = isSelected ? '#ffffff' : '#333333';
  const chipBorderColor = statusStyle.color;
  
  return (
    <TouchableOpacity 
      style={[
        styles.chip, 
        { 
          backgroundColor: chipBackgroundColor,
          borderColor: chipBorderColor,
          borderWidth: isSelected ? 0 : 1,
        }
      ]} 
      onPress={() => onPress(status)}
    >
      <Text style={[styles.chipText, { color: chipTextColor }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </TouchableOpacity>
  );
};

// Componente Chip de Estado (para dentro del modal)
const ModalStatusChip = ({ status, isSelected, onPress, disabled }) => {
    let statusKey = status.toLowerCase().replace(' ', '_');
    if (statusKey === 'inactivo') statusKey = 'vencida';

    const statusStyle = getStatusStyle(statusKey);
    
    const chipBackgroundColor = isSelected ? statusStyle.color : '#f0f0f0';
    const chipTextColor = isSelected ? '#ffffff' : '#333333';
    const chipBorderColor = statusStyle.color;

    return (
        <TouchableOpacity 
          style={[
            styles.modalChip, 
            { 
              backgroundColor: chipBackgroundColor,
              borderColor: chipBorderColor,
              borderWidth: isSelected ? 0 : 1,
              opacity: disabled ? 0.6 : 1,
            }
          ]} 
          onPress={() => onPress(status)}
          disabled={disabled || isSelected}
        >
          <Text style={[styles.modalChipText, { color: chipTextColor }]}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </Text>
        </TouchableOpacity>
    );
};


const OffersScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Todos'); 
  const [searchText, setSearchText] = useState(''); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      if (!user?.sub) {
        setOffers([]);
        return;
      }
      
      // Lógica para establecer isAdmin
      setIsAdmin(user.email === ADMIN_EMAIL); 

      const json = await apiFetch(`${API_BASE}/${user.sub}`, { authenticated: true });
      const backendData = Array.isArray(json) ? json : (json?.data || []);
      const mapped = backendData.map(mapOffer);

      mapped.sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });

      setOffers(mapped);
    } catch (err) {
      console.error('❌ Error al obtener ofertas del backend:', err);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOffers(); 
    }, [user]) 
  );

  const handleSelectOffer = (offer) => {
    setSelectedOffer(offer);
    setIsModalVisible(true);
  };
  
  const handleStatusChange = async (newStatus) => {
    if (!selectedOffer || isUpdatingStatus || !isAdmin) return;

    const offerId = selectedOffer.id;
    setIsUpdatingStatus(true);

    try {
        await apiFetch(`${UPDATE_STATUS_API}/${offerId}/${user.sub}`, {
            method: 'PUT',
            authenticated: true,
            body: JSON.stringify({ status: newStatus }),
        });

        const updatedOffer = { ...selectedOffer, offerStatus: newStatus };
        setSelectedOffer(updatedOffer);
        fetchOffers();
        Alert.alert("Éxito", `El estado de la oferta se actualizó a: ${newStatus.toUpperCase()}`);
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        Alert.alert("Error", "Ocurrió un error de red al intentar actualizar el estado.");
    } finally {
        setIsUpdatingStatus(false);
    }
  };
  
  // Lógica de filtrado combinada por estado y texto
  const filteredOffers = useMemo(() => {
    const lowerCaseSearchText = searchText.toLowerCase().trim();
    
    // Primer filtro: Por estado
    let statusFiltered = offers;
    
    if (selectedStatus !== 'Todos') {
      let statusToFilter = selectedStatus.toLowerCase();
      
      if (statusToFilter === 'inactivo') {
        statusFiltered = offers.filter(offer => {
            const status = offer.offerStatus?.toLowerCase(); 
            if (!status) return false;
            return status === 'vencida' || status === 'inactiva' || status === 'inactivo';
        });
      } else if (statusToFilter === 'verificando pago') {
        statusFiltered = offers.filter(offer => {
            const status = offer.offerStatus?.toLowerCase(); 
            if (!status) return false;
            return status === 'verificando_pago' || status === 'en espera de pago' || status === 'verificando pago';
        });
      } else {
        statusFiltered = offers.filter(offer => {
            const status = offer.offerStatus?.toLowerCase(); 
            if (!status) return false;
            return status === statusToFilter;
        });
      }
    }
    
    // Segundo filtro: Por título (si hay texto de búsqueda)
    if (lowerCaseSearchText === '') {
        return statusFiltered;
    }

    return statusFiltered.filter(offer => 
        offer.title.toLowerCase().includes(lowerCaseSearchText)
    );
    
  }, [offers, selectedStatus, searchText]);


  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appHeader}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.appNameText}>Empleos Nariño</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.titleText}>Mis Ofertas Publicadas</Text>
          
          {/* Campo de búsqueda */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por título de oferta..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999999"
            />
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {OFFER_STATUSES.map(status => (
              <StatusChip
                key={status}
                status={status}
                isSelected={selectedStatus === status}
                onPress={setSelectedStatus}
              />
            ))}
          </ScrollView>

        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#166907" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {filteredOffers.length > 0 ? (
              filteredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onPress={handleSelectOffer} />
              ))
            ) : (
              <Text style={styles.noResultsText}>
                {selectedStatus === 'Todos' && searchText === ''
                  ? 'Aún no has publicado ofertas.' 
                  : 'No se encontraron ofertas con los filtros y la búsqueda actual.'
                }
              </Text>
            )}
          </ScrollView>
        )}

        <Link href="/offers/createOffer" asChild>
          <TouchableOpacity style={styles.fabButton}>
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </Link>

        {/* Modal de detalles - MODIFICADO para incluir comprobante de pago */}
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
                  <TouchableOpacity onPress={() => setIsModalVisible(false)} disabled={isUpdatingStatus}>
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
                  {/* Detalles de la oferta (sin cambios) */}
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

                <Text style={styles.modalSectionTitle}>
                    Estado de la Oferta: {isUpdatingStatus ? 'Actualizando...' : ''}
                </Text>
                
                {/* Lógica condicional basada en isAdmin */}
                {isAdmin ? (
                    <>
                        {/* Chips de cambio de estado */}
                        {isUpdatingStatus ? (
                            <ActivityIndicator size="small" color="#558B2F" style={{ marginBottom: 10 }} />
                        ) : (
                            <View style={styles.modalChipsContainer}>
                                {MODAL_OFFER_STATUSES.map(status => (
                                    <ModalStatusChip
                                        key={status}
                                        status={status}
                                        isSelected={selectedOffer?.offerStatus.toLowerCase().replace(' ', '_') === status.toLowerCase().replace(' ', '_')}
                                        onPress={handleStatusChange}
                                        disabled={isUpdatingStatus}
                                    />
                                ))}
                            </View>
                        )}

                        {/* IMAGEN DE COMPROBANTE DE PAGO (SOLO ADMIN) */}
                        {selectedOffer?.paymentProofImageKey && (
                            <>
                                <Text style={styles.modalSectionTitle}>Comprobante de Pago</Text>
                                <Image
                                    source={{ uri: getImageUri(selectedOffer.paymentProofImageKey) }}
                                    style={styles.paymentProofImage}
                                    resizeMode="contain"
                                />
                            </>
                        )}
                        {/* FIN IMAGEN COMPROBANTE DE PAGO */}
                    </>
                ) : (
                    // Si no es Admin, solo muestra el estado actual como texto
                    <Text
                        style={[
                            styles.modalStatusTextOnly,
                            getStatusStyle(selectedOffer?.offerStatus)
                        ]}
                    >
                        {selectedOffer?.offerStatus.charAt(0).toUpperCase() + selectedOffer?.offerStatus.slice(1)}
                    </Text>
                )}
                {/* Fin Lógica condicional */}
                
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
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillLabel}>Postulados:</Text>
                    <Text style={styles.infoPillText}>
                      {selectedOffer?.applicantCount ?? 0}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewApplicantsButton}
                  onPress={() => {
                    setIsModalVisible(false);
                    router.push({
                      pathname: '/offers/applicants',
                      params: { offerId: selectedOffer?.id, offerTitle: selectedOffer?.title },
                    });
                  }}
                  disabled={isUpdatingStatus}
                >
                  <Text style={styles.viewApplicantsButtonText}>Ver postulados</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

// Se agregan los estilos de chips al final y se ajustan estilos de espaciado.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginBottom: 70,
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
    paddingBottom: 0, 
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 150,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  // --- Estilos para la Búsqueda ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15, // Espacio antes de los chips
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45, // Altura adecuada para la entrada de texto
    fontSize: 16,
    color: '#333333',
  },
  // ---------------------------------
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, 
    paddingRight: 40,
  },
  chip: {
    paddingHorizontal: 10, // Más pequeño
    paddingVertical: 6,    // Más pequeño
    borderRadius: 20,
    marginRight: 8, // Menos margen
    backgroundColor: '#f0f0f0',
    borderColor: '#cccccc', 
    borderWidth: 1, 
  },
  chipText: {
    fontSize: 12, // Más pequeño
    fontWeight: '600',
    color: '#333333',
  },
  // --- Estilos para los chips dentro del Modal ---
  modalChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  modalChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  modalChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Estilo para el texto de estado cuando NO es Admin
  modalStatusTextOnly: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 15,
  },
  // --- NUEVO ESTILO PARA IMAGEN DE COMPROBANTE ---
  paymentProofImage: {
    width: '100%',
    height: 200, // Altura fija para visualización del comprobante
    borderRadius: 10,
    marginVertical: 10,
  },
  // ---------------------------------------------
  offerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    flexShrink: 1,
    paddingRight: 8,
  },
  companyName: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  metaChipText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#666666',
  },
  metaChipPrice: {
    backgroundColor: '#F1F8E9',
  },
  metaChipTextPrice: {
    color: '#558B2F',
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32',
  },
  statusExpired: {
    backgroundColor: '#ffe6e6',
    color: '#e64e4e',
  },
  statusClosed: {
    backgroundColor: '#eceff1',
    color: '#546e7a',
  },
  statusWaiting: { 
    backgroundColor: '#e6f2ff',
    color: '#0f79b5',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666666',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#558B2F',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
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
  modalStatus: { // Estilo obsoleto pero mantenido para contexto
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
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
  viewApplicantsButton: {
    backgroundColor: '#166907',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  viewApplicantsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OffersScreen;
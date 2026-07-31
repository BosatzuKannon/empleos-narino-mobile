import { apiFetch } from '@/lib/apiClient';
import GradientBackground from '@/components/GradientBackground';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import logo from '@/assets/images/logo.png';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/offers/getOfferApplications`;
const UPDATE_STATUS_URL = `${process.env.EXPO_PUBLIC_API_URL}/offers/updateApplicationStatus`;

const APP_STATUS_DISPLAY = {
  'SENT': 'enviada',
  'REVIEWED': 'en_revision',
  'INTERVIEWING': 'entrevista',
  'REJECTED': 'rechazada',
  'HIRED': 'seleccionado',
  'CANCELED': 'cancelada',
};

const VALID_STATUSES = [
  'enviada',
  'en_revision',
  'entrevista',
  'rechazada',
  'seleccionado',
];

const APPLICATION_STATUSES_CHIPS = [
  'Todos',
  ...VALID_STATUSES,
  'cancelada'
];


const getStatusStyle = (status) => {
    if (!status || typeof status !== 'string') {
        return styles.statusApplied;
    }
    
    switch (status.toLowerCase()) {
      case 'seleccionado':
        return styles.statusHired;
      case 'rechazada':
        return styles.statusFinalized;
      case 'entrevista':
        return styles.statusInProgress;
      case 'en_revision':
        return styles.statusViewed;
      case 'cancelada':
        return styles.statusCanceled;
      case 'enviada':
      default:
        return styles.statusApplied;
    }
};

let _offerTitle = '';

const mapApplication = (app) => ({
  application_id: app.id,
  status: APP_STATUS_DISPLAY[app.status] || 'enviada',
  applied_at: app.appliedAt || app.createdAt,
  offerTitle: _offerTitle,
  user: {
    nombres: app.user?.firstName || '',
    apellidos: app.user?.lastName || '',
    email: app.user?.email || '',
    telefono: app.user?.phone || '',
    ciudad: app.user?.city || '',
    fecha_nacimiento: app.user?.birthDate || null,
    resume_url: app.user?.resume || '',
  },
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Función para calcular la edad a partir de la fecha de nacimiento
const calculateAge = (birthDateString) => {
  if (!birthDateString) return null;
  
  const birthDate = new Date(birthDateString);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const ApplicantCard = ({ applicant, onPress }) => (
  <TouchableOpacity style={styles.applicantCard} onPress={() => onPress(applicant)}>
    <View style={styles.cardHeader}>
      <Text style={styles.applicantName}>
        {applicant.user.nombres} {applicant.user.apellidos}
      </Text>
      <Text style={[styles.statusText, getStatusStyle(applicant.status)]}>
        {formatStatusLabel(applicant.status)}
      </Text>
    </View>
    <Text style={styles.applicantEmail}>{applicant.user.email}</Text>
    <View style={styles.detailsContainer}>
      <View style={styles.detailItem}>
        <Ionicons name="call-outline" size={14} color="#666666" />
        <Text style={styles.detailText}>{applicant.user.telefono}</Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={14} color="#666666" />
        <Text style={styles.detailText}>{applicant.user.ciudad}</Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="calendar-outline" size={14} color="#666666" />
        <Text style={styles.detailText}>Postuló: {formatDate(applicant.applied_at)}</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.detailsButton} onPress={() => onPress(applicant)}>
      <Text style={styles.detailsButtonText}>Ver detalles</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const formatStatusLabel = (s) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const StatusChip = ({ status, isSelected, onPress }) => {
  const statusKey = status === 'Todos' ? 'enviada' : status; 
  const statusStyle = getStatusStyle(statusKey);
  
  // Lógica de color de selección
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
        {status === 'Todos' ? status : formatStatusLabel(status)}
      </Text>
    </TouchableOpacity>
  );
};


const ApplicantsScreen = () => {
  const { offerId, offerTitle } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  // AÑADIDO: Estado para el filtro, inicia en 'Todos'
  const [selectedStatus, setSelectedStatus] = useState('Todos'); 

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const json = await apiFetch(`${API_URL}/${offerId}`, { authenticated: true });
      const rawList = Array.isArray(json) ? json : (json?.candidates || []);
      setApplicants(rawList.map(mapApplication));
      setError(null);
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (offerId) {
        _offerTitle = offerTitle || '';
        fetchApplicants();
      }
    }, [offerId])
  );

  const handleSelectApplicant = (applicant) => {
    setSelectedApplicant(applicant);
    setIsModalVisible(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedApplicant || !user?.sub) return;
    if (selectedApplicant.status === 'cancelada') {
      Alert.alert('Estado bloqueado', 'El candidato canceló su postulación y esta no puede ser modificada.');
      return;
    }

    setUpdatingStatus(true);
    try {
      const json = await apiFetch(
        `${UPDATE_STATUS_URL}/${selectedApplicant.application_id}`,
        {
          method: 'PUT',
          authenticated: true,
          body: JSON.stringify({
            status: newStatus,
            candidateEmail: selectedApplicant.user.email,
            offerTitle: selectedApplicant.offerTitle || '',
          }),
        },
      );

      const updatedApplicants = applicants.map(applicant => 
        applicant.application_id === selectedApplicant.application_id 
          ? { ...applicant, status: newStatus }
          : applicant
      );
      setApplicants(updatedApplicants);
      setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      Alert.alert('Éxito', json.message || 'Estado actualizado correctamente');
    } catch (err) {
      console.error('Error updating status:', err);
      const msg = (err as any)?.message || 'No se pudo actualizar el estado';
      Alert.alert('Error', msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenResume = async (resumeUrl) => {
    if (!resumeUrl) {
      Alert.alert('Error', 'No hay hoja de vida disponible');
      return;
    }

    const supported = await Linking.canOpenURL(resumeUrl);
    if (supported) {
      await Linking.openURL(resumeUrl);
    } else {
      Alert.alert('Error', 'No se puede abrir el enlace de la hoja de vida');
    }
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  // AÑADIDO: Lógica de Filtrado de los Postulados
  const filteredApplicants = useMemo(() => {
    if (selectedStatus === 'Todos') {
      return applicants;
    }
    
    const statusToFilter = selectedStatus.toLowerCase();
    
    return applicants.filter(applicant => 
        // USAMOS EL ENCADENAMIENTO OPCIONAL (?.) para seguridad
        applicant.status?.toLowerCase() === statusToFilter
    );
    
  }, [applicants, selectedStatus]);


  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.appHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.appNameText}>Empleos Nariño</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#558B2F" />
            <Text style={styles.loadingText}>Cargando postulados...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.appHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.appNameText}>Empleos Nariño</Text>
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#e64e4e" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchApplicants}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Encabezado con logo y nombre de la aplicación */}
        <View style={styles.appHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.appNameText}>Empleos Nariño</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.titleText}>Postulados a la Oferta</Text>
          
          {/* AÑADIDO: ScrollView para los Chips de Filtro */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {APPLICATION_STATUSES_CHIPS.map(status => (
              <StatusChip
                key={status}
                status={status}
                isSelected={selectedStatus === status}
                onPress={setSelectedStatus}
              />
            ))}
          </ScrollView>
          {/* FIN AÑADIDO */}
          
          <Text style={styles.subtitleText}>{filteredApplicants.length} postulado(s) encontrado(s)</Text>
        </View>

        {/* USAR filteredApplicants en lugar de applicants */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredApplicants.length > 0 ? (
            filteredApplicants.map((applicant) => (
              <ApplicantCard
                key={applicant.application_id}
                applicant={applicant}
                onPress={handleSelectApplicant}
              />
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="people-outline" size={60} color="#666666" />
              <Text style={styles.noResultsText}>
                {selectedStatus === 'Todos' 
                  ? 'No hay postulados para esta oferta.'
                  : `No hay postulados en estado "${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}".`
                }
              </Text>
              {selectedStatus === 'Todos' && (
                <Text style={styles.noResultsSubtext}>Los candidatos aparecerán aquí cuando se postulen.</Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Modal de detalles del postulado (se mantiene igual) */}
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
                  <Text style={styles.modalTitle}>
                    {selectedApplicant?.user.nombres} {selectedApplicant?.user.apellidos}
                  </Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close-circle-outline" size={30} color="#666666" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalEmail}>{selectedApplicant?.user.email}</Text>
                
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="call-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{selectedApplicant?.user.telefono}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="location-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{selectedApplicant?.user.ciudad}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{formatDate(selectedApplicant?.applied_at)}</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Estado de la postulación</Text>
                <View style={styles.statusContainer}>
                  <Text style={[styles.modalStatus, getStatusStyle(selectedApplicant?.status)]}>
                    {selectedApplicant ? formatStatusLabel(selectedApplicant.status) : ''}
                  </Text>
                  {updatingStatus && (
                    <ActivityIndicator size="small" color="#558B2F" style={styles.statusLoader} />
                  )}
                </View>

                <Text style={styles.modalSectionTitle}>Cambiar Estado</Text>
                {selectedApplicant?.status === 'cancelada' ? (
                  <View style={styles.canceledLockContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#546e7a" />
                    <Text style={styles.canceledLockText}>
                      El candidato canceló su postulación. Este estado no puede ser modificado.
                    </Text>
                  </View>
                ) : (
                <View style={styles.statusButtonsContainer}>
                  {VALID_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        selectedApplicant?.status === status && styles.statusButtonActive
                      ]}
                      onPress={() => handleUpdateStatus(status)}
                      disabled={updatingStatus || selectedApplicant?.status === status}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        selectedApplicant?.status === status && styles.statusButtonTextActive
                      ]}>
                        {formatStatusLabel(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                )}

                <Text style={styles.modalSectionTitle}>Información Personal</Text>
                <View style={styles.personalInfoContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fecha de nacimiento:</Text>
                    <Text style={styles.infoValue}>
                      {selectedApplicant?.user.fecha_nacimiento ? 
                        formatDate(selectedApplicant.user.fecha_nacimiento) : 
                        'No especificada'
                      }
                    </Text>
                  </View>
                  {selectedApplicant?.user.fecha_nacimiento && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Edad:</Text>
                      <Text style={styles.infoValue}>
                        {calculateAge(selectedApplicant.user.fecha_nacimiento)} años
                      </Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ciudad:</Text>
                    <Text style={styles.infoValue}>{selectedApplicant?.user.ciudad || 'No especificada'}</Text>
                  </View>
                </View>

                <View style={styles.actionButtonsContainer}>
                  {selectedApplicant?.user.resume_url && (
                    <TouchableOpacity 
                      style={styles.resumeButton}
                      onPress={() => handleOpenResume(selectedApplicant.user.resume_url)}
                    >
                      <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.resumeButtonText}>Ver Hoja de Vida</Text>
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.contactButtons}>
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => handleCall(selectedApplicant?.user.telefono)}
                    >
                      <Ionicons name="call-outline" size={20} color="#558B2F" />
                      <Text style={styles.contactButtonText}>Llamar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => handleEmail(selectedApplicant?.user.email)}
                    >
                      <Ionicons name="mail-outline" size={20} color="#558B2F" />
                      <Text style={styles.contactButtonText}>Email</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

// Estilos actualizados (Se añaden los estilos de chips y se ajusta el espaciado)
const styles = StyleSheet.create({
  // AÑADIDO: Estilos de Chips
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15, 
    paddingRight: 40,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderColor: '#cccccc', 
    borderWidth: 1, 
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  
  // AJUSTADO: mainContent y titleText para el espaciado
  mainContent: {
    paddingHorizontal: 20,
    paddingBottom: 0, // Ajustado para que los chips queden justo bajo el título
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15, // Ajustado para que la cuenta quede debajo de los chips
  },
  
  // Estilos existentes...
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
  backButton: {
    marginRight: 10,
    padding: 5,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  applicantCard: {
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
    marginBottom: 5,
  },
  applicantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flexShrink: 1,
    paddingRight: 10,
  },
  applicantEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
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
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusApplied: {
    backgroundColor: '#fffbe6',
    color: '#b59b0f',
  },
  statusViewed: {
    backgroundColor: '#e6f2ff',
    color: '#0f79b5',
  },
  statusInProgress: {
    backgroundColor: '#e8f5e9',
    color: '#558B2F',
  },
  statusFinalized: {
    backgroundColor: '#ffe6e6',
    color: '#e64e4e',
  },
  statusHired: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32',
  },
  statusCanceled: {
    backgroundColor: '#eceff1',
    color: '#546e7a',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    paddingHorizontal: 40,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666666',
    fontWeight: 'bold',
  },
  noResultsSubtext: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    flexShrink: 1,
    paddingRight: 10,
  },
  modalEmail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
  },
  modalDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
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
  modalStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLoader: {
    marginLeft: 10,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusButtonActive: {
    backgroundColor: '#558B2F',
    borderColor: '#558B2F',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  canceledLockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceff1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  canceledLockText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#546e7a',
    fontWeight: '500',
  },
  personalInfoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    marginTop: 20,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#558B2F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 0.48,
  },
  contactButtonText: {
    color: '#558B2F',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#e64e4e',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#558B2F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ApplicantsScreen;

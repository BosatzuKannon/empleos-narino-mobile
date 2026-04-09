import GradientBackground from '@/components/GradientBackground';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react'; // AÑADIDO: useMemo
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

const API_URL = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/offers/getOfferApplications';
const UPDATE_STATUS_URL = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/offers/updateApplicationStatus';

// Estados válidos de postulación (se mantienen)
const VALID_STATUSES = [
  'postulado',
  'hoja de vida vista', 
  'en proceso',
  'proceso finalizado',
  'contratado'
];

// AÑADIDO: Array de estados para los Chips, incluyendo 'Todos'
const APPLICATION_STATUSES_CHIPS = [
  'Todos',
  ...VALID_STATUSES
];


const getStatusStyle = (status) => {
    // CORRECCIÓN DE SEGURIDAD: Prevenir el error si el estado es undefined/null
    if (!status || typeof status !== 'string') {
        return styles.statusApplied; // Retorna el estilo 'postulado' como fallback seguro
    }
    
    switch (status.toLowerCase()) {
      case 'contratado':
        return styles.statusHired;
      case 'proceso finalizado':
        return styles.statusFinalized;
      case 'en proceso':
        return styles.statusInProgress;
      case 'hoja de vida vista':
        return styles.statusViewed;
      case 'postulado':
      default:
        return styles.statusApplied;
    }
};

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
        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
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

// AÑADIDO: Componente Chip de Filtro
const StatusChip = ({ status, isSelected, onPress }) => {
  // Usamos el estado real para obtener el estilo (para 'Todos', usamos 'postulado' como base)
  const statusKey = status === 'Todos' ? 'postulado' : status; 
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </TouchableOpacity>
  );
};


const ApplicantsScreen = () => {
  const { offerId } = useLocalSearchParams();
  const { user } = useAuth();
  const navigation = useNavigation();
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
      const response = await fetch(`${API_URL}/${offerId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Asegurar que applications es un array antes de setearlo
        setApplicants(Array.isArray(data.applications) ? data.applications : []);
      } else {
        setError(data.message || 'Error al cargar los postulados');
      }
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

    setUpdatingStatus(true);
    try {
      const response = await fetch(UPDATE_STATUS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offerId,
          application_id: selectedApplicant.application_id,
          status: newStatus,
          updated_by: user.sub
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar el estado localmente
        const updatedApplicants = applicants.map(applicant => 
          applicant.application_id === selectedApplicant.application_id 
            ? { ...applicant, status: newStatus }
            : applicant
        );
        setApplicants(updatedApplicants);
        
        // Actualizar el applicant seleccionado
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
        
        Alert.alert('Éxito', data.message || 'Estado actualizado correctamente');
      } else {
        Alert.alert('Error', data.message || 'No se pudo actualizar el estado');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert('Error', 'Error de conexión al actualizar el estado');
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
                    {selectedApplicant?.status.charAt(0).toUpperCase() + selectedApplicant?.status.slice(1)}
                  </Text>
                  {updatingStatus && (
                    <ActivityIndicator size="small" color="#558B2F" style={styles.statusLoader} />
                  )}
                </View>

                <Text style={styles.modalSectionTitle}>Cambiar Estado</Text>
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
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

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
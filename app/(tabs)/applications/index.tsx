import { apiFetch } from '@/lib/apiClient';
import GradientBackground from '@/components/GradientBackground';
import { useAppAlerts } from '@/hooks/useAppAlerts';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importar el logo de la aplicación
import hiringPlaceholder from '@/assets/images/hiring.png';
import logo from '@/assets/images/logo.png';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/offers/getUserApplications`;
const UPDATE_APPLICATION_API = `${process.env.EXPO_PUBLIC_API_URL}/offers/updateApplicationStatus`;
const S3_BASE_URL = 'https://empleos-narino-files.s3.us-east-2.amazonaws.com/';

const APP_STATUS_DISPLAY: Record<string, string> = {
  'SENT': 'enviada',
  'REVIEWED': 'en_revision',
  'INTERVIEWING': 'entrevista',
  'REJECTED': 'rechazada',
  'HIRED': 'seleccionado',
  'CANCELED': 'cancelada',
};

const APPLICATION_STATUSES = [
  'Todos',
  'enviada',
  'en_revision',
  'entrevista',
  'rechazada',
  'seleccionado',
  'cancelada',
];

const CANCELABLE_STATUSES = ['enviada', 'en_revision', 'entrevista'];

const formatStatusLabel = (s: string) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const getStatusStyle = (status: string) => {
  switch (status) {
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

const mapApplication = (app: any) => ({
  application_id: app.id,
  status: APP_STATUS_DISPLAY[app.status] || 'enviada',
  applied_at: app.appliedAt || app.createdAt,
  offer: {
    titulo: app.jobVacancy?.title || 'Sin título',
    empresa: app.jobVacancy?.company?.name || '',
    municipio: app.jobVacancy?.location || 'Ubicación no especificada',
    tipo_trabajo: app.jobVacancy?.contractType || 'Tipo no especificado',
    modality: app.jobVacancy?.modality || 'Presencial',
    salario: app.jobVacancy?.salary || null,
    imagen: app.jobVacancy?.requirements || null,
    descripcion: app.jobVacancy?.description || '',
    tipo_contrato: app.jobVacancy?.contractType || 'No especificado',
    cupos: app.jobVacancy?.availablePositions ?? 0,
  },
});

const formatSalary = (salary: any) => {
  if (!salary) return 'Salario no especificado';
  return `$ ${salary.toLocaleString('es-CO')}`;
};

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  return `${S3_BASE_URL}${imagePath}`;
};

const ApplicationCard = ({ application, onPress }: { application: any, onPress: (app: any) => void }) => (
  <TouchableOpacity style={styles.applicationCard} onPress={() => onPress(application)} activeOpacity={0.7}>
    <View style={styles.cardRow}>
      <View style={styles.cardIconCircle}>
        <Ionicons name="documents-outline" size={20} color="#558B2F" />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.jobTitle} numberOfLines={1}>{application.offer.titulo || 'Sin título'}</Text>
          <Text style={[styles.statusText, getStatusStyle(application.status)]}>
            {formatStatusLabel(application.status)}
          </Text>
        </View>
        <Text style={styles.companyName} numberOfLines={1}>{application.offer.empresa || 'Empresa no especificada'}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{application.descripcion}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
    </View>
    <View style={styles.metaRow}>
      <View style={styles.metaChip}>
        <Ionicons name="location-outline" size={12} color="#666666" />
        <Text style={styles.metaChipText}>{application.offer.municipio || 'Ubicación no especificada'}</Text>
      </View>
      <View style={styles.metaChip}>
        <Ionicons name="briefcase-outline" size={12} color="#666666" />
        <Text style={styles.metaChipText}>{application.offer.tipo_trabajo || 'Tipo no especificado'}</Text>
      </View>
      <View style={styles.metaChip}>
        <Ionicons
          name={application.offer.modality === 'Remoto' ? 'wifi-outline' : application.offer.modality === 'Híbrido' ? 'git-merge-outline' : 'business-outline'}
          size={12}
          color="#666666"
        />
        <Text style={styles.metaChipText}>{application.offer.modality}</Text>
      </View>
      <View style={[styles.metaChip, styles.metaChipPrice]}>
        <Ionicons name="cash-outline" size={12} color="#558B2F" />
        <Text style={[styles.metaChipText, styles.metaChipTextPrice]}>{formatSalary(application.offer.salario)}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const StatusChip = ({ status, isSelected, onPress }: { status: string, isSelected: boolean, onPress: (s: string) => void }) => {
  const statusKey = status === 'Todos' ? 'enviada' : status; 
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
        {status === 'Todos' ? status : formatStatusLabel(status)}
      </Text>
    </TouchableOpacity>
  );
};


const ApplicationsScreen = () => {
  const { user } = useAuthStore();
  const { showSuccess, showError, confirm, dialogElement } = useAppAlerts();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('Todos'); 
  const [searchText, setSearchText] = useState(''); 
  const [canceling, setCanceling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.sub) {
        fetchApplications();
      } else {
        // Si no hay usuario (ej. cierre de sesión), limpiamos
        setApplications([]);
        setLoading(false);
      }
    }, [user]) // Agregamos user como dependencia
  );

  const fetchApplications = async () => {
    if (!user?.sub) return;

    try {
      setLoading(true);
      const json = await apiFetch(`${API_URL}/${user.sub}`, { authenticated: true });
      const rawList = Array.isArray(json) ? json : (json?.applications || []);
      const validApplications = rawList.map(mapApplication);
      setApplications(validApplications);
      setError(null);
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!selectedApplication || !user?.sub) return;

    setCanceling(true);
    try {
      const json = await apiFetch(
        `${UPDATE_APPLICATION_API}/${selectedApplication.application_id}`,
        {
          method: 'PUT',
          authenticated: true,
          body: JSON.stringify({
            status: 'cancelada',
            candidateEmail: user.email || '',
            offerTitle: selectedApplication.offer.titulo,
          }),
        },
      );

      const updatedApplications = applications.map(app =>
        app.application_id === selectedApplication.application_id
          ? { ...app, status: 'cancelada' }
          : app
      );
      setApplications(updatedApplications);
      setSelectedApplication({ ...selectedApplication, status: 'cancelada' });
      showSuccess(json.message || 'Postulación cancelada exitosamente');
    } catch (err) {
      console.error('Error cancelando postulación:', err);
      const msg = (err as any)?.message || 'No se pudo cancelar la postulación';
      showError(msg);
    } finally {
      setCanceling(false);
    }
  };

  const handleCancelPress = async () => {
    const ok = await confirm({
      title: 'Cancelar postulación',
      message: '¿Estás seguro de que deseas cancelar esta postulación? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Sí, cancelar',
      cancelText: 'Volver',
    });
    if (!ok) return;
    await handleCancelApplication();
  };

  const handleSelectApplication = (application: any) => {
    setSelectedApplication(application);
    setIsModalVisible(true);
  };
  
  const filteredApplications = useMemo(() => {
    const lowerCaseSearchText = searchText.toLowerCase().trim();

    // 0. Ordenar por fecha de postulación (más recientes primero)
    const sortedByDate = [...applications].sort((a, b) => {
      const da = new Date(a.applied_at || 0).getTime();
      const db = new Date(b.applied_at || 0).getTime();
      return db - da;
    });

    // 1. Filtrar por estado
    let filteredByStatus = sortedByDate;
    if (selectedStatus !== 'Todos') {
      filteredByStatus = sortedByDate.filter(app => app.status === selectedStatus);
    }

    // 2. Filtrar el resultado por título (búsqueda)
    if (lowerCaseSearchText === '') {
        return filteredByStatus;
    }

    return filteredByStatus.filter(app => 
        (app.offer.titulo || '').toLowerCase().includes(lowerCaseSearchText)
    );
    
  }, [applications, selectedStatus, searchText]); 


  if (loading) {
      return (
         <GradientBackground>
           <SafeAreaView style={styles.safeArea}>
             <View style={styles.appHeader}>
               <Image source={logo} style={styles.logo} />
               <Text style={styles.appNameText}>Empleos Nariño</Text>
             </View>
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color="#558B2F" />
               <Text style={styles.loadingText}>Cargando postulaciones...</Text>
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
               <Image source={logo} style={styles.logo} />
               <Text style={styles.appNameText}>Empleos Nariño</Text>
             </View>
             <View style={styles.errorContainer}>
               <Ionicons name="alert-circle-outline" size={50} color="#e64e4e" />
               <Text style={styles.errorText}>{error}</Text>
               <TouchableOpacity style={styles.retryButton} onPress={fetchApplications}>
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
        <View style={styles.appHeader}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.appNameText}>Empleos Nariño</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.titleText}>Historial de Postulaciones</Text>
          
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
            {APPLICATION_STATUSES.map(status => (
              <StatusChip
                key={status}
                status={status}
                isSelected={selectedStatus === status}
                onPress={setSelectedStatus}
              />
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredApplications.length > 0 ? (
            filteredApplications.map((application) => (
              <ApplicationCard
                key={application.application_id}
                application={application}
                onPress={handleSelectApplication}
              />
            ))
          ) : (
            <Text style={styles.noResultsText}>
              {(selectedStatus === 'Todos' && searchText === '')
                ? 'No has aplicado a ninguna oferta aún.' 
                : 'No se encontraron postulaciones con los filtros y la búsqueda actual.'
              }
            </Text>
          )}
          
          <View style={styles.bottomButtonContainer}>
            <Link href="/" asChild>
              <TouchableOpacity style={styles.findMoreButton}>
                <Text style={styles.findMoreButtonText}>Buscar más ofertas</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>

        {/* Modal de detalles de la postulación */}
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
                  <Text style={styles.modalTitle}>{selectedApplication?.offer.titulo || 'Sin título'}</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close-circle-outline" size={30} color="#666666" />
                  </TouchableOpacity>
                </View>
                
                <Image
                  source={
                    selectedApplication?.offer.imagen 
                      ? { uri: getImageUrl(selectedApplication.offer.imagen) } 
                      : hiringPlaceholder
                  }
                  style={styles.modalImage}
                  defaultSource={hiringPlaceholder}
                />
                
                <Text style={styles.modalCompany}>{selectedApplication?.offer.empresa || 'Empresa no especificada'}</Text>
                
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="location-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{selectedApplication?.offer.municipio || 'Ubicación no especificada'}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="briefcase-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{selectedApplication?.offer.tipo_trabajo || 'Tipo no especificado'}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="business-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{selectedApplication?.offer.modality}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="cash-outline" size={16} color="#666666" />
                    <Text style={styles.modalDetailText}>{formatSalary(selectedApplication?.offer.salario)}</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Estado de la postulación</Text>
                <Text style={[styles.modalStatus, getStatusStyle(selectedApplication?.status)]}>
                  {selectedApplication ? formatStatusLabel(selectedApplication.status) : ''}
                </Text>

                {selectedApplication &&
                  CANCELABLE_STATUSES.includes(selectedApplication.status) && (
                    <TouchableOpacity
                      style={[styles.cancelButton, canceling && styles.cancelButtonDisabled]}
                      onPress={handleCancelPress}
                      disabled={canceling}
                    >
                      {canceling ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.cancelButtonText}>Cancelar postulación</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                <Text style={styles.modalSectionTitle}>Descripción del puesto</Text>
                <Text style={styles.modalDescription}>
                  {selectedApplication?.offer.descripcion || 'No hay descripción disponible.'}
                </Text>

                <View style={styles.infoPillsContainer}>
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillLabel}>Contrato:</Text>
                    <Text style={styles.infoPillText}>{selectedApplication?.offer.tipo_contrato || 'No especificado'}</Text>
                  </View>
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillLabel}>Cupos:</Text>
                    <Text style={styles.infoPillText}>{selectedApplication?.offer.cupos || 0}</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      {dialogElement}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15, 
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, 
    paddingRight: 40,
  },
  chip: {
    paddingHorizontal: 12, 
    paddingVertical: 6,    
    borderRadius: 20,
    marginRight: 8, 
    backgroundColor: '#f0f0f0',
    borderColor: '#cccccc', 
    borderWidth: 1, 
  },
  chipText: {
    fontSize: 12, 
    fontWeight: '600',
    color: '#333333',
  },
  applicationCard: {
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e64e4e',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  cancelButtonDisabled: {
    backgroundColor: '#e57373',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666666',
  },
  bottomButtonContainer: {
    marginTop: 20,
  },
  findMoreButton: {
    backgroundColor: '#558B2F',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  findMoreButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
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
  modalStatus: {
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

export default ApplicationsScreen;
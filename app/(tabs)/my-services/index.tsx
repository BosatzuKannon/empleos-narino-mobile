// =======================================================
// Mis Servicios — Panel del candidato (talent marketplace)
//  - Lista los servicios publicados por el usuario.
//  - Muestra estado (ACTIVE/PAUSED) y views_count por servicio.
//  - Permite pausar/reanudar y ver detalles (ServiceDetailsModal).
// =======================================================

import logo from '@/assets/images/logo.png';
import GradientBackground from '@/components/GradientBackground';
import ServiceDetailsModal from '@/components/ServiceDetailsModal';
import { useAppAlerts } from '@/hooks/useAppAlerts';
import {
  fetchServicesByUser,
  formatServicePrice,
  updateServiceStatus,
  type Service,
  type ServiceStatus,
} from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_LABELS: Record<ServiceStatus, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
};

const getStatusStyle = (status: ServiceStatus) =>
  status === 'ACTIVE' ? styles.statusActive : styles.statusPaused;

const MyServiceCard = ({
  service,
  toggling,
  onPress,
  onToggle,
}: {
  service: Service;
  toggling: boolean;
  onPress: (service: Service) => void;
  onToggle: (service: Service) => void;
}) => (
  <TouchableOpacity style={styles.serviceCard} onPress={() => onPress(service)}>
    <View style={styles.cardHeader}>
      <Text style={styles.jobTitle} numberOfLines={2}>
        {service.title}
      </Text>
      <Text style={[styles.statusText, getStatusStyle(service.status)]}>
        {STATUS_LABELS[service.status]}
      </Text>
    </View>

    <Text style={styles.categoryName}>
      {service.category?.name || 'Servicio'}
    </Text>

    <View style={styles.detailsContainer}>
      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={14} color="#666666" />
        <Text style={styles.detailText}>{service.municipality}</Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="cash-outline" size={14} color="#558B2F" />
        <Text style={[styles.detailText, styles.priceText]}>
          {formatServicePrice(service)}
        </Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="eye-outline" size={14} color="#666666" />
        <Text style={styles.detailText}>{service.viewsCount} vistas</Text>
      </View>
    </View>

    <View style={styles.cardFooter}>
      <TouchableOpacity style={styles.detailsButton} onPress={() => onPress(service)}>
        <Text style={styles.detailsButtonText}>Ver detalles</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          service.status === 'ACTIVE' ? styles.togglePause : styles.toggleResume,
        ]}
        onPress={() => onToggle(service)}
        disabled={toggling}
      >
        {toggling ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name={service.status === 'ACTIVE' ? 'pause-circle-outline' : 'play-circle-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.toggleButtonText}>
              {service.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const MyServicesScreen = () => {
  const { user } = useAuthStore();
  const { showSuccess, showError, dialogElement } = useAppAlerts();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMyServices = async () => {
    if (!user?.sub) return;

    try {
      setLoading(true);
      const list = await fetchServicesByUser();
      setServices(list);
      setError(null);
    } catch (err) {
      console.error('❌ Error al obtener mis servicios:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.sub) {
        fetchMyServices();
      } else {
        setServices([]);
        setLoading(false);
      }
    }, [user])
  );

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setIsModalVisible(true);
  };

  const handleToggleStatus = async (service: Service) => {
    if (togglingId) return;

    const newStatus: ServiceStatus =
      service.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    setTogglingId(service.id);
    try {
      await updateServiceStatus(service.id, newStatus);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, status: newStatus } : s))
      );
      showSuccess(
        newStatus === 'ACTIVE' ? 'Servicio activado' : 'Servicio pausado'
      );
    } catch (err) {
      console.error('❌ Error al cambiar el estado del servicio:', err);
      showError((err as any)?.message || 'No se pudo cambiar el estado del servicio.');
    } finally {
      setTogglingId(null);
    }
  };

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
            <Text style={styles.loadingText}>Cargando tus servicios...</Text>
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
            <TouchableOpacity style={styles.retryButton} onPress={fetchMyServices}>
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
          <Text style={styles.titleText}>Mis Servicios</Text>
          <Text style={styles.subtitleText}>
            Publica y administra los servicios que ofreces como profesional independiente.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {services.length > 0 ? (
            services.map((service) => (
              <MyServiceCard
                key={service.id}
                service={service}
                toggling={togglingId === service.id}
                onPress={handleSelectService}
                onToggle={handleToggleStatus}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={56} color="#AED581" />
              <Text style={styles.emptyTitle}>Aún no has publicado servicios</Text>
              <Text style={styles.emptyText}>
                Ofrece tus habilidades como plomero, consultor, diseñador y más
                para que las empresas y usuarios de Nariño te encuentren.
              </Text>
            </View>
          )}
        </ScrollView>

        <ServiceDetailsModal
          visible={isModalVisible}
          service={selectedService}
          onClose={() => setIsModalVisible(false)}
        />
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
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 100,
  },
  serviceCard: {
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
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    paddingRight: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
    color: '#558B2F',
  },
  statusPaused: {
    backgroundColor: '#FFF3E0',
    color: '#EF6C00',
  },
  categoryName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
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
  priceText: {
    color: '#558B2F',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  detailsButton: {
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
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  togglePause: {
    backgroundColor: '#EF6C00',
  },
  toggleResume: {
    backgroundColor: '#558B2F',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyServicesScreen;

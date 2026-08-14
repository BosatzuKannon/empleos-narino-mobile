// =======================================================
// ServiceDetailsModal — Detalles de un servicio
//  - Al abrirse dispara el incremento de views_count.
//  - Todo el texto está alineado a la izquierda (readability).
//  - CTA principal: "Contactar por WhatsApp".
// =======================================================

import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  buildWhatsAppUrl,
  formatServicePrice,
  getServiceProviderName,
  incrementServiceViews,
  PRICE_TYPE_LABELS,
  type Service,
} from '@/lib/services';
import { shareItem } from '@/lib/share';

interface ServiceDetailsModalProps {
  visible: boolean;
  service: Service | null;
  onClose: () => void;
}

const getImageUri = (imageKey: string | null): string | null => {
  if (!imageKey) return null;
  if (imageKey.startsWith('http')) return imageKey;
  return `https://empleos-narino-files.s3.us-east-2.amazonaws.com/${imageKey}`;
};

const ServiceDetailsModal = ({ visible, service, onClose }: ServiceDetailsModalProps) => {
  const [imageLoading, setImageLoading] = useState(false);
  const [openingWhatsApp, setOpeningWhatsApp] = useState(false);

  // ANALYTICS: cada vez que se abre el modal, sumamos 1 a views_count.
  useEffect(() => {
    if (visible && service?.id) {
      incrementServiceViews(service.id);
    }
  }, [visible, service?.id]);

  const imageUrl = service ? getImageUri(service.imageUrl) : null;
  const providerName = service ? getServiceProviderName(service) : '';

  const handleWhatsApp = async () => {
    if (!service) return;
    setOpeningWhatsApp(true);
    try {
      const url = buildWhatsAppUrl(service.user?.phone, service.title);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('No se puede abrir WhatsApp en este dispositivo.');
      }
    } catch (error) {
      console.error('Error abriendo WhatsApp:', error);
    } finally {
      setOpeningWhatsApp(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{service?.title || ''}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => service && shareItem('service', service.id, service.title)}
                  style={styles.shareButton}
                >
                  <Ionicons name="share-social-outline" size={24} color="#558B2F" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close-circle-outline" size={30} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalImageContainer}>
              {imageLoading && imageUrl && (
                <ActivityIndicator
                  size="large"
                  color="#558B2F"
                  style={styles.imageSpinner}
                />
              )}
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.modalImage}
                  onLoadStart={() => setImageLoading(true)}
                  onLoad={() => setImageLoading(false)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="briefcase-outline" size={52} color="#AED581" />
                </View>
              )}
            </View>

            <Text style={styles.modalProvider}>{providerName}</Text>

            {service?.category?.name ? (
              <View style={styles.categoryRow}>
                <Ionicons name="pricetag-outline" size={14} color="#558B2F" />
                <Text style={styles.categoryText}>{service.category.name}</Text>
              </View>
            ) : null}

            <View style={styles.modalDetails}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="location-outline" size={16} color="#666666" />
                <Text style={styles.modalDetailText}>{service?.municipality}</Text>
              </View>
              <View style={styles.modalDetailItem}>
                <Ionicons name="time-outline" size={16} color="#666666" />
                <Text style={styles.modalDetailText}>
                  {service ? PRICE_TYPE_LABELS[service.priceType] : ''}
                </Text>
              </View>
              <View style={styles.modalDetailItem}>
                <Ionicons name="cash-outline" size={16} color="#558B2F" />
                <Text style={[styles.modalDetailText, styles.priceText]}>
                  {service ? formatServicePrice(service) : ''}
                </Text>
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>Descripción</Text>
            <Text style={styles.modalDescription}>
              {service?.description || 'Sin descripción disponible.'}
            </Text>

            {service?.user?.phone ? (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={14} color="#666666" />
                <Text style={styles.contactText}>Teléfono: {service.user.phone}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.whatsappButton, openingWhatsApp && styles.whatsappButtonDisabled]}
              onPress={handleWhatsApp}
              disabled={openingWhatsApp}
            >
              {openingWhatsApp ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
                  <Text style={styles.whatsappButtonText}>Contactar por WhatsApp</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  closeButton: {
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'left',
  },
  modalImageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  imageSpinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalProvider: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'left',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '600',
    color: '#558B2F',
  },
  modalDetails: {
    marginBottom: 5,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 6,
  },
  modalDetailText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
  },
  priceText: {
    color: '#558B2F',
    fontWeight: 'bold',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  modalDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
    textAlign: 'left',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  contactText: {
    marginLeft: 5,
    fontSize: 13,
    color: '#666666',
    textAlign: 'left',
  },
  whatsappButton: {
    marginTop: 25,
    paddingVertical: 15,
    backgroundColor: '#25D366',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  whatsappButtonDisabled: {
    opacity: 0.7,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default ServiceDetailsModal;

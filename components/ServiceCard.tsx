// =======================================================
// ServiceCard — Tarjeta de servicio del talent marketplace
// Replica exacta de estilos/sombras/border-radius de las
// tarjetas de ofertas existentes (app/(tabs)/index.tsx).
// =======================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  formatServicePrice,
  getServiceProviderName,
  PRICE_TYPE_ICONS,
  PRICE_TYPE_LABELS,
  type Service,
} from '@/lib/services';

interface ServiceCardProps {
  service: Service;
  onPress: (service: Service) => void;
}

const getImageUri = (imageKey: string | null): string | null => {
  if (!imageKey) return null;
  if (imageKey.startsWith('http')) return imageKey;
  return `https://empleos-narino-files.s3.us-east-2.amazonaws.com/${imageKey}`;
};

const ServiceCard = ({ service, onPress }: ServiceCardProps) => {
  const imageUrl = getImageUri(service.imageUrl);
  const providerName = getServiceProviderName(service);
  const categoryName = service.category?.name || 'Servicio';
  const priceTypeIcon = PRICE_TYPE_ICONS[service.priceType];

  return (
    <TouchableOpacity style={styles.serviceCard} onPress={() => onPress(service)}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.serviceImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="briefcase-outline" size={44} color="#AED581" />
            <Text style={styles.placeholderText}>{categoryName}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {service.title}
        </Text>
        <Ionicons name="bookmark-outline" size={24} color="#666666" />
      </View>

      <Text style={styles.companyName} numberOfLines={1}>
        {providerName}
      </Text>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color="#666666" />
          <Text style={styles.detailText}>{service.municipality}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="pricetag-outline" size={14} color="#666666" />
          <Text style={styles.detailText}>{categoryName}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name={priceTypeIcon as any} size={14} color="#666666" />
          <Text style={styles.detailText}>{PRICE_TYPE_LABELS[service.priceType]}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={14} color="#558B2F" />
          <Text style={[styles.detailText, styles.priceText]}>
            {formatServicePrice(service)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.detailsButton} onPress={() => onPress(service)}>
        <Text style={styles.detailsButtonText}>Ver detalles</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  imageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 150,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#558B2F',
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
  priceText: {
    color: '#558B2F',
    fontWeight: 'bold',
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
});

export default ServiceCard;

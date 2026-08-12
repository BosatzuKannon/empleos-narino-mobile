// =======================================================
// ServiceCard — Tarjeta compacta de servicio del talent marketplace
// =======================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  formatServicePrice,
  getServiceProviderName,
  PRICE_TYPE_ICONS,
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
    <TouchableOpacity style={styles.serviceCard} onPress={() => onPress(service)} activeOpacity={0.7}>
      <View style={styles.cardRow}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardThumb} resizeMode="cover" />
        ) : (
          <View style={styles.cardIconCircle}>
            <Ionicons name="construct-outline" size={20} color="#558B2F" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.jobTitle} numberOfLines={1}>{service.title}</Text>
          <Text style={styles.companyName} numberOfLines={1}>{providerName}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>{service.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="location-outline" size={12} color="#666666" />
          <Text style={styles.metaChipText}>{service.municipality}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="pricetag-outline" size={12} color="#666666" />
          <Text style={styles.metaChipText}>{categoryName}</Text>
        </View>
        <View style={[styles.metaChip, styles.metaChipPrice]}>
          <Ionicons name={priceTypeIcon as any} size={12} color="#558B2F" />
          <Text style={[styles.metaChipText, styles.metaChipTextPrice]}>
            {formatServicePrice(service)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  serviceCard: {
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
  cardThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 12,
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
  jobTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
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
});

export default ServiceCard;
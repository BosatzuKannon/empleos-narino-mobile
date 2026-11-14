// =======================================================
// AdCard — Tarjeta de publicidad nativa (mismas dimensiones
// que JobCard / ServiceCard) con redirección externa.
// =======================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { buildAdLink, type Advertisement } from '@/lib/ads';

const AD_INTERVAL = 3;

interface AdCardProps {
  ad: Advertisement;
}

const AdCard = ({ ad }: AdCardProps) => {
  const openAd = () => {
    const url = buildAdLink(ad);
    if (url) {
      Linking.openURL(url).catch(() => {
        console.warn('No se pudo abrir el enlace del anuncio:', url);
      });
    }
  };

  return (
    <TouchableOpacity style={styles.adCard} onPress={openAd} activeOpacity={0.7}>
      <View style={styles.cardRow}>
        {ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={styles.cardThumb} resizeMode="cover" />
        ) : (
          <View style={styles.cardIconCircle}>
            <Ionicons name="megaphone-outline" size={20} color="#558B2F" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.jobTitle} numberOfLines={1}>{ad.name}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>{ad.description}</Text>
        </View>
        <Ionicons name="open-outline" size={18} color="#CCCCCC" />
      </View>
      <View style={styles.metaRow}>
        <View style={[styles.metaChip, styles.metaChipSponsored]}>
          <Ionicons name="megaphone-outline" size={12} color="#558B2F" />
          <Text style={[styles.metaChipText, styles.metaChipTextSponsored]}>Publicidad</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/** Inserta un anuncio cada `interval` tarjetas, rotando la lista de anuncios. */
export function interleaveAds(
  nodes: React.ReactElement[],
  ads: Advertisement[],
  interval: number = AD_INTERVAL,
): React.ReactNode[] {
  if (ads.length === 0) return nodes;

  const result: React.ReactNode[] = [];
  let adIndex = 0;

  nodes.forEach((node, index) => {
    result.push(node);
    if ((index + 1) % interval === 0 && adIndex < ads.length) {
      const ad = ads[adIndex++];
      result.push(<AdCard key={`ad-${ad.id}-${index}`} ad={ad} />);
    }
  });

  return result;
}

const styles = StyleSheet.create({
  adCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F5E9',
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
  metaChipSponsored: {
    backgroundColor: '#F1F8E9',
  },
  metaChipText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#666666',
  },
  metaChipTextSponsored: {
    color: '#558B2F',
    fontWeight: 'bold',
  },
});

export default AdCard;

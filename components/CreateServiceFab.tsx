// =======================================================
// CreateServiceFab — Botón flotante (+) para crear un servicio.
// Solo se muestra para usuarios CANDIDATE.
// Navega a la pantalla /create-service.
// =======================================================

import { isCandidateUser } from '@/lib/roleUtils';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

const CreateServiceFab = () => {
  const router = useRouter();
  const { user } = useAuthStore();

  if (!isCandidateUser(user)) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.fab}
      activeOpacity={0.85}
      onPress={() => router.push('/create-service')}
    >
      <Ionicons name="add" size={30} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 95,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#558B2F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
});

export default CreateServiceFab;

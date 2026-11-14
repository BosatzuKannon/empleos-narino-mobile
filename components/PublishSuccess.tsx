import GradientBackground from '@/components/GradientBackground';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PublishSuccessProps {
  type: 'offer' | 'service';
}

const COPY = {
  offer: {
    title: '¡Oferta publicada!',
    body: 'Tu oferta ya está visible para todos los candidatos de Nariño.',
    button: 'Ver mis ofertas',
    route: '/(tabs)/offers',
  },
  service: {
    title: '¡Servicio publicado!',
    body: 'Tu servicio ya está visible para empresas y usuarios de Nariño.',
    button: 'Ver mis servicios',
    route: '/(tabs)/my-services',
  },
} as const;

const PublishSuccess = ({ type }: PublishSuccessProps) => {
  const router = useRouter();
  const copy = COPY[type];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={72} color="#558B2F" />
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace(copy.route as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{copy.button}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#558B2F',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PublishSuccess;

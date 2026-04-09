import logo from '@/assets/images/logo.png';
import GradientBackground from '@/components/GradientBackground';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const WelcomeScreen = () => {
  const router = useRouter();

  const handleLoginPress = () => {
    router.push('/auth/login');
  };

  const handleRegisterPress = () => {
    router.push('/auth/register');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          
          {/* Sección Superior: Logo y Nombre de la aplicación */}
          <View style={styles.logoWrapper}>
            <Surface style={styles.logoContainer} elevation={4}>
              <Image source={logo} style={styles.logoImage} />
            </Surface>
            <Text style={styles.appNameText}>Empleos Nariño</Text>
          </View>

          {/* Sección Inferior: Contenido principal, Título y Botones */}
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>Encuentra el empleo ideal en Nariño.</Text>
            <Text style={styles.subtitle}>Conéctate con las mejores empresas de la región.</Text>

            {/* Fila de Botones (Horizontal) */}
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleLoginPress}
                style={styles.buttonLogin}
                labelStyle={styles.buttonLabel}
                uppercase={false} 
              >
                Iniciar sesión
              </Button>
              <Button
                mode="contained"
                onPress={handleRegisterPress}
                style={styles.buttonRegister}
                labelStyle={styles.buttonLabel} 
                uppercase={false}
              >
                Registrarme
              </Button>
            </View>

            {/* PRIMERA LÍNEA DEL FOOTER: Términos y Condiciones */}
            <View style={styles.termsWrapper}>
              <Text style={styles.footerText}>
                Al continuar, aceptas nuestros{' '}
                <TouchableOpacity onPress={() => router.push('/auth/terms')}>
                  <Text style={styles.linkText}>Términos y Condiciones</Text>
                </TouchableOpacity>
                .
              </Text>
            </View>

            {/* SEGUNDA LÍNEA DEL FOOTER: Apoyo al Emprendimiento (Separado verticalmente) */}
            <View style={styles.supportWrapper}>
              <TouchableOpacity onPress={() => router.push('/auth/support')} >
                <Text style={styles.linkTextCentered}>Apoya Este Emprendimiento</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24, 
  },
  // --- Estilos para la sección del Logo (Más compacto) ---
  logoWrapper: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    width: 140, 
    height: 140, 
    borderRadius: 20, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  appNameText: {
    fontSize: 32, 
    fontWeight: '700', 
    color: '#000',
    marginTop: 15, 
  },
  // --- Estilos para la sección de Contenido Principal (El foco) ---
  contentWrapper: {
    flex: 1, 
    justifyContent: 'flex-start', 
    alignItems: 'center',
  },
  title: {
    fontSize: 26, 
    fontWeight: '800', 
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40, 
  },
  // --- Estilos para los Botones (Fila) ---
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30, 
    gap: 10, // Espacio entre botones
  },
  buttonLogin: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#076a0d', 
    height: 50,
    justifyContent: 'center',
  },
  buttonRegister: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#558B2F', 
    height: 50,
    justifyContent: 'center',
  },
  buttonLabel: {
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // --- Estilos para el Footer Corregido ---

  // Contenedor del primer texto (Términos)
  termsWrapper: {
    marginTop: 30, // Espacio de separación de los botones
    alignItems: 'center',
    width: '100%',
  },
  
  // Contenedor del segundo enlace (Apoyo)
  supportWrapper: {
    marginTop: 15, // Esto crea el espacio vertical entre "Términos" y "Apoyo"
    alignItems: 'center',
    width: '100%',
  },
  
  footerText: { 
    color: '#333', 
    fontSize: 14,
    textAlign: 'center',
  },
  linkText: { 
    color: '#558B2F',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  // Estilo específico para asegurar que el texto del enlace de apoyo se muestre correctamente centrado.
  linkTextCentered: {
    color: '#558B2F',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    textAlign: 'center', 
    fontSize: 14,
  },
});

export default WelcomeScreen;
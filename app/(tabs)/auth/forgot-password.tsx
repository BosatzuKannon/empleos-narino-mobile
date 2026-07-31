import GradientBackground from '@/components/GradientBackground';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity, // <-- ¡CORREGIDO!
  View // <-- CORREGIDO!
} from 'react-native';
import { Button, IconButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Importación del logo de la aplicación para el header
import logo from '@/assets/images/logo.png';
// Importación de la gráfica de login (SVG)
import loginGraphic from '@/assets/images/login_graphic.png';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/auth/forgot-password`;

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showToast = (type: 'error' | 'success', text1: string, text2: string) => {
    Toast.show({
      type: type,
      text1: text1,
      text2: text2,
      position: 'bottom',
    });
  };

  const validateEmail = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showToast('error', 'Error de correo', 'Por favor ingresa un correo electrónico válido.');
      return false;
    }
    return true;
  };

  const handleSendEmail = async () => {
    setError('');
    if (!validateEmail()) return;

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      const data = await response.json();

      // Cognito devuelve 200 incluso si el usuario no existe para evitar enumeración.
      // Si hay un error claro de la API, lo manejamos.
      if (response.ok) {
        console.log('Código de recuperación solicitado con éxito a:', email);
        showToast('success', 'Código Enviado', 'Revisa tu bandeja de entrada y sigue las instrucciones.');
        
        // Redireccionar a la pantalla de ingreso del código
        router.push({
          pathname: '/auth/reset-password',
          params: { email: email.trim() },
        });
      } else {
        // Manejo de errores específicos de la API o de red
        showToast('error', 'Error al solicitar', data.message || 'El correo electrónico no fue encontrado o hubo un error en el envío.');
      }
    } catch (err) {
      console.error('Error de red o del servidor:', err);
      showToast('error', 'Error de Conexión', 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Header con Logo y Botón de Cierre */}
        <View style={styles.appHeader}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.appNameText}>Empleos Nariño</Text>
          <IconButton
            icon="close"
            size={24}
            onPress={() => router.back()}
            iconColor="#000"
            style={styles.closeButton}
          />
        </View>

        <View style={styles.mainContent}>
          {/* Gráfico Dinámico */}
          <Image source={loginGraphic} style={styles.graphicImage} />
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          
          <Text style={styles.subtitle}>
            Ingresa el correo electrónico de tu cuenta. Te enviaremos un código de verificación.
          </Text>

          

          <View style={styles.inputGroup}>
            <TextInput
              label="Correo electrónico"
              mode="outlined"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              autoCapitalize="none"
              activeOutlineColor="#076a0d" // Color principal de la app
              theme={{ colors: { primary: '#076a0d', onSurface: '#333' } }}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSendEmail}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </Button>
          
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.linkText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <Toast />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: { flex: 1 },
  // Header Styles
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logo: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  appNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
    flex: 1, 
  },
  closeButton: {
    // Espacio para IconButton
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  // 🚨 Estilo de la imagen (Gráfico)
  graphicImage: {
    width: '100%',
    height: 200, 
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  textInput: {
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#076a0d',
    color: '#fff',
    elevation: 5,
    borderRadius: 8,
  },
  buttonLabel: {
    paddingVertical: 4,
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#558B2F',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;

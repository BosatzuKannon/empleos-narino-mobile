import GradientBackground from '@/components/GradientBackground';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, IconButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Importación del logo de la aplicación
import logo from '@/assets/images/logo.png';
// Importación de la nueva gráfica para el login
import loginGraphic from '@/assets/images/login_graphic.png';

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuthStore(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error de inicio de sesión',
      text2: message,
      position: 'bottom',
    });
  };
  
  const showSuccessToast = (message: string) => {
    Toast.show({
      type: 'success',
      text1: 'Éxito',
      text2: message,
      position: 'bottom',
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Por favor ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      
      if (result.success) {
        showSuccessToast('Inicio de sesión exitoso.');
        router.replace('/(tabs)');
      } else {
        showToast(result.error || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      showToast('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Header con Logo y Nombre de la Aplicación */}
        <View style={styles.appHeader}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.appNameText}>Empleos Nariño</Text>
          {/* Botón de cierre */}
          <IconButton
            icon="close"
            size={24}
            onPress={() => router.push('/auth')}
            iconColor="#000"
            style={styles.closeButton}
          />
        </View>

        <View style={styles.mainContent}>
          
          <Text style={styles.subtitle}>¡Hola de nuevo! Nos alegra verte.</Text>
          
          {/* 🚨 Imagen de la aplicación para darle dinamismo y espacio */}
          <Image source={loginGraphic} style={styles.loginImage} />

          <View style={styles.inputGroup}>
            <TextInput
              label="Correo electrónico"
              mode="outlined"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              autoCapitalize="none"
              activeOutlineColor="#076a0d"
              theme={{ colors: { primary: '#076a0d', onSurface: '#333' } }}
            />
            <TextInput
              label="Contraseña"
              mode="outlined"
              secureTextEntry={secureTextEntry}
              value={password}
              onChangeText={setPassword}
              style={styles.textInput}
              activeOutlineColor="#076a0d"
              theme={{ colors: { primary: '#076a0d', onSurface: '#333' } }}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? 'eye-off' : 'eye'}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                />
              }
            />
            <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
              <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿No tienes una cuenta?{' '}
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={styles.linkText}>Regístrate</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Loader global */}
      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.activityIndicatorWrapper}>
            <ActivityIndicator animating={true} size="large" color="#076a0d" />
            <Text style={styles.modalText}>Iniciando sesión...</Text>
          </View>
        </View>
      </Modal>

    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: { flex: 1, marginBottom:30 },
  // Header con Logo
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },
  closeButton: {
    // Estilo del botón 'close'
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
  // 🚨 Nuevo estilo para la imagen de login
  loginImage: {
    width: '100%',
    height: 200, // Altura fija para centrar
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10, // Espacio después del subtítulo
  },
  // Estilos del contenido principal (sin cambios)
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center', // Centra el contenido verticalmente
    alignItems: 'stretch',
  },
  subtitle: { fontSize: 16, color: '#333', marginBottom: 10, textAlign: 'center' }, // Espacio reducido
  inputGroup: { marginBottom: 20 },
  textInput: { marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 8 },
  forgotPassword: { color: '#558B2F', fontWeight: 'bold', textAlign: 'right' },
  button: { marginTop: 10, marginBottom: 20, backgroundColor: '#076a0d', borderRadius: 8 }, 
  buttonLabel: { paddingVertical: 4, fontSize: 16, color: '#fff', fontWeight: 'bold' },
  footer: { marginTop: 40, alignItems: 'center' }, 
  footerText: { color: '#333', fontSize: 14 },
  linkText: { color: '#558B2F', fontWeight: 'bold' },
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  activityIndicatorWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: { marginTop: 10, fontSize: 16, color: '#333' },
});

export default LoginScreen;

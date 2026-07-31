import GradientBackground from '@/components/GradientBackground';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, View } from 'react-native';
import { Button, IconButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message'; // Importación para usar Toast

// URL del endpoint para confirmar el registro
const CONFIRM_SIGNUP_URL = `${process.env.EXPO_PUBLIC_API_URL}/auth/confirmSignup`;

// Componente principal
const EmailConfirmationScreen = () => {
  const router = useRouter();
  // USAR useLocalSearchParams para obtener los parámetros de la ruta
  const params = useLocalSearchParams();
  const userEmail = params.email as string | undefined; // Obtener el email

  // Estado para la entrada del código
  const [code, setCode] = useState<string[]>(new Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  // Eliminamos confirmationError, usaremos Toast para mostrar el error

  // Referencias para manejar el foco de los 6 inputs
  const inputRefs = useRef<Array<React.RefObject<any>>>(
    new Array(6).fill(0).map(() => React.createRef())
  );
  
  // --- Funciones de Toast ---
  const showToast = (message: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error de Confirmación',
      text2: message,
      position: 'bottom',
    });
  };

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: 'success',
      text1: '¡Cuenta Activada!',
      text2: message,
      position: 'bottom',
    });
  };
  // --- Fin Funciones de Toast ---


  // Efecto de inicialización y validación de parámetros
  useEffect(() => {
    // Si no tenemos el email, no podemos confirmar. Redirigimos al inicio de sesión.
    if (!userEmail) {
      // Usamos Toast en lugar de Alert para la coherencia
      showToast('Error de navegación. Regresa al registro o inicia sesión.');
      router.replace('/auth/login');
    }
  }, [userEmail, router]);
  
  // Efecto para verificar si el código está completo y confirmarlo
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !code.includes('')) {
      handleCodeConfirmation(fullCode);
    }
  }, [code]);

  // Maneja el cambio de dígito y el salto al siguiente campo
  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text.slice(-1);

    setCode(newCode);
    // setConfirmationError(null); // Eliminado

    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1].current?.focus();
    }
  };

  // Maneja el borrado y el salto al campo anterior
  const handleKeyPress = ({ nativeEvent: { key } }: any, index: number) => {
    if (key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1].current?.focus();
    }
  };

  // Lógica de confirmación de código
  const handleCodeConfirmation = async (fullCode: string) => {
    // Si userEmail no está definido, salimos
    if (!userEmail) return; 

    setIsLoading(true);
    // setConfirmationError(null); // Eliminado
    Keyboard.dismiss(); 

    try {
      const payload = {
        email: userEmail,
        code: fullCode,
      };

      const response = await fetch(CONFIRM_SIGNUP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Éxito: Usamos Toast en lugar de Alert
        showSuccessToast('Tu cuenta ha sido activada correctamente.');
        
        // Redirigimos después de un breve momento para que el Toast sea visible
        setTimeout(() => {
          router.replace('/auth/login');
        }, 800);

      } else {
        const errorMessage = data.message || 'El código de confirmación no es válido. Inténtalo de nuevo.';
        showToast(errorMessage); // Usamos Toast para errores
        setCode(new Array(6).fill('')); // Limpiamos los campos
        inputRefs.current[0].current?.focus(); // Devolvemos el foco
      }
    } catch (error) {
      console.error('Error al confirmar el código:', error);
      showToast('Error de conexión. Revisa tu red o inténtalo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // TODO: Implementar la función de reenvío de código (usando ForgotPasswordCommand o ResendConfirmationCode)
  const handleResendCode = () => {
     // Por ahora, solo muestra un Toast informativo
     Toast.show({
        type: 'info',
        text1: 'Reenvío solicitado',
        text2: 'Se reenviará el código si tu backend lo permite.',
        position: 'bottom'
     });
  };
  
  // Muestra un cargador o nada si el email no está disponible mientras redirigimos
  if (!userEmail) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeAreaContainer}>
          <ActivityIndicator animating={true} color="#076a0d" size="large" style={{ flex: 1, justifyContent: 'center' }} />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.headerContainer}>
          <IconButton
            icon="close"
            size={24}
            onPress={() => router.back()}
            iconColor="#000"
          />
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>¡Revisa tu correo!</Text>
          <Text style={styles.subtitle}>
            Hemos enviado un código de 6 dígitos a <Text style={styles.emailText}>{userEmail}</Text>. Ingrésalo a continuación para confirmar tu cuenta.
          </Text>

          {/* Contenedor de Inputs del Código */}
          <View style={styles.codeInputContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs.current[index]}
                style={styles.codeDigitInput}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                activeOutlineColor={'#076a0d'} 
                disabled={isLoading}
              />
            ))}
          </View>

          {/* Indicador de Carga y Mensaje de Error */}
          {isLoading ? (
            <ActivityIndicator animating={true} color="#076a0d" style={{ marginTop: 20 }} />
          ) : (
             <Text style={styles.infoText}>Código de 6 dígitos</Text>
          )}

          {/* Botón de Reenvío de Código */}
          <Button
            mode="text"
            onPress={handleResendCode}
            style={styles.resendButton}
            labelStyle={styles.resendButtonLabel}
            disabled={isLoading}
          >
            Reenviar código
          </Button>
          
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },
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
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 40,
    textAlign: 'center',
  },
  emailText: {
    fontWeight: 'bold',
    color: '#076a0d', // Usar el color primario para destacar el email
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  codeDigitInput: {
    width: 48,
    height: 60,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#fff', // Fondo blanco para inputs
    paddingHorizontal: 0, 
  },
  inputOutline: {
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    color: '#444', 
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  resendButton: {
    marginTop: 20,
  },
  resendButtonLabel: {
    color: '#558B2F', // Usar el color de enlace/botón de tu app
    fontSize: 14,
  }
});

export default EmailConfirmationScreen;

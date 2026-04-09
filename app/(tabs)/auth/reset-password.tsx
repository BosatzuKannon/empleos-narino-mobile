import GradientBackground from '@/components/GradientBackground';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, IconButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Importación de assets
import loginGraphic from '@/assets/images/login_graphic.png';
import logo from '@/assets/images/logo.png';

const API_URL = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/auth/confirmNewPassword';

// --- CONSTANTES Y COMPONENTES DE VALIDACIÓN DE CONTRASEÑA ---
const SPECIAL_CHARS_SET = '!@#$%^&*(),.?":{}|<>+-=';
const SPECIAL_CHARS_REGEX = new RegExp(`[${SPECIAL_CHARS_SET.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`);

// Componente para mostrar los requisitos de la contraseña
const PasswordRequirements = ({ password }) => {
    // Requisitos de Cognito
    const REQUIREMENTS = [
        { regex: /.{8,}/, label: 'Mínimo 8 caracteres' },
        { regex: /\d/, label: 'Al menos 1 número' },
        { regex: SPECIAL_CHARS_REGEX, label: `Al menos 1 carácter especial (${SPECIAL_CHARS_SET})` },
        { regex: /[A-Z]/, label: 'Al menos 1 mayúscula' },
        { regex: /[a-z]/, label: 'Al menos 1 minúscula' },
    ];

    return (
        <View style={styles.requirementsContainer}>
            {REQUIREMENTS.map((req, index) => {
                const isValid = req.regex.test(password);
                return (
                    <View key={index} style={styles.requirementItem}>
                        <Text style={isValid ? styles.validRequirement : styles.invalidRequirement}>
                            {isValid ? '✓' : '•'} {req.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};
// -----------------------------------------------------------


const ResetPasswordScreen = () => {
    const router = useRouter();
    // Obtenemos los parámetros de la ruta, incluido el email
    const params = useLocalSearchParams();
    const userEmail = params.email as string; // Correo enviado desde la vista anterior

    // Estados para el formulario
    const [confirmationCode, setConfirmationCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [loading, setLoading] = useState(false);

    const showToast = (type: 'error' | 'success', text1: string, text2: string) => {
        Toast.show({
            type: type,
            text1: text1,
            text2: text2,
            position: 'bottom',
        });
    };

    const validatePasswordRequirements = (pwd) => {
        if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
        if (!/\d/.test(pwd)) return 'Debe contener al menos 1 número.';
        if (!SPECIAL_CHARS_REGEX.test(pwd)) return 'Debe contener al menos 1 carácter especial válido.';
        if (!/[A-Z]/.test(pwd)) return 'Debe contener al menos 1 mayúscula.';
        if (!/[a-z]/.test(pwd)) return 'Debe contener al menos 1 minúscula.';
        return null; // Pasa la validación
    };

    const validateForm = () => {
        if (!confirmationCode.trim()) {
            showToast('error', 'Código requerido', 'Por favor ingresa el código de verificación.');
            return false;
        }

        const passwordError = validatePasswordRequirements(password);

        if (passwordError) {
            showToast('error', 'Contraseña débil', passwordError);
            return false;
        }

        if (password !== confirmPassword) {
            showToast('error', 'Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales.');
            return false;
        }
        return true;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    newPassword: password,
                    confirmationCode: confirmationCode.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Contraseña cambiada con éxito:', userEmail);
                showToast('success', 'Éxito', '¡Contraseña restablecida! Ahora puedes iniciar sesión.');

                // Navegar a la pantalla de inicio de sesión
                router.replace('/auth/login');
            } else {
                showToast('error', 'Error al restablecer', data.error || data.message || 'Código inválido o expirado.');
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const passwordValidationError = validatePasswordRequirements(password);
    const passwordErrorText = passwordValidationError && password.length > 0 ? passwordValidationError : null;


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
                    <Text style={styles.title}>Restablecer contraseña</Text>

                    <Text style={styles.subtitle}>
                        Ingresa el código enviado a: <Text style={styles.emailText}>{userEmail || 'tu correo'}</Text>
                    </Text>


                    <View style={styles.inputGroup}>
                        {/* CÓDIGO DE VERIFICACIÓN */}
                        <TextInput
                            label="Código de verificación"
                            mode="outlined"
                            keyboardType="numeric"
                            value={confirmationCode}
                            onChangeText={setConfirmationCode}
                            style={styles.textInput}
                            autoCapitalize="none"
                            activeOutlineColor="#076a0d"
                            theme={{ colors: { primary: '#076a0d', onSurface: '#333' } }}
                        />
                        
                        {/* NUEVA CONTRASEÑA */}
                        <TextInput
                            label="Nueva contraseña (mín. 8 caracteres)"
                            mode="outlined"
                            secureTextEntry={secureTextEntry}
                            value={password}
                            onChangeText={setPassword}
                            style={styles.textInput}
                            activeOutlineColor={passwordErrorText ? '#d32f2f' : '#076a0d'}
                            error={!!passwordErrorText}
                            theme={{ colors: { primary: '#076a0d', onSurface: '#333' } }}
                            right={
                                <TextInput.Icon
                                    icon={secureTextEntry ? 'eye-off' : 'eye'}
                                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                                />
                            }
                        />
                        {/* Requisitos de Contraseña */}
                        <PasswordRequirements password={password} />
                        {passwordErrorText && <Text style={styles.fieldError}>{passwordErrorText}</Text>}

                        {/* CONFIRMAR CONTRASEÑA */}
                        <TextInput
                            label="Confirmar nueva contraseña"
                            mode="outlined"
                            secureTextEntry={secureTextEntry}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
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
                        
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleResetPassword}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                        loading={loading}
                        disabled={loading}
                    >
                        {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
                    </Button>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => router.push('/profile/login')}>
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
    closeButton: {},
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
        marginBottom: 15,
        textAlign: 'center',
    },
    emailText: {
        fontWeight: 'bold',
        color: '#076a0d',
    },
    // 🚨 Estilo de la imagen (Gráfico)
    graphicImage: {
        width: '100%',
        height: 150, // Menos alto para dejar espacio al formulario
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 20,
        marginTop: 5,
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
    // --- ESTILOS AÑADIDOS PARA REQUISITOS DE CONTRASEÑA ---
    requirementsContainer: {
        marginTop: -5, // Para acercarlo al input
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    requirementItem: {
        flexDirection: 'row',
        marginVertical: 1,
    },
    validRequirement: {
        color: '#076a0d', // Verde para requisitos cumplidos
        fontSize: 12,
    },
    invalidRequirement: {
        color: '#777', // Gris para requisitos pendientes
        fontSize: 12,
    },
    fieldError: { // Reutilizado de la vista de registro
        color: '#d32f2f',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 8,
        fontWeight: '500',
    },
    // ----------------------------------------------------
});

export default ResetPasswordScreen;
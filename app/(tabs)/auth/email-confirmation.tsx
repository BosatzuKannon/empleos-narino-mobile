import GradientBackground from '@/components/GradientBackground';
import { apiFetch } from '@/lib/apiClient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button, IconButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const PRIMARY_GREEN = '#558B2F';
const RESEND_COOLDOWN_SECONDS = 30;

const EmailConfirmationScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userEmail = params.email as string | undefined;

    const [code, setCode] = useState<string[]>(new Array(6).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);

    const inputRefs = useRef<React.RefObject<any>[]>(
        new Array(6).fill(0).map(() => React.createRef())
    );

    const showToast = (message: string) => {
        Toast.show({
            type: 'error',
            text1: 'Error de Verificación',
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

    const showInfoToast = (message: string) => {
        Toast.show({
            type: 'info',
            text1: 'Código Reenviado',
            text2: message,
            position: 'bottom',
        });
    };

    useEffect(() => {
        if (!userEmail) {
            showToast('Error de navegación. Regresa al registro o inicia sesión.');
            router.replace('/auth/login');
        }
    }, [userEmail, router]);

    useEffect(() => {
        if (!secondsLeft) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    useEffect(() => {
        const fullCode = code.join('');
        if (fullCode.length === 6 && !code.includes('') && !isLoading) {
            handleCodeConfirmation(fullCode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const handleChange = (text: string, index: number) => {
        if (!/^\d*$/.test(text)) return;

        const newCode = [...code];
        newCode[index] = text.slice(-1);

        setCode(newCode);

        if (text.length === 1 && index < 5) {
            inputRefs.current[index + 1].current?.focus();
        }
    };

    const handleKeyPress = ({ nativeEvent: { key } }: any, index: number) => {
        if (key === 'Backspace' && code[index] === '' && index > 0) {
            inputRefs.current[index - 1].current?.focus();
        }
    };

    const clearAndRefocus = () => {
        setCode(new Array(6).fill(''));
        inputRefs.current[0].current?.focus();
    };

    const handleCodeConfirmation = async (fullCode: string) => {
        if (!userEmail || isLoading) return;

        setIsLoading(true);
        Keyboard.dismiss();

        try {
            const data = await apiFetch('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({
                    email: userEmail,
                    code: fullCode,
                }),
            });

            if (data?.statusCode === 200) {
                showSuccessToast('Tu cuenta ha sido activada correctamente.');
                setTimeout(() => {
                    router.replace('/auth/login');
                }, 1000);
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'El código de confirmación no es válido.';
            showToast(message);
            clearAndRefocus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!userEmail || isResending) return;

        setIsResending(true);

        try {
            const data = await apiFetch('/auth/resend-otp', {
                method: 'POST',
                body: JSON.stringify({ email: userEmail }),
            });

            if (data?.statusCode === 200) {
                showInfoToast('Se envió un nuevo código a tu correo.');
                setSecondsLeft(RESEND_COOLDOWN_SECONDS);
                clearAndRefocus();
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'No se pudo reenviar el código.';
            showToast(message);
        } finally {
            setIsResending(false);
        }
    };

    const handleVerifyPress = () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            showToast('Ingresa los 6 dígitos del código.');
            return;
        }
        handleCodeConfirmation(fullCode);
    };

    if (!userEmail) {
        return (
            <GradientBackground>
                <SafeAreaView style={styles.safeAreaContainer}>
                    <ActivityIndicator
                        animating={true}
                        color={PRIMARY_GREEN}
                        size="large"
                        style={{ flex: 1, justifyContent: 'center' }}
                    />
                </SafeAreaView>
            </GradientBackground>
        );
    }

    const resendDisabled = isResending || secondsLeft > 0;

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeAreaContainer}>
                <View style={styles.headerContainer}>
                    <IconButton
                        icon="close"
                        size={24}
                        onPress={() => router.back()}
                        iconColor="#000"
                        style={styles.backButton}
                    />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>Verifica tu correo</Text>
                        <Text style={styles.subtitle}>
                            Te enviamos un código de 6 dígitos a{' '}
                            <Text style={styles.emailText}>{userEmail}</Text>. Ingresalo para
                            activar tu cuenta.
                        </Text>

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
                                    activeOutlineColor={PRIMARY_GREEN}
                                    textColor="#000000"
                                    disabled={isLoading}
                                />
                            ))}
                        </View>

                        {isLoading ? (
                            <ActivityIndicator
                                animating={true}
                                color={PRIMARY_GREEN}
                                style={{ marginTop: 12 }}
                            />
                        ) : (
                            <Text style={styles.infoText}>Código de 6 dígitos</Text>
                        )}

                        <Button
                            mode="contained"
                            onPress={handleVerifyPress}
                            style={styles.button}
                            labelStyle={styles.buttonLabel}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verificando...' : 'Verificar código'}
                        </Button>

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendHint}>
                                ¿No recibiste el código?
                            </Text>
                            <Button
                                mode="text"
                                onPress={handleResendCode}
                                style={styles.resendButton}
                                labelStyle={styles.resendButtonLabel}
                                disabled={resendDisabled}
                                loading={isResending}
                            >
                                {secondsLeft > 0
                                    ? `Reenviar en ${secondsLeft}s`
                                    : 'Reenviar código'}
                            </Button>
                        </View>
                    </View>
                </ScrollView>
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
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        margin: 0,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'left',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: '#666666',
        textAlign: 'left',
        marginBottom: 24,
    },
    emailText: {
        fontWeight: 'bold',
        color: PRIMARY_GREEN,
    },
    codeInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    codeDigitInput: {
        width: 46,
        height: 58,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        backgroundColor: '#ffffff',
        paddingHorizontal: 0,
    },
    inputOutline: {
        borderRadius: 10,
        borderWidth: 2,
    },
    infoText: {
        color: '#666666',
        textAlign: 'left',
        marginTop: 4,
        marginBottom: 4,
        fontSize: 13,
    },
    button: {
        marginTop: 16,
        backgroundColor: PRIMARY_GREEN,
        elevation: 3,
        borderRadius: 10,
    },
    buttonLabel: {
        paddingVertical: 4,
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    resendContainer: {
        marginTop: 20,
        alignItems: 'flex-start',
    },
    resendHint: {
        color: '#666666',
        fontSize: 13,
        textAlign: 'left',
    },
    resendButton: {
        marginTop: 4,
        marginLeft: -8,
    },
    resendButtonLabel: {
        color: PRIMARY_GREEN,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default EmailConfirmationScreen;

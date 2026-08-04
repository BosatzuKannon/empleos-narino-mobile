import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';

// Importaciones de assets
import HireIcon from '@/assets/icons/hire.json';
import HireIconInactive from '@/assets/icons/hireInactive.json';
import HistoryIcon from '@/assets/icons/history.json';
import HistoryIconInactive from '@/assets/icons/historyInactive.json';
import HomeIcon from '@/assets/icons/home.json';
import HomeInactiveIcon from '@/assets/icons/homeInactive.json';
import LoginIcon from '@/assets/icons/login.json';
import LoginIconInactive from '@/assets/icons/loginInactive.json';
import TodoIcon from '@/assets/icons/todo.json';
import TodoIconInactive from '@/assets/icons/todoInactive.json';
import User from '@/assets/icons/user.json';
import UserInactive from '@/assets/icons/userInactive.json';

// =======================================================
// COMPONENTE DE BANNER DE ESTADO DEL SERVICIO (DINÁMICO)
// =======================================================
const ServiceStatusBanner = () => {
    // 🆕 Consumimos también el tipo de estado
    const { appStatusVisible, appStatusMessage, appStatusType } = useAuthStore();
    const [isDismissed, setIsDismissed] = useState(false);

    // Reiniciar dismiss si el mensaje vuelve a activarse
    useEffect(() => {
        if (appStatusVisible) {
            setIsDismissed(false);
        }
    }, [appStatusVisible]);

    if (!appStatusVisible || isDismissed) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
    };

    // 🎨 Lógica de estilos dinámica según el tipo
    const getBannerStyles = (type: number) => {
        switch (type) {
            case 1: // POSITIVO / ÉXITO (Verde)
                return {
                    container: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
                    text: { color: '#2E7D32' },
                    iconColor: '#2E7D32',
                    iconName: 'checkmark-circle-outline' as const
                };
            case 2: // WARNING / ADVERTENCIA (Naranja)
                return {
                    container: { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' },
                    text: { color: '#EF6C00' },
                    iconColor: '#EF6C00',
                    iconName: 'alert-circle-outline' as const
                };
            case 3: // ERROR / CRÍTICO (Rojo)
                return {
                    container: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
                    text: { color: '#C62828' },
                    iconColor: '#C62828',
                    iconName: 'warning-outline' as const
                };
            case 4: // 🆕 INFORMATIVO (Azul)
                return {
                    container: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' },
                    text: { color: '#1565C0' },
                    iconColor: '#1565C0',
                    iconName: 'information-circle-outline' as const
                };
            default: // Fallback (Warning)
                return {
                    container: { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' },
                    text: { color: '#EF6C00' },
                    iconColor: '#EF6C00',
                    iconName: 'alert-circle-outline' as const
                };
        }
    };

    const stylesConfig = getBannerStyles(appStatusType);

    return (
        <View style={statusStyles.bannerWrapper}>
            <View style={[statusStyles.bannerContainer, stylesConfig.container]}>
                <View style={statusStyles.messageContent}>
                    <Ionicons 
                        name={stylesConfig.iconName} 
                        size={20} 
                        color={stylesConfig.iconColor} 
                        style={statusStyles.icon} 
                    />
                    <Text style={[statusStyles.messageText, stylesConfig.text]}>
                        {appStatusMessage}
                    </Text> 
                </View>
                <TouchableOpacity onPress={handleDismiss} style={statusStyles.dismissButton}>
                    <Ionicons name="close-circle-outline" size={24} color={stylesConfig.iconColor} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const TabLayout = () => {
    const { isAuthenticated, isLoading, user } = useAuthStore();

    const userRole = user?.['custom:user_type'] || '';
    const isApplicant = userRole === 'CANDIDATE';
    const isEnterprise = userRole === 'COMPANY_ADMIN' || userRole === 'SUPER_ADMIN';

    if (isLoading) {
        return null; 
    }

    return (
        <PaperProvider>
            <View style={{ flex: 1 }}> 
                
                <Tabs
                    initialRouteName="index"
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: '#04610aff',
                        tabBarInactiveTintColor: '#666666',
                        tabBarStyle: styles.tabBarStyle,
                    }}
                >
                    {/* INICIO */}
                    <Tabs.Screen
                        name="index"
                        options={{
                            tabBarLabel: 'Inicio',
                            tabBarIcon: ({ focused, size }) => (
                                <LottieView
                                    source={focused ? HomeIcon : HomeInactiveIcon}
                                    style={{ width: size, height: size }}
                                    autoPlay={focused}
                                    loop={focused}
                                />
                            ),
                        }}
                    />

                    {/* LOGIN */}
                    <Tabs.Screen
                        name="auth"
                        options={{
                            href: isAuthenticated ? null : '/auth',
                            tabBarLabel: 'Ingresar',
                            tabBarIcon: ({ focused, size }) => (
                                <LottieView
                                    source={focused ? LoginIcon : LoginIconInactive}
                                    style={{ width: size, height: size }}
                                    autoPlay={focused}
                                    loop={focused}
                                />
                            ),
                        }}
                    />

                    {/* MIS POSTULACIONES */}
                    <Tabs.Screen
                        name="applications"
                        options={{
                            href: (isAuthenticated && isApplicant) ? '/applications' : null,
                            tabBarLabel: 'Mis postulaciones',
                            tabBarIcon: ({ focused, size }) => (
                                <LottieView
                                    source={focused ? HireIcon : HireIconInactive}
                                    style={{ width: size, height: size }}
                                    autoPlay={focused}
                                    loop={focused}
                                />
                            ),
                        }}
                    />

                    {/* MIS SERVICIOS */}
                    <Tabs.Screen
                        name="my-services"
                        options={{
                            href: (isAuthenticated && isApplicant) ? '/my-services' : null,
                            tabBarLabel: 'Mis servicios',
                            tabBarIcon: ({ focused, size }) => (
                                <LottieView
                                    source={focused ? HistoryIcon : HistoryIconInactive}
                                    style={{ width: size, height: size }}
                                    autoPlay={focused}
                                    loop={focused}
                                />
                            ),
                        }}
                    />

                    {/* MIS VACANTES */}
                    <Tabs.Screen
                        name="offers"
                        options={{
                            href: (isAuthenticated && isEnterprise) ? '/offers' : null,
                            tabBarLabel: 'Mis vacantes',
                            tabBarIcon: ({ focused, size }) => (
                                <LottieView
                                    source={focused ? TodoIcon : TodoIconInactive}
                                    style={{ width: size, height: size }}
                                    autoPlay={focused}
                                    loop={focused}
                                />
                            ),
                        }}
                    />

                    {/* PERFIL */}
                    <Tabs.Screen
                        name="profile"
                        options={{
                            href: !isAuthenticated ? null : '/profile',
                            tabBarLabel: 'Perfil',
                            tabBarIcon: ({ focused, size }) => (
                                <LottieView
                                    source={focused ? User : UserInactive}
                                    style={{ width: size, height: size }}
                                    autoPlay={focused}
                                    loop={focused}
                                />
                            ),
                        }}
                    />
                </Tabs>

                {/* Banner Dinámico */}
                <ServiceStatusBanner />
            </View>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    tabBarStyle: {
        ...Platform.select({
            ios: {
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
        }),
        position: 'absolute',
        bottom: 25,
        marginHorizontal: 20,
        borderRadius: 15,
        height: 60,
        backgroundColor: '#fdfdfdff',
        borderWidth: 1,
        borderColor: '#076a0d'
    },
});

const statusStyles = StyleSheet.create({
    bannerWrapper: {
        position: 'absolute',
        bottom: 95, 
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    bannerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // El backgroundColor y borderColor ahora vienen del estilo dinámico
        padding: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        width: '100%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            }
        })
    },
    messageContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    icon: {
        marginRight: 8,
    },
    messageText: {
        fontSize: 13,
        // El color del texto viene del estilo dinámico
        flexShrink: 1,
        fontWeight: '500',
    },
    dismissButton: {
        padding: 5,
    }
});

export default TabLayout;
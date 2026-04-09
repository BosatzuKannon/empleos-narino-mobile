import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 🚨 URL de tu microservicio
const APP_VERSION_API_URL = 'https://2282qxh1me.execute-api.us-east-2.amazonaws.com/dev/config/checkAppVersion';

// 1. Crear el Contexto con valores por defecto seguros
interface AuthContextType {
    isAuthenticated: boolean;
    signIn: (token: string, userData: any) => Promise<void>;
    signOut: () => Promise<void>;
    getUserData: () => Promise<any>;
    user: any;
    isLoading: boolean;
    isOutdated: boolean;
    outdatedMessage: string;
    
    // 🆕 Nuevos estados para el sistema de mensajes
    appStatusVisible: boolean; // Reemplaza a isAppDown
    appStatusMessage: string;
    appStatusType: number;     // 1: Info/Éxito, 2: Warning, 3: Error
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    signIn: async () => {},
    signOut: async () => {},
    getUserData: async () => null,
    user: null,
    isLoading: true,
    isOutdated: false,
    outdatedMessage: '',
    
    // 🆕 Valores por defecto
    appStatusVisible: false,
    appStatusMessage: '',
    appStatusType: 2, // Default Warning
});

// Hook personalizado
export const useAuth = () => useContext(AuthContext);

// 2. Crear el Proveedor del Contexto
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOutdated, setIsOutdated] = useState(false);
    const [outdatedMessage, setOutdatedMessage] = useState('');
    
    // 🆕 Estados para mensajes dinámicos
    const [appStatusVisible, setAppStatusVisible] = useState(false);
    const [appStatusMessage, setAppStatusMessage] = useState('');
    const [appStatusType, setAppStatusType] = useState(2);

    // --- Función de Verificación de Versión y Estado del Servicio ---
    const checkAppVersion = async () => {
        try {
            const currentAppVersionCode = Constants.expoConfig?.android?.versionCode || 0;

            if (currentAppVersionCode === 0) {
                console.log("Development environment detected. Skipping forced update check.");
            } else {
                console.log(`Current App Version Code: ${currentAppVersionCode}`);
            }

            // 2. Consumir el microservicio
            const response = await fetch(APP_VERSION_API_URL);

            if (!response.ok) throw new Error("API failed to return version config.");

            const config = await response.json();
            console.log('Config Service Response:', config);
            
            // 🚨 Lógica de Mensajes Dinámicos (Actualizada)
            // app_status: true -> MOSTRAR BANNER
            // app_status: false -> OCULTAR BANNER
            const shouldShowBanner = config.app_status === true; 
            
            if (shouldShowBanner) {
                setAppStatusVisible(true);
                setAppStatusMessage(config.app_status_message || 'Aviso importante del sistema.');
                setAppStatusType(config.app_status_type || 2); // Default a warning si no viene
                console.log(`📢 SYSTEM MESSAGE (${config.app_status_type}): ${config.app_status_message}`);
            } else {
                setAppStatusVisible(false);
                setAppStatusMessage('');
                setAppStatusType(2);
            }
            // ----------------------------------------------------

            // 3. Lógica de verificación de versión
            const minRequiredCode = config.min_version_code || 1;

            if (currentAppVersionCode !== 0 && currentAppVersionCode < minRequiredCode) {
                console.log(`APP OUTDATED: Current (${currentAppVersionCode}) < Required (${minRequiredCode})`);
                setIsOutdated(true);
                setOutdatedMessage(config.message_es || 'Hay una actualización obligatoria para continuar.');
            } else {
                setIsOutdated(false);
                setOutdatedMessage('');
                console.log("App version is up-to-date.");
            }

        } catch (e) {
            console.error('Error checking app version/status:', e);
            // Si falla la API, mostramos un error genérico por seguridad (tipo 3)
            setAppStatusVisible(true);
            setAppStatusType(3); 
            setAppStatusMessage('No se pudo verificar el estado del servicio. Puede haber problemas de conexión.');
        }
    };

    // 4. Implementar las funciones de autenticación (sin cambios mayores)
    const signIn = async (token: string, userData: any) => {
        try {
            if (!token) throw new Error('El token no puede ser nulo o undefined');

            await AsyncStorage.setItem('userToken', token);

            let decoded = null;
            try {
                decoded = jwtDecode(token);
                await AsyncStorage.setItem('decodedToken', JSON.stringify(decoded));
            } catch (err) {
                console.error('❌ Error al decodificar el token:', err);
            }

            if (userData && Object.keys(userData).length > 0) {
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                setUser(decoded);
            } else if (decoded) {
                await AsyncStorage.setItem('userData', JSON.stringify(decoded));
                setUser(decoded);
            } else {
                await AsyncStorage.removeItem('userData');
                setUser(null);
            }

            setIsAuthenticated(true);
        } catch (e) {
            console.error('Error al guardar token/datos de usuario:', e);
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('decodedToken');
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Error during sign out:', error);
            throw error;
        }
    };

    const getUserData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('decodedToken');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            return null;
        }
    };

    useEffect(() => {
        const loadAuthAndVersionStatus = async () => {
            try {
                await checkAppVersion();

                const storedToken = await AsyncStorage.getItem('userToken');
                const storedUser = await AsyncStorage.getItem('decodedToken');

                if (storedToken && storedUser) {
                    setIsAuthenticated(true);
                    setUser(JSON.parse(storedUser));
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (e) {
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        loadAuthAndVersionStatus();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                signIn,
                signOut,
                getUserData,
                user,
                isLoading,
                isOutdated,
                outdatedMessage,
                // 🆕 Exponemos los nuevos valores
                appStatusVisible, 
                appStatusMessage,
                appStatusType
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
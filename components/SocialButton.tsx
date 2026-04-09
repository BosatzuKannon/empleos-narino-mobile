// components/SocialButton.tsx

import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SocialButtonProps {
  iconSource: any; // El archivo .json de Lottie
  label: string;
  onPress: () => void;
}

const SocialButton: React.FC<SocialButtonProps> = ({ iconSource, label, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrapper}>
        <LottieView
          source={iconSource}
          style={styles.icon}
          autoPlay
          loop
        />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  iconWrapper: {
    position: 'absolute',
    left: 15,
  },
  icon: {
    width: 25,
    height: 25,
  },
  label: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});

export default SocialButton;
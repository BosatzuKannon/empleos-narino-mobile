// components/AnimatedShortcutCard.tsx
import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';

const AnimatedShortcutCard = ({ iconSource, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.shortcutCard} onPress={onPress}>
      <LottieView
        source={iconSource}
        autoPlay
        loop
        style={styles.lottieIcon}
      />
      <Text style={styles.shortcutText}>{label}</Text>
      <IconButton icon="arrow-right" size={20} iconColor="#777777" onPress={onPress} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 242, 242, 1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  lottieIcon: {
    width: 40,
    height: 40,
  },
  shortcutText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#000',
  },
});

export default AnimatedShortcutCard;
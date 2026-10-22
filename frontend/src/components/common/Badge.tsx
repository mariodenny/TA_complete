import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'mint' | 'outline';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: Colors.successLight, text: Colors.success, border: 'transparent' };
      case 'warning':
        return { bg: Colors.warningLight, text: Colors.warning, border: 'transparent' };
      case 'error':
        return { bg: Colors.errorLight, text: Colors.error, border: 'transparent' };
      case 'mint':
        return { bg: Colors.surfaceMintLight, text: Colors.primaryDark, border: 'transparent' };
      case 'outline':
        return { bg: 'transparent', text: Colors.textSecondary, border: Colors.border };
      case 'default':
      default:
        return { bg: '#EEF3EE', text: '#556658', border: 'transparent' };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border !== 'transparent' ? 1 : 0,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? 8 : 10,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: size === 'sm' ? 11 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '500',
  },
});


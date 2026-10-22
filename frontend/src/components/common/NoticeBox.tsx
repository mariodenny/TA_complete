import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface NoticeBoxProps {
  message: string;
  type?: 'info' | 'warning' | 'alert';
  style?: ViewStyle;
}

export const NoticeBox: React.FC<NoticeBoxProps> = ({
  message,
  type = 'info',
  style,
}) => {
  const isWarning = type === 'warning';

  return (
    <View
      style={[
        styles.container,
        isWarning && styles.warningContainer,
        style,
      ]}
    >
      <Ionicons
        name={isWarning ? 'warning-outline' : 'information-circle-outline'}
        size={20}
        color={isWarning ? Colors.warning : '#46664F'}
        style={styles.icon}
      />
      <Text style={[styles.text, isWarning && styles.warningText]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF4EF',
    borderWidth: 1,
    borderColor: '#D8E5D9',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  warningContainer: {
    backgroundColor: Colors.warningLight,
    borderColor: '#F3E5C8',
  },
  icon: {
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 12.5,
    color: '#46664F',
    lineHeight: 18,
  },
  warningText: {
    color: '#8A6115',
  },
});


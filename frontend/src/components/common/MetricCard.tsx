import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  subtitle?: string;
  statusBadge?: string;
  isStale?: boolean;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon,
  color = Colors.primary,
  subtitle,
  statusBadge,
  isStale = false,
  style,
}) => {
  const displayValue = value === null || value === undefined ? '--' : value;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: color + '1A' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {statusBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusBadge}</Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>{label}</Text>

      <View style={styles.valueRow}>
        <Text style={[styles.value, isStale && styles.staleValue]}>
          {displayValue}
        </Text>
        {unit && value !== null && value !== undefined && (
          <Text style={styles.unit}>{unit}</Text>
        )}
      </View>

      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : isStale ? (
        <Text style={styles.staleText}>⚠️ Stale reading</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flex: 1,
    minWidth: 140,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: Colors.surfaceMintLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  staleValue: {
    color: Colors.textMuted,
  },
  unit: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  staleText: {
    fontSize: 11,
    color: Colors.warning,
    marginTop: 4,
  },
});


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { useApp } from '../../context/AppContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();
  const { isMockMode, setIsMockMode } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = 'Email wajib diisi';
    } else if (!email.includes('@')) {
      errs.email = 'Format email tidak valid';
    }
    if (!password) {
      errs.password = 'Kata sandi wajib diisi';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Gagal Masuk', err.message || 'Email atau kata sandi salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Masuk ke Akun"
        subtitle="Kelola dan pantau sistem Smart Pot IoT Anda."
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={32} color={Colors.primary} />
          </View>

          <Text style={styles.welcomeText}>Selamat Datang</Text>
          <Text style={styles.subText}>Masuk untuk menghubungkan perangkat ESP32</Text>

          <Input
            label="Alamat Email"
            placeholder="nama@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Kata Sandi"
            placeholder="Masukkan kata sandi"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            isPassword
            error={errors.password}
          />

          <Button
            title="Masuk"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <View style={styles.registerPrompt}>
            <Text style={styles.promptText}>Belum memiliki akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Development test mode indicator */}
        <View style={styles.mockModeBar}>
          <Ionicons
            name={isMockMode ? 'cube-outline' : 'server-outline'}
            size={16}
            color={Colors.textSecondary}
          />
          <Text style={styles.mockModeText}>
            Target: {isMockMode ? 'Mode Mock / Standalone' : 'Backend Flask Aktif'}
          </Text>
          <TouchableOpacity
            onPress={() => setIsMockMode(!isMockMode)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.toggleMockLink}>
              {isMockMode ? 'Beralih ke Real API' : 'Beralih ke Mock'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    padding: Spacing.xl,
    marginTop: Spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceMintLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  loginBtn: {
    height: 48,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  promptText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  mockModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  mockModeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  toggleMockLink: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

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
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'Nama pengguna wajib diisi';
    if (!email.trim()) {
      errs.email = 'Email wajib diisi';
    } else if (!email.includes('@')) {
      errs.email = 'Format email tidak valid';
    }
    if (!password) {
      errs.password = 'Kata sandi wajib diisi';
    } else if (password.length < 6) {
      errs.password = 'Kata sandi minimal 6 karakter';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Kata sandi konfirmasi tidak cocok';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const msg = await register(username.trim(), email.trim(), password);
      Alert.alert('Registrasi Berhasil', msg, [
        {
          text: 'Masuk Sekarang',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Gagal Registrasi', err.message || 'Terjadi kesalahan saat registrasi.');
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
        title="Buat Akun Baru"
        subtitle="Bergabung dengan platform Smart Pot IoT."
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Input
            label="Nama Pengguna"
            placeholder="cth. Budiman"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors({ ...errors, username: '' });
            }}
            error={errors.username}
          />

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
            placeholder="Minimal 6 karakter"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            isPassword
            error={errors.password}
          />

          <Input
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            isPassword
            error={errors.confirmPassword}
          />

          <Button
            title="Daftar Akun"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerBtn}
          />

          <View style={styles.loginPrompt}>
            <Text style={styles.promptText}>Sudah memiliki akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </Card>
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
    marginTop: Spacing.sm,
  },
  registerBtn: {
    height: 48,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  loginPrompt: {
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
});

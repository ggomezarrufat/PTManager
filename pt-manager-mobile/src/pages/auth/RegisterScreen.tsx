import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const RegisterScreen: React.FC = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, loading, error } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await signUp(email, password, fullName, nickname);
      Alert.alert(
        'Registro exitoso',
        'Revisa tu email para confirmar tu cuenta',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      Alert.alert('Error', 'Error al crear la cuenta');
    }
  };

  return (
    <LinearGradient
      colors={['#0c0c0c', '#1a1a1a']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="person-add" size={80} color="#ff4757" />
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a PT Manager</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color="#b0b0b0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre completo (opcional)"
                placeholderTextColor="#666"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="at" size={20} color="#b0b0b0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Apodo (opcional)"
                placeholderTextColor="#666"
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#b0b0b0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#b0b0b0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña *"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#b0b0b0"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#b0b0b0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña *"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#b0b0b0"
                />
              </TouchableOpacity>
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginLink}>Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#ffffff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#ff4757',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  loginLink: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;


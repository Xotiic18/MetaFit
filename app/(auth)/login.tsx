import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const validate = (): string | null => {
    if (!email.trim() || !password.trim()) return 'Por favor llena todos los campos';
    if (!EMAIL_REGEX.test(email)) return 'El correo no tiene un formato válido';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  };

  async function handleAuth() {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Datos inválidos', validationError);
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;

        // Si hay sesión activa, ir directo (confirmación de email desactivada en Supabase)
        if (data.session) {
          router.replace('/(tabs)');
        } else {
          Alert.alert(
            '¡Registro exitoso!',
            'Revisa tu correo electrónico para confirmar tu cuenta.',
            [{ text: 'Entendido', onPress: () => setIsRegistering(false) }]
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      // Mensajes de error más amigables
      const friendlyMessage =
        error.message.includes('Invalid login') ? 'Correo o contraseña incorrectos.' :
        error.message.includes('Email not confirmed') ? 'Confirma tu correo antes de iniciar sesión.' :
        error.message.includes('already registered') ? 'Este correo ya tiene una cuenta registrada.' :
        error.message;

      Alert.alert('Error', friendlyMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Ionicons name="barbell" size={80} color="#A855F7" style={styles.logo} />
        <Text style={styles.title}>MetaFit</Text>
        <Text style={styles.subtitle}>
          {isRegistering ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(p => !p)}
            hitSlop={10}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>
                {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setIsRegistering(r => !r); setPassword(''); }}
          style={styles.switchButton}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            {isRegistering
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  innerContainer: { flex: 1, justifyContent: 'center', padding: 30, alignItems: 'center' },
  logo: { marginBottom: 10 },
  title: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#A855F7', fontSize: 16, marginBottom: 35 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 12,
    marginBottom: 15, paddingHorizontal: 15,
    borderWidth: 1, borderColor: '#222', width: '100%',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', height: 52 },
  button: {
    backgroundColor: '#A855F7', width: '100%',
    height: 55, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchButton: { marginTop: 22 },
  switchText: { color: '#666', fontSize: 14 },
});
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Modal,
  TextInput, SafeAreaView,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Stats = {
  totalVolumen: number;
  diasEntrenados: number;
  rachaActual: number;
  totalSesiones: number;
};

type Session = {
  id: string;
  routine_name: string;
  completed_at: string;
  ejercicios: number;
};

type ExerciseProgress = {
  exercise_name: string;
  weight_kg: number;
  logged_at: string;
};

export default function ProfileScreen() {
  const [loading, setLoading]         = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [userEmail, setUserEmail]     = useState('');
  const [stats, setStats] = useState<Stats>({
    totalVolumen: 0, diasEntrenados: 0, rachaActual: 0, totalSesiones: 0,
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);

  // Configuración
  const [settingsVisible, setSettingsVisible]   = useState(false);
  const [editingName, setEditingName]           = useState('');
  const [savingName, setSavingName]             = useState(false);
  const [newEmail, setNewEmail]                 = useState('');
  const [savingEmail, setSavingEmail]           = useState(false);
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [savingPassword, setSavingPassword]     = useState(false);
  const [showNewPass, setShowNewPass]           = useState(false);
  const [showConfirmPass, setShowConfirmPass]   = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUserEmail(session.user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .maybeSingle();

      setDisplayName(profile?.display_name || '');

      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      const hace7DiasISO = hace7Dias.toISOString();

      const { data: sessionData, error: sError } = await supabase
        .from('workout_sessions')
        .select('id, routine_name, completed_at')
        .eq('user_id', session.user.id)
        .gte('completed_at', hace7DiasISO)
        .order('completed_at', { ascending: false });

      if (sError) throw sError;

      const sessionIds = (sessionData || []).map(s => s.id);
      let logsData: any[] = [];

      if (sessionIds.length > 0) {
        const { data: logs, error: lError } = await supabase
          .from('workout_logs')
          .select('session_id, exercise_name, sets, reps, weight_kg, logged_at')
          .in('session_id', sessionIds)
          .order('logged_at', { ascending: false });
        if (lError) throw lError;
        logsData = logs || [];
      }

      const totalVolumen = logsData.reduce((acc, log) =>
        acc + (log.sets * log.reps * log.weight_kg), 0);

      const diasUnicos = new Set(
        (sessionData || []).map(s => s.completed_at.split('T')[0])
      );

      const sortedDays = Array.from(diasUnicos).sort().reverse();
      let racha = 0;
      const hoy = new Date();
      for (let i = 0; i < sortedDays.length; i++) {
        const diaEsperado = new Date(hoy);
        diaEsperado.setDate(hoy.getDate() - i);
        if (sortedDays[i] === diaEsperado.toISOString().split('T')[0]) racha++;
        else break;
      }

      const sessionList: Session[] = (sessionData || []).map(s => ({
        id: s.id,
        routine_name: s.routine_name,
        completed_at: s.completed_at,
        ejercicios: logsData.filter(l => l.session_id === s.id).length,
      }));

      const exerciseMap = new Map<string, ExerciseProgress>();
      logsData.forEach(log => {
        if (!exerciseMap.has(log.exercise_name)) {
          exerciseMap.set(log.exercise_name, {
            exercise_name: log.exercise_name,
            weight_kg: log.weight_kg,
            logged_at: log.logged_at,
          });
        }
      });

      setStats({
        totalVolumen: Math.round(totalVolumen),
        diasEntrenados: diasUnicos.size,
        rachaActual: racha,
        totalSesiones: (sessionData || []).length,
      });
      setSessions(sessionList);
      setProgress(Array.from(exerciseMap.values()));

    } catch {
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const saveDisplayName = async () => {
    if (!editingName.trim()) return;
    setSavingName(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase
        .from('profiles')
        .update({ display_name: editingName.trim() })
        .eq('id', session.user.id);
      setDisplayName(editingName.trim());
      Alert.alert('✓ Guardado', 'Tu nombre fue actualizado.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el nombre.');
    } finally {
      setSavingName(false);
    }
  };

  const changeEmail = async () => {
    if (!newEmail.trim()) return;
    if (!EMAIL_REGEX.test(newEmail)) {
      Alert.alert('Error', 'El correo no tiene un formato válido.');
      return;
    }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase(),
      });
      if (error) throw error;
      Alert.alert(
        'Correo enviado',
        'Revisa tu bandeja de entrada y confirma el cambio de correo.',
        [{ text: 'OK', onPress: () => setNewEmail('') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSavingEmail(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword.trim()) return;
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('✓ Listo', 'Tu contraseña fue actualizada.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
      }},
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  };

  const formatVolumen = (kg: number): string => {
    if (kg >= 1_000_000) return `${(kg / 1000).toFixed(0)}t`;
    if (kg >= 1_000)     return `${kg.toLocaleString('es-MX')} kg`;
    return `${kg} kg`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  const initials      = displayName
    ? displayName.charAt(0).toUpperCase()
    : (userEmail?.charAt(0).toUpperCase() || '?');
  const nombreMostrado = displayName || userEmail;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{nombreMostrado}</Text>
          {displayName !== '' && (
            <Text style={styles.emailSmall} numberOfLines={1}>{userEmail}</Text>
          )}
          <View style={styles.tagContainer}>
            <Text style={styles.tag}>Atleta</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <Text style={styles.sectionTitle}>Últimos 7 días</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="flash" size={22} color="#A855F7" />
            <Text style={styles.statNumber}>{stats.totalSesiones}</Text>
            <Text style={styles.statLabel}>Sesiones</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={22} color="#A855F7" />
            <Text style={styles.statNumber}>{stats.diasEntrenados}</Text>
            <Text style={styles.statLabel}>Días activos</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={22} color="#A855F7" />
            <Text style={styles.statNumber}>{stats.rachaActual}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="barbell" size={22} color="#A855F7" />
            <Text style={styles.statNumber}>{formatVolumen(stats.totalVolumen)}</Text>
            <Text style={styles.statLabel}>Volumen</Text>
          </View>
        </View>

        {/* ── Historial ── */}
        <Text style={styles.sectionTitle}>Historial de entrenamientos</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={32} color="#333" />
            <Text style={styles.emptyText}>Sin sesiones esta semana</Text>
            <Text style={styles.emptySubtext}>
              Completa un entrenamiento para verlo aquí
            </Text>
          </View>
        ) : (
          sessions.map(s => (
            <View key={s.id} style={styles.sessionCard}>
              <View style={styles.sessionIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#A855F7" />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionName}>{s.routine_name}</Text>
                <Text style={styles.sessionDate}>{formatDate(s.completed_at)}</Text>
              </View>
              <View style={styles.sessionBadge}>
                <Text style={styles.sessionBadgeText}>{s.ejercicios} ejercicios</Text>
              </View>
            </View>
          ))
        )}

        {/* ── Progreso ── */}
        {progress.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Último peso registrado</Text>
            {progress.map((p, i) => (
              <View key={i} style={styles.progressCard}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressName}>{p.exercise_name}</Text>
                  <Text style={styles.progressDate}>{formatDate(p.logged_at)}</Text>
                </View>
                <Text style={styles.progressWeight}>{p.weight_kg} kg</Text>
              </View>
            ))}
          </>
        )}

        {/* ── Menú ── */}
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={loadAll}>
            <Ionicons name="refresh-outline" size={20} color="#A855F7" />
            <Text style={styles.menuText}>Actualizar</Text>
            <Ionicons name="chevron-forward" size={16} color="#333" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setEditingName(displayName); setSettingsVisible(true); }}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.menuText}>Configuración</Text>
            <Ionicons name="chevron-forward" size={16} color="#333" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.signOutItem]} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#ff4444" />
            <Text style={[styles.menuText, { color: '#ff4444' }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Modal Configuración ── */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configuración</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>

            {/* ── Nombre ── */}
            <Text style={styles.sectionTitle}>Perfil</Text>
            <View style={styles.settingsCard}>
              <Text style={styles.settingsLabel}>Nombre de usuario</Text>
              <TextInput
                style={styles.settingsInput}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="Tu nombre"
                placeholderTextColor="#555"
                autoCapitalize="words"
                maxLength={40}
              />
              <TouchableOpacity
                style={[styles.actionBtn, savingName && styles.actionBtnDisabled]}
                onPress={saveDisplayName}
                disabled={savingName}
              >
                {savingName
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>Guardar nombre</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Correo ── */}
            <Text style={styles.sectionTitle}>Seguridad</Text>
            <View style={styles.settingsCard}>
              <Text style={styles.settingsLabel}>Cambiar correo electrónico</Text>
              <Text style={styles.settingsHint}>Actual: {userEmail}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#555" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.settingsInputFlex}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Nuevo correo"
                  placeholderTextColor="#555"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, savingEmail && styles.actionBtnDisabled]}
                onPress={changeEmail}
                disabled={savingEmail}
              >
                {savingEmail
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>Actualizar correo</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Contraseña ── */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsLabel}>Cambiar contraseña</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#555" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.settingsInputFlex}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#555"
                  secureTextEntry={!showNewPass}
                />
                <TouchableOpacity onPress={() => setShowNewPass(p => !p)} hitSlop={8}>
                  <Ionicons
                    name={showNewPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18} color="#555"
                  />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputRow, { marginTop: 12 }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#555" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.settingsInputFlex}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#555"
                  secureTextEntry={!showConfirmPass}
                />
                <TouchableOpacity onPress={() => setShowConfirmPass(p => !p)} hitSlop={8}>
                  <Ionicons
                    name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18} color="#555"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, savingPassword && styles.actionBtnDisabled]}
                onPress={changePassword}
                disabled={savingPassword}
              >
                {savingPassword
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>Actualizar contraseña</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Acerca de ── */}
            <Text style={styles.sectionTitle}>Acerca de</Text>
            <View style={styles.aboutCard}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutKey}>Versión</Text>
                <Text style={styles.aboutVal}>1.0.0</Text>
              </View>
              <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.aboutKey}>Desarrollado por</Text>
                <Text style={styles.aboutVal}>Equipo 1 — FIME</Text>
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },

  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#A855F7', justifyContent: 'center',
    alignItems: 'center', marginBottom: 15,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold', maxWidth: '80%' },
  emailSmall: { color: '#555', fontSize: 13, marginTop: 2, maxWidth: '80%' },
  tagContainer: { marginTop: 8 },
  tag: {
    color: '#A855F7', fontSize: 12, fontWeight: 'bold',
    backgroundColor: '#A855F722', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 10, overflow: 'hidden',
  },

  sectionTitle: {
    color: '#888', fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12, marginTop: 10,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  statCard: {
    backgroundColor: '#0A0A0A', width: '47%', padding: 16,
    borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#1A1A1A', gap: 4,
  },
  statNumber: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#555', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  sessionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A0A0A', borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1A1A1A',
  },
  sessionIcon: { backgroundColor: '#A855F711', padding: 8, borderRadius: 10, marginRight: 12 },
  sessionInfo: { flex: 1 },
  sessionName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sessionDate: { color: '#555', fontSize: 12, marginTop: 3 },
  sessionBadge: { backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sessionBadgeText: { color: '#888', fontSize: 11, fontWeight: '600' },

  progressCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0A0A0A', borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1A1A1A',
  },
  progressInfo: { flex: 1 },
  progressName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  progressDate: { color: '#555', fontSize: 11, marginTop: 3 },
  progressWeight: { color: '#A855F7', fontSize: 18, fontWeight: 'bold' },

  menu: {
    backgroundColor: '#0A0A0A', borderRadius: 15, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1A1A1A', marginTop: 15,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 17, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  menuText: { color: '#fff', marginLeft: 15, fontSize: 16 },
  signOutItem: { borderBottomWidth: 0 },

  emptyBox: {
    backgroundColor: '#0A0A0A', borderRadius: 16, padding: 30,
    alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A',
    marginBottom: 20, gap: 8,
  },
  emptyText: { color: '#555', fontSize: 15, fontWeight: '600' },
  emptySubtext: { color: '#333', fontSize: 12, textAlign: 'center' },

  // Modal
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },

  settingsCard: {
    backgroundColor: '#0A0A0A', borderRadius: 14,
    borderWidth: 1, borderColor: '#1A1A1A',
    padding: 16, marginBottom: 16,
  },
  settingsLabel: {
    color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4,
  },
  settingsHint: { color: '#555', fontSize: 12, marginBottom: 12 },
  settingsInput: {
    color: '#fff', fontSize: 16,
    borderBottomWidth: 1, borderBottomColor: '#A855F7', paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#2A2A2A', paddingBottom: 8,
  },
  settingsInputFlex: { flex: 1, color: '#fff', fontSize: 15 },

  actionBtn: {
    backgroundColor: '#A855F7', borderRadius: 12,
    padding: 13, alignItems: 'center', marginTop: 16,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  aboutCard: {
    backgroundColor: '#0A0A0A', borderRadius: 14,
    borderWidth: 1, borderColor: '#1A1A1A', overflow: 'hidden',
  },
  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  aboutKey: { color: '#fff', fontSize: 15 },
  aboutVal: { color: '#555', fontSize: 15 },
});
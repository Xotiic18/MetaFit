import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  const [loading, setLoading]     = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalVolumen: 0, diasEntrenados: 0,
    rachaActual: 0, totalSesiones: 0,
  });
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [progress, setProgress]   = useState<ExerciseProgress[]>([]);
  const router = useRouter();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUserEmail(session.user.email || '');

      // Cargar nombre del perfil
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

      const totalVolumen = logsData.reduce((acc, log) => {
        return acc + (log.sets * log.reps * log.weight_kg);
      }, 0);

      const diasUnicos = new Set(
        (sessionData || []).map(s => s.completed_at.split('T')[0])
      );

      const sortedDays = Array.from(diasUnicos).sort().reverse();
      let racha = 0;
      const hoy = new Date();
      for (let i = 0; i < sortedDays.length; i++) {
        const diaEsperado = new Date(hoy);
        diaEsperado.setDate(hoy.getDate() - i);
        const diaEsperadoStr = diaEsperado.toISOString().split('T')[0];
        if (sortedDays[i] === diaEsperadoStr) racha++;
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

    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
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

  // ✅ Fix bug volumen — siempre en kg, sin conversión a toneladas prematura
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

  // Inicial del nombre (o del email si aún no tiene perfil)
  const initials = displayName
    ? displayName.charAt(0).toUpperCase()
    : (userEmail?.charAt(0).toUpperCase() || '?');

  const nombreMostrado = displayName || userEmail;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {/* ✅ Mostrar nombre en lugar de email */}
        <Text style={styles.name} numberOfLines={1}>{nombreMostrado}</Text>
        {displayName !== '' && (
          <Text style={styles.emailSmall} numberOfLines={1}>{userEmail}</Text>
        )}
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>Atleta</Text>
        </View>
      </View>

      {/* Stats */}
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
          {/* ✅ Usar formatVolumen en lugar del ternario anterior */}
          <Text style={styles.statNumber}>{formatVolumen(stats.totalVolumen)}</Text>
          <Text style={styles.statLabel}>Volumen</Text>
        </View>
      </View>

      {/* Historial */}
      <Text style={styles.sectionTitle}>Historial de entrenamientos</Text>
      {sessions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={32} color="#333" />
          <Text style={styles.emptyText}>Sin sesiones esta semana</Text>
          <Text style={styles.emptySubtext}>Completa un entrenamiento para verlo aquí</Text>
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

      {/* Progreso por ejercicio */}
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

      {/* Menú */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={loadAll}>
          <Ionicons name="refresh-outline" size={20} color="#A855F7" />
          <Text style={styles.menuText}>Actualizar</Text>
          <Ionicons name="chevron-forward" size={16} color="#333" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
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
    backgroundColor: '#0A0A0A', width: '47%',
    padding: 16, borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A', gap: 4,
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
});
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

type GlobalStats = {
  totalUsuarios: number;
  totalRutinas: number;
  totalSesiones: number;
  totalVolumen: number;
  usuariosActivos7d: number;
  sesionesHoy: number;
};

export default function AdminStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState<GlobalStats>({
    totalUsuarios: 0, totalRutinas: 0, totalSesiones: 0,
    totalVolumen: 0, usuariosActivos7d: 0, sesionesHoy: 0,
  });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const [
        { count: totalUsuarios },
        { count: totalRutinas },
        { count: totalSesiones },
        { data: logs },
        { data: sesiones7d },
        { count: sesionesHoy },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('routines').select('*', { count: 'exact', head: true }),
        supabase.from('workout_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('workout_logs').select('sets, reps, weight_kg'),
        supabase.from('workout_sessions')
          .select('user_id')
          .gte('completed_at', hace7Dias.toISOString()),
        supabase.from('workout_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('completed_at', hoy.toISOString()),
      ]);

      const totalVolumen = (logs || []).reduce((acc, log) =>
        acc + (log.sets * log.reps * log.weight_kg), 0
      );

      const usuariosActivos7d = new Set((sesiones7d || []).map(s => s.user_id)).size;

      setStats({
        totalUsuarios:    totalUsuarios || 0,
        totalRutinas:     totalRutinas  || 0,
        totalSesiones:    totalSesiones || 0,
        totalVolumen:     Math.round(totalVolumen),
        usuariosActivos7d,
        sesionesHoy:      sesionesHoy  || 0,
      });
    } catch (error: any) {
      console.error('loadStats:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatVolumen = (kg: number) => {
    if (kg >= 1_000_000) return `${(kg / 1000).toFixed(1)}t`;
    if (kg >= 1_000)     return `${kg.toLocaleString('es-MX')} kg`;
    return `${kg} kg`;
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#A855F7" />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.title}>Estadísticas</Text>
      <Text style={styles.subtitle}>Métricas globales de MetaFit</Text>

      <Text style={styles.sectionTitle}>General</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Ionicons name="people-outline" size={24} color="#A855F7" />
          <Text style={styles.cardNumber}>{stats.totalUsuarios}</Text>
          <Text style={styles.cardLabel}>Usuarios registrados</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="barbell-outline" size={24} color="#A855F7" />
          <Text style={styles.cardNumber}>{stats.totalRutinas}</Text>
          <Text style={styles.cardLabel}>Rutinas creadas</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#A855F7" />
          <Text style={styles.cardNumber}>{stats.totalSesiones}</Text>
          <Text style={styles.cardLabel}>Sesiones completadas</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="fitness-outline" size={24} color="#A855F7" />
          <Text style={styles.cardNumber}>{formatVolumen(stats.totalVolumen)}</Text>
          <Text style={styles.cardLabel}>Volumen total levantado</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Últimos 7 días</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Ionicons name="person-outline" size={24} color="#22c55e" />
          <Text style={[styles.cardNumber, { color: '#22c55e' }]}>{stats.usuariosActivos7d}</Text>
          <Text style={styles.cardLabel}>Usuarios activos</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="today-outline" size={24} color="#22c55e" />
          <Text style={[styles.cardNumber, { color: '#22c55e' }]}>{stats.sesionesHoy}</Text>
          <Text style={styles.cardLabel}>Sesiones hoy</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000', padding: 20 },
  center:      { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title:       { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 40 },
  subtitle:    { color: '#A855F7', fontSize: 13, marginBottom: 24 },
  sectionTitle:{ color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  card:        { backgroundColor: '#0A0A0A', width: '47%', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A', gap: 6 },
  cardNumber:  { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  cardLabel:   { color: '#555', fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
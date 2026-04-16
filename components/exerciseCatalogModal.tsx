import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput, FlatList,
  TouchableOpacity, Image, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISES_DATABASE } from '../constants/exercises';

type ExerciseWithGroup = {
  id: string;
  name: string;
  gif: any;
  muscleGroup: string;
};

const ALL_EXERCISES: ExerciseWithGroup[] = Object.entries(EXERCISES_DATABASE).flatMap(
  ([group, exercises]) => exercises.map(ex => ({ ...ex, muscleGroup: group }))
);

const MUSCLE_GROUPS = ['Todos', ...Object.keys(EXERCISES_DATABASE)];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseWithGroup) => void;
}

export function ExerciseCatalogModal({ visible, onClose, onSelectExercise }: Props) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [previewExercise, setPreviewExercise] = useState<ExerciseWithGroup | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSelectedGroup('Todos');
      setPreviewExercise(null);
      setShowGroupPicker(false);
    }
  }, [visible]);

  const filteredExercises = useMemo(() => {
    return ALL_EXERCISES.filter(ex => {
      const matchesGroup = selectedGroup === 'Todos' || ex.muscleGroup === selectedGroup;
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [search, selectedGroup]);

  const handleSelect = (exercise: ExerciseWithGroup) => {
    setPreviewExercise(null);


    setTimeout(() => {
      onSelectExercise(exercise);
      onClose();
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Catálogo</Text>
            <Text style={styles.subtitle}>
              {filteredExercises.length} ejercicio{filteredExercises.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRow}>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar..."
              placeholderTextColor="#555"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <TouchableOpacity
            style={styles.groupSelector}
            onPress={() => setShowGroupPicker(true)}
          >
            <Ionicons name="filter-outline" size={16} color="#A855F7" />
            <Text style={styles.groupSelectorText} numberOfLines={1}>
              {selectedGroup}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#A855F7" />
          </TouchableOpacity>

        </View>

        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color="#333" />
              <Text style={styles.emptyText}>
                {search.length > 0
                  ? `Sin resultados para "${search}"`
                  : 'Sin ejercicios en esta categoría'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exerciseCard}
              onPress={() => setPreviewExercise(item)}
              activeOpacity={0.7}
            >
              <View style={styles.gifContainer}>
                <Image source={item.gif} style={styles.gif} resizeMode="cover" />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <View style={styles.muscleTag}>
                  <Text style={styles.muscleTagText}>{item.muscleGroup}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleSelect(item)}
                hitSlop={8}
              >
                <Ionicons name="add-circle" size={32} color="#A855F7" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />

        <Modal
          visible={showGroupPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGroupPicker(false)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowGroupPicker(false)}
          >
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHandle} />
              <Text style={styles.pickerTitle}>Grupo Muscular</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {MUSCLE_GROUPS.map(group => (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.pickerItem,
                      selectedGroup === group && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setSelectedGroup(group);
                      setShowGroupPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedGroup === group && styles.pickerItemTextActive,
                    ]}>
                      {group}
                    </Text>
                    {selectedGroup === group && (
                      <Ionicons name="checkmark" size={18} color="#A855F7" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {previewExercise && (
          <Modal
            visible={!!previewExercise}
            transparent
            animationType="fade"
            onRequestClose={() => setPreviewExercise(null)}
          >
            <TouchableOpacity
              style={styles.previewOverlay}
              activeOpacity={1}
              onPress={() => setPreviewExercise(null)}
            >
              <View style={styles.previewCard}>
                <Image
                  source={previewExercise.gif}
                  style={styles.previewGif}
                  resizeMode="contain"
                />
                <Text style={styles.previewName}>{previewExercise.name}</Text>
                <View style={styles.muscleTag}>
                  <Text style={styles.muscleTagText}>{previewExercise.muscleGroup}</Text>
                </View>
                <TouchableOpacity
                  style={styles.previewAddBtn}
                  onPress={() => handleSelect(previewExercise)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.previewAddText}>Agregar a la rutina</Text>
                </TouchableOpacity>
                <Text style={styles.previewHint}>Toca fuera para cerrar</Text>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 20, paddingBottom: 15,
  },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#A855F7', fontSize: 13, marginTop: 2 },
  closeBtn: {
    backgroundColor: '#1A1A1A', width: 36, height: 36,
    borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },

  // Fila de controles
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    height: 46,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  // Selector de grupo
  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#A855F755',
    height: 46,
    gap: 6,
    maxWidth: 130,
  },
  groupSelectorText: {
    color: '#A855F7',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Lista
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },

  exerciseCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A0A0A', borderRadius: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  gifContainer: { width: 72, height: 72, backgroundColor: '#111' },
  gif: { width: '100%', height: '100%' },
  exerciseInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  exerciseName: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  muscleTag: {
    backgroundColor: '#A855F711', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#A855F733',
  },
  muscleTagText: { color: '#A855F7', fontSize: 11, fontWeight: '700' },
  addBtn: { paddingHorizontal: 14 },

  // Picker bottom sheet
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: '#222',
    maxHeight: '60%',
  },
  pickerHandle: {
    width: 40, height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    color: '#888', fontSize: 12,
    fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: 20,
    marginBottom: 8,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  pickerItemActive: { backgroundColor: '#A855F711' },
  pickerItemText: { color: '#ccc', fontSize: 16 },
  pickerItemTextActive: { color: '#A855F7', fontWeight: '700' },

  // Preview
  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center', alignItems: 'center', padding: 30,
  },
  previewCard: {
    backgroundColor: '#111', borderRadius: 24, padding: 24,
    alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: '#222',
  },
  previewGif: { width: 240, height: 240, borderRadius: 16, marginBottom: 18 },
  previewName: {
    color: '#fff', fontSize: 18, fontWeight: 'bold',
    textAlign: 'center', marginBottom: 10,
  },
  previewAddBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#A855F7', paddingHorizontal: 24,
    paddingVertical: 13, borderRadius: 14, marginTop: 20, gap: 8,
  },
  previewAddText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  previewHint: { color: '#444', fontSize: 12, marginTop: 14 },

  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#444', fontSize: 15, textAlign: 'center' },
});
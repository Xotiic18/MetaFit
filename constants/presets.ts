export const PRESET_ROUTINES = [
  {
    id: 'preset-3-days',
    name: 'Principiante: 3 días (Full Body)',
    days: [
      { 
        name: 'Día 1: Fuerza General', 
        exercises: [
          { id: 'p1', name: 'Press de Banca Plano', muscle: 'Pecho', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'l1', name: 'Sentadilla Libre', muscle: 'Piernas', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      // los otros dias
    ]
  },
  {
    id: 'preset-4-days',
    name: 'Intermedio: 4 días (Torso/Pierna)',
    // ... estructura similar
  }
];
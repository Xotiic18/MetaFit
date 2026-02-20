//Ejercicios de las plantillas

export const PRESET_ROUTINES = [
  {
    id: 'p3',
    name: 'Full Body',
    days: [
      {
        dayName: 'Día A (Enfoque Empuje)',
        exercises: [
          { id: 'l1', name: 'Sentadilla Libre', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'p1', name: 'Press de Banca Plano', muscle: 'Pecho', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '60' }] },
          { id: 'e3', name: 'Jalón al Pecho', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'h2', name: 'Elevaciones Laterales', muscle: 'Hombros', gif: '...', sets: [{ id: 's1', reps: '15', weight: '0', rest: '45' }] }
        ]
      },
      {
        dayName: 'Día B (Enfoque Tracción)',
        exercises: [
          { id: 'l3', name: 'Peso Muerto Rumano', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'e2', name: 'Remo con Barra', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '60' }] },
          { id: 'p2', name: 'Press Inclinado', muscle: 'Pecho', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'b1', name: 'Curl con Barra', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      {
        dayName: 'Día C (Enfoque Tracción)',
        exercises: [
          { id: 'l3', name: 'Peso Muerto Rumano', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'e2', name: 'Remo con Barra', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '60' }] },
          { id: 'p2', name: 'Press Inclinado', muscle: 'Pecho', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'b1', name: 'Curl con Barra', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      }
    ]
  },
  {
    id: 'p4',
    name: 'Torso/Pierna',
    days: [
      {
        dayName: 'Torso 1',
        exercises: [
          { id: 'p1', name: 'Press de Banca Plano', muscle: 'Pecho', gif: '...', sets: [{ id: 's1', reps: '8', weight: '0', rest: '90' }] },
          { id: 'e2', name: 'Remo con Barra', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '8', weight: '0', rest: '90' }] },
          { id: 'h1', name: 'Press Militar', muscle: 'Hombros', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '60' }] },
          { id: 'b3', name: 'Extensión en Polea', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '45' }] }
        ]
      },
      {
        dayName: 'Pierna 1',
        exercises: [
          { id: 'l1', name: 'Sentadilla Libre', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '8', weight: '0', rest: '120' }] },
          { id: 'l3', name: 'Peso Muerto Rumano', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'l4', name: 'Extensión de Cuádriceps', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'l7', name: 'Elevación de Talones', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '15', weight: '0', rest: '45' }] }
        ]
      },
      {
        dayName: 'Torso 2',
        exercises: [
          { id: 'l1', name: 'Sentadilla Libre', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '8', weight: '0', rest: '120' }] },
          { id: 'l3', name: 'Peso Muerto Rumano', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'l4', name: 'Extensión de Cuádriceps', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'l7', name: 'Elevación de Talones', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '15', weight: '0', rest: '45' }] }
        ]
      },
      {
        dayName: 'Pierna 2',
        exercises: [
          { id: 'l1', name: 'Sentadilla Libre', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '8', weight: '0', rest: '120' }] },
          { id: 'l3', name: 'Peso Muerto Rumano', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'l4', name: 'Extensión de Cuádriceps', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'l7', name: 'Elevación de Talones', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '15', weight: '0', rest: '45' }] }
        ]
      },
    ]
  },
  {
    id: 'p5',
    name: 'Push/Pull/Legs',
    days: [
      {
        dayName: 'Push (Empuje)',
        exercises: [
          { id: 'p1', name: 'Press de Banca', muscle: 'Pecho', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'h2', name: 'Elevaciones Laterales', muscle: 'Hombros', gif: '...', sets: [{ id: 's1', reps: '15', weight: '0', rest: '60' }] },
          { id: 'b4', name: 'Press Francés', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      {
        dayName: 'Pull (Tracción)',
        exercises: [
          { id: 'e1', name: 'Dominadas', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'e4', name: 'Remo en Polea Baja', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'b1', name: 'Curl con Barra', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      {
        dayName: 'Legs (Pierna)',
        exercises: [
          { id: 'l1', name: 'Sentadilla', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '120' }] },
          { id: 'l5', name: 'Curl Femoral', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
            {
        dayName: 'Push (Empuje)',
        exercises: [
          { id: 'p1', name: 'Press de Banca', muscle: 'Pecho', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'h2', name: 'Elevaciones Laterales', muscle: 'Hombros', gif: '...', sets: [{ id: 's1', reps: '15', weight: '0', rest: '60' }] },
          { id: 'b4', name: 'Press Francés', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      {
        dayName: 'Pull (Tracción)',
        exercises: [
          { id: 'e1', name: 'Dominadas', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'e4', name: 'Remo en Polea Baja', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'b1', name: 'Curl con Barra', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
    ]
  },
  {
    id: 'p6',
    name: 'P/P/L Avanzado',
    days: [
      {
        dayName: 'Push (Empuje)',
        exercises: [
          { id: 'p1', name: 'Press de Banca', muscle: 'Pecho', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'h2', name: 'Elevaciones Laterales', muscle: 'Hombros', gif: '...', sets: [{ id: 's1', reps: '15', weight: '0', rest: '60' }] },
          { id: 'b4', name: 'Press Francés', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      {
        dayName: 'Pull (Tracción)',
        exercises: [
          { id: 'e1', name: 'Dominadas', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'e4', name: 'Remo en Polea Baja', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'b1', name: 'Curl con Barra', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      {
        dayName: 'Legs (Pierna)',
        exercises: [
          { id: 'l1', name: 'Sentadilla', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '120' }] },
          { id: 'l5', name: 'Curl Femoral', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
            {
        dayName: 'Push (Empuje)',
        exercises: [
          { id: 'p1', name: 'Press de Banca', muscle: 'Pecho', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'h2', name: 'Elevaciones Laterales', muscle: 'Hombros', gif: '...', sets: [{ id: 's1', reps: '15', weight: '0', rest: '60' }] },
          { id: 'b4', name: 'Press Francés', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      {
        dayName: 'Pull (Tracción)',
        exercises: [
          { id: 'e1', name: 'Dominadas', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '90' }] },
          { id: 'e4', name: 'Remo en Polea Baja', muscle: 'Espalda', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] },
          { id: 'b1', name: 'Curl con Barra', muscle: 'Brazos', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      },
      {
        dayName: 'Legs (Pierna)',
        exercises: [
          { id: 'l1', name: 'Sentadilla', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '10', weight: '0', rest: '120' }] },
          { id: 'l5', name: 'Curl Femoral', muscle: 'Piernas', gif: '...', sets: [{ id: 's1', reps: '12', weight: '0', rest: '60' }] }
        ]
      }
    ]
  }
];
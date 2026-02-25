//Base de datos local del catalogo de ejercicios

export const EXERCISES_DATABASE = {
  Pecho: [
    { id: 'p1', name: 'Press de Banca Plano (Barra)', gif: require('../assets/gifs/press-banca.gif') },
    { id: 'p2', name: 'Press Inclinado (Mancuernas)', gif: require('../assets/gifs/press-inclinado.gif') },
    { id: 'p3', name: 'Aperturas en Peck Deck', gif: require('../assets/gifs/aperturas.gif') },
    { id: 'p4', name: 'Fondos en Paralelas (Dips)', gif: require('../assets/gifs/fondos-paralelas.gif') },
    { id: 'p5', name: 'Cruce de Poleas Altas', gif: require('../assets/gifs/cruce-poleas-alta.gif') },
  ],
  Espalda: [
    { id: 'e1', name: 'Dominadas (Pull-ups)', gif: require('../assets/gifs/dominadas.gif') },
    { id: 'e2', name: 'Remo con Barra', gif: require('../assets/gifs/remo-con-barra.gif') },
    { id: 'e3', name: 'Jalón al Pecho', gif: require('../assets/gifs/jalon-al-pecho.gif') },
    { id: 'e4', name: 'Remo Horizontal', gif: require('../assets/gifs/remo-horizontal.gif') },
    { id: 'e5', name: 'Pull-over con Polea Alta', gif: require('../assets/gifs/pullover-polea-alta.gif') },
    { id: 'e6', name: 'Hiperextensiones', gif: require('../assets/gifs/hiperextensiones.gif') },
  ],
  Piernas: [
    { id: 'l1', name: 'Sentadilla Libre', gif: require('../assets/gifs/sentadilla-libre.gif') },
    { id: 'l2', name: 'Prensa de Piernas 45°', gif: require('../assets/gifs/prensa.gif') },
    { id: 'l3', name: 'Peso Muerto Rumano', gif: require('../assets/gifs/peso-muerto-rumano.gif') },
    { id: 'l4', name: 'Extensión de Cuádriceps', gif: require('../assets/gifs/extensiones-cuadriceps.gif') },
    { id: 'l5', name: 'Curl Femoral Tumbado', gif: require('../assets/gifs/curl-femoral-tumbado.gif') },
    { id: 'l6', name: 'Zancadas (Lunges)', gif: require('../assets/gifs/zancadas.gif') },
    { id: 'l7', name: 'Elevación de Talones (Gemelos)', gif: require('../assets/gifs/elevacion-talones.gif') },
  ],
  Hombros: [
    { id: 'h1', name: 'Press Militar (Barra)', gif: require('../assets/gifs/press-militar-barra.gif') },
    { id: 'h2', name: 'Elevaciones Laterales', gif: require('../assets/gifs/laterales-mancuernas.gif') },
    { id: 'h3', name: 'Pájaros (Deltoide Posterior)', gif: require('../assets/gifs/deltoides-posterior-maquina.gif') },
    { id: 'h4', name: 'Press Arnold', gif: require('../assets/gifs/press-arnold.gif') },
    { id: 'h5', name: 'Facepulls', gif: require('../assets/gifs/facepull.gif') },
  ],
  Brazos: [
    { id: 'b1', name: 'Curl con Barra (Bíceps)', gif: require('../assets/gifs/curl-bicep-barra.gif') },
    { id: 'b2', name: 'Martillo (Mancuerna)', gif: require('../assets/gifs/curl-martillo.gif') },
    { id: 'b3', name: 'Extensión en Polea (Tríceps)', gif: require('../assets/gifs/extension-triceps.gif') },
    { id: 'b4', name: 'Press Francés', gif: require('../assets/gifs/press-frances.gif') },
    { id: 'b5', name: 'Curl Predicador', gif: require('../assets/gifs/curl-predicador.gif') },
    { id: 'b6', name: 'Dippings entre bancos', gif: require('../assets/gifs/fondos-entre-bancos.gif') },
  ],
};
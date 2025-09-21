// Phoneme service for lip syncing and viseme generation - Function-based

// Phoneme to Viseme mapping based on Microsoft Speech Platform
const PHONEME_TO_VISEME = {
  // Silence
  sil: "0",
  sp: "0",

  // Vowels
  aa: "2",
  ae: "2",
  ah: "2",
  ao: "3",
  aw: "2",
  ay: "2",
  eh: "4",
  er: "5",
  ey: "4",
  ih: "4",
  iy: "4",
  ow: "8",
  oy: "8",
  uh: "4",
  uw: "7",

  // Consonants
  b: "21",
  ch: "16",
  d: "19",
  dh: "17",
  f: "18",
  g: "20",
  hh: "12",
  jh: "16",
  k: "20",
  l: "14",
  m: "21",
  n: "19",
  ng: "20",
  p: "21",
  r: "13",
  s: "15",
  sh: "16",
  t: "19",
  th: "17",
  v: "18",
  w: "7",
  y: "6",
  z: "15",
  zh: "16",
};

// Viseme to mouth shape description
const VISEME_MOUTH_SHAPES = {
  0: "Neutral/Silence",
  1: "Closed",
  2: "Open",
  3: "Rounded",
  4: "Slightly Open",
  5: "Medium Open",
  6: "Narrow",
  7: "Rounded Small",
  8: "Rounded Medium",
  12: "Aspirated",
  13: "R Sound",
  14: "L Sound",
  15: "S Sound",
  16: "SH/CH Sound",
  17: "TH Sound",
  18: "F/V Sound",
  19: "T/D/N Sound",
  20: "K/G Sound",
  21: "P/B/M Sound",
};

// Simple phoneme estimation based on English pronunciation rules
const textToPhonemes = (text) => {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/);
  const phonemes = [];

  for (const word of words) {
    if (!word) continue;

    // Add silence between words
    if (phonemes.length > 0) {
      phonemes.push("sp");
    }

    // Simple phoneme mapping (basic implementation)
    const wordPhonemes = wordToPhonemes(word);
    phonemes.push(...wordPhonemes);
  }

  return phonemes;
};

const wordToPhonemes = (word) => {
  // Basic phoneme mapping for common English patterns
  const phonemeMap = {
    hello: ["hh", "eh", "l", "ow"],
    world: ["w", "er", "l", "d"],
    the: ["dh", "ah"],
    and: ["ae", "n", "d"],
    you: ["y", "uw"],
    are: ["aa", "r"],
    this: ["dh", "ih", "s"],
    that: ["dh", "ae", "t"],
    with: ["w", "ih", "th"],
    have: ["hh", "ae", "v"],
    will: ["w", "ih", "l"],
    can: ["k", "ae", "n"],
    said: ["s", "eh", "d"],
    what: ["w", "ah", "t"],
    when: ["w", "eh", "n"],
    where: ["w", "eh", "r"],
    how: ["hh", "aw"],
    good: ["g", "uh", "d"],
    great: ["g", "r", "ey", "t"],
    time: ["t", "ay", "m"],
    voice: ["v", "oy", "s"],
    speech: ["s", "p", "iy", "ch"],
    text: ["t", "eh", "k", "s", "t"],
    sound: ["s", "aw", "n", "d"],
  };

  if (phonemeMap[word]) {
    return phonemeMap[word];
  }

  // Fallback: basic letter-to-sound mapping
  return basicLetterToPhoneme(word);
};

const basicLetterToPhoneme = (word) => {
  const phonemes = [];
  const letters = word.split("");

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const nextLetter = letters[i + 1];

    // Handle common digraphs
    if (letter === "t" && nextLetter === "h") {
      phonemes.push("th");
      i++; // Skip next letter
    } else if (letter === "s" && nextLetter === "h") {
      phonemes.push("sh");
      i++;
    } else if (letter === "c" && nextLetter === "h") {
      phonemes.push("ch");
      i++;
    } else {
      // Basic single letter mapping
      const phoneme = letterToPhoneme(letter);
      if (phoneme) phonemes.push(phoneme);
    }
  }

  return phonemes;
};

const letterToPhoneme = (letter) => {
  const mapping = {
    a: "ae",
    e: "eh",
    i: "ih",
    o: "ao",
    u: "uh",
    b: "b",
    c: "k",
    d: "d",
    f: "f",
    g: "g",
    h: "hh",
    j: "jh",
    k: "k",
    l: "l",
    m: "m",
    n: "n",
    p: "p",
    r: "r",
    s: "s",
    t: "t",
    v: "v",
    w: "w",
    y: "y",
    z: "z",
  };

  return mapping[letter] || null;
};

// Generate phoneme data with timing
export const generatePhonemeData = (text, speechRate = 1.0) => {
  const phonemes = textToPhonemes(text);
  const phonemeData = [];

  // Base duration per phoneme (in seconds)
  const baseDuration = 0.1 / speechRate;
  let currentTime = 0;

  for (const phoneme of phonemes) {
    // Adjust duration based on phoneme type
    let duration = baseDuration;

    // Vowels are typically longer
    if (
      [
        "aa",
        "ae",
        "ah",
        "ao",
        "aw",
        "ay",
        "eh",
        "er",
        "ey",
        "ih",
        "iy",
        "ow",
        "oy",
        "uh",
        "uw",
      ].includes(phoneme)
    ) {
      duration *= 1.5;
    }

    // Silence is shorter
    if (phoneme === "sp" || phoneme === "sil") {
      duration *= 0.5;
    }

    const viseme = PHONEME_TO_VISEME[phoneme] || "0";

    phonemeData.push({
      phoneme,
      viseme,
      startTime: currentTime,
      endTime: currentTime + duration,
      duration,
    });

    currentTime += duration;
  }

  return phonemeData;
};

// Generate viseme data for lip syncing
export const generateVisemeData = (phonemeData) => {
  const visemeData = [];

  for (const phoneme of phonemeData) {
    visemeData.push({
      viseme: phoneme.viseme,
      startTime: phoneme.startTime,
      endTime: phoneme.endTime,
      mouthShape: VISEME_MOUTH_SHAPES[phoneme.viseme] || "Neutral",
    });
  }

  return visemeData;
};

// Export phoneme data as JSON for external use
export const exportPhonemeData = (text, speechRate = 1.0) => {
  const phonemeData = generatePhonemeData(text, speechRate);
  const visemeData = generateVisemeData(phonemeData);

  return JSON.stringify(
    {
      text,
      speechRate,
      phonemes: phonemeData,
      visemes: visemeData,
      totalDuration: phonemeData[phonemeData.length - 1]?.endTime || 0,
    },
    null,
    2
  );
};

// Get mouth shape at specific time
export const getMouthShapeAtTime = (visemeData, time) => {
  const currentViseme = visemeData.find(
    (v) => time >= v.startTime && time <= v.endTime
  );
  return currentViseme?.mouthShape || "Neutral";
};

// Legacy object-style exports for backward compatibility
export const phonemeService = {
  generatePhonemeData,
  generateVisemeData,
  exportPhonemeData,
  getMouthShapeAtTime,
};

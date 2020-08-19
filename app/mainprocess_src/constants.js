// https://www.midi.org/specifications/item/table-1-summary-of-midi-message
export const MidiConstants = {
  NOTE_ON: 144,
  NOTE_OFF: 128,
};

/**
 * This roughly follows scientific pitch notation except that I didn't want to
 * use sharp and flat symbols, so the black keys are represented with an "S",
 * e.g. "GS2" is G#2.
 *
 * The values are the MIDI key numbers.
 * @see https://en.wikipedia.org/wiki/Scientific_pitch_notation
 */
export const PianoKeyConstants = {
  C2: 36,
  CS2: 37,
  D2: 38,
  DS2: 39,
  E2: 40,
  F2: 41,
  FS2: 42,
  G2: 43,
  GS2: 44,
  A2: 45,
  AS2: 46,
  B2: 47,

  C3: 48,
  CS3: 49,
  D3: 50,
  DS3: 51,
  E3: 52,
  F3: 53,
  FS3: 54,
  G3: 55,
  GS3: 56,
  A3: 57,
  AS3: 58,
  B3: 59,

  C4: 60,
  CS4: 61,
  D4: 62,
  DS4: 63,
  E4: 64,
  F4: 65,
  FS4: 66,
  G4: 67,
  GS4: 68,
  A4: 69,
  AS4: 70,
  B4: 71,

  C5: 72,
  CS5: 73,
  D5: 74,
  DS5: 75,
  E5: 76,
  F5: 77,
  FS5: 78,
  G5: 79,
  GS5: 80,
  A5: 81,
  AS5: 82,
  B5: 83,
};

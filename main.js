import MidiWrapper from './midiwrapper.js';
import KeyRecognizer from './keyrecognizer.js';

const keyRecognizer = new KeyRecognizer();
const midiWrapper = new MidiWrapper(keyRecognizer);

// https://stackoverflow.com/a/14032965/3595355
function onExit() {
  midiWrapper.dispose();
}

// Do something when app is closing
process.on('exit', () => onExit());

// Catches ctrl+c event
process.on('SIGINT', () => onExit());

// Catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', () => onExit());
process.on('SIGUSR2', () => onExit());

// Catches uncaught exceptions
process.on('uncaughtException', () => onExit());

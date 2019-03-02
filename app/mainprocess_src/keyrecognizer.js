import { MidiConstants } from './constants';
import KeyData from './keydata';
import _ from 'lodash';
import robot from 'robotjs';

const Modes = {
  LETTERS: 'LETTERS',
  COMMANDS: 'COMMANDS',
  NUMBERS: 'NUMBERS',
};

class KeyRecognizer {
  constructor() {
    this.debounceTime = 50;
    /**
     * Keys: the "data1" property
     * Values: KeyData objects
     * @type {Object<number, KeyData>}
     */
    this.keys = {};

    this.velocityThreshold = 90;

    /**
     * When true, we are only in Numbers Mode for a single keypress. After that
     * keypress, we enter Letters Mode regardless of where we came from.
     */
    this.temporarilyInNumbersMode = false;

    this.mode = Modes.LETTERS;

    // We have to debounce this because we don't want a third to be interpreted
    // as an interval handler if one millisecond later we're going to get a full
    // chord.
    this.debouncedHandleKeyPress = _.debounce(
      this.handleKeyPress.bind(this),
      this.debounceTime
    );

    this.handlers = {
      [Modes.LETTERS]: this.handleLetterInput,
      [Modes.COMMANDS]: this.handleCommandInput,
      [Modes.NUMBERS]: this.handleNumberInput,
    };
  }

  handleNumberInput = (data1, data2) => {
    const exceededVelocityThreshold = data2 > this.velocityThreshold;
    const shiftIfExceededVelocity = exceededVelocityThreshold ? "shift":"none";
    let handled = false;

    if (data1 === 43) {
      robot.keyTap('1', shiftIfExceededVelocity);
      handled = true;
    }

    // ;:
    if (data1 === 44) {
      exceededVelocityThreshold ? robot.keyTap(';', 'shift') : robot.keyTap(';');
      handled = true;
    }
    if (data1 === 45) {
      robot.keyTap('2', shiftIfExceededVelocity);
      handled = true;
    }
    if (data1 === 47) {
      robot.keyTap('3', shiftIfExceededVelocity);
      handled = true;
    }
    if (data1 === 48) {
      robot.keyTap('4', shiftIfExceededVelocity);
      handled = true;
    }
    if (data1 === 50) {
      robot.keyTap('5', shiftIfExceededVelocity);
      handled = true;
    }
    if (data1 === 51) {
      exceededVelocityThreshold ? robot.keyTap('\\') : robot.keyTap('/');
      handled = true;
    }

    if (data1 === 60) {
      robot.keyTap('6', shiftIfExceededVelocity);
      handled = true;
    }
    if (data1 === 62) {
      robot.keyTap('7', shiftIfExceededVelocity);
      handled = true;
    }

    // |
    if (data1 === 63) {
      robot.keyTap('\\', 'shift');
      handled = true;
    }
    if (data1 === 64) {
      robot.keyTap('8', shiftIfExceededVelocity);
      handled = true;
    }
    if (data1 === 65) {
      robot.keyTap('9', shiftIfExceededVelocity);
      handled = true;
    }

    // { }
    if (data1 === 66) {
      exceededVelocityThreshold ? robot.keyTap(']', 'shift') : robot.keyTap('[', 'shift');
      handled = true;
    }
    if (data1 === 67) {
      robot.keyTap('0', shiftIfExceededVelocity);
      handled = true;
    }
    if (data1 === 68) {
      exceededVelocityThreshold ? robot.keyTap(']') : robot.keyTap('[');
      handled = true;
    }
    if (data1 === 69) {
      robot.keyTap('-', shiftIfExceededVelocity);
      handled = true;
    }

    // < >
    if (data1 === 70) {
      exceededVelocityThreshold ? robot.keyTap('.', 'shift') : robot.keyTap(',', 'shift');
      handled = true;
    }
    if (data1 === 71) {
      robot.keyTap('=', shiftIfExceededVelocity);
      handled = true;
    }

    if (handled && this.temporarilyInNumbersMode) {
      this.temporarilyInNumbersMode = false;
      this.setMode(Modes.LETTERS);
    }

    return handled;
  };

  handleCommandInput = (data1, data2) => {
    const exceededVelocityThreshold = data2 > this.velocityThreshold;

    if (data1 === 43) {
      robot.keyTap('down');
      return true;
    }

    if (data1 === 44) {
      robot.keyTap('up');
      return true;
    }

    if (data1 === 48) {
      if (exceededVelocityThreshold) {
        robot.keyTap('backspace', ['control', 'shift']);
      } else {
        robot.keyTap('home');
      }
      return true;
    }

    if (data1 === 49) {
      if (exceededVelocityThreshold) {
        robot.keyTap('backspace', 'control');
      } else {
        robot.keyTap('left', 'control');
      }
      return true;
    }

    if (data1 === 50) {
      if (exceededVelocityThreshold) {
        robot.keyTap('backspace');
      } else {
        robot.keyTap('left');
      }
      return true;
    }

    if (data1 === 60) {
      if (exceededVelocityThreshold) {
        robot.keyTap('delete');
      } else {
        robot.keyTap('right');
      }
      return true;
    }

    if (data1 === 61) {
      if (exceededVelocityThreshold) {
        robot.keyTap('delete', 'control');
      } else {
        robot.keyTap('right', 'control');
      }
      return true;
    }

    if (data1 === 62) {
      if (exceededVelocityThreshold) {
        robot.keyTap('delete', ['control', 'shift']);
      } else {
        robot.keyTap('end');
      }
      return true;
    }

    if (data1 === 64) {
      robot.keyTap('z', 'control');
      return true;
    }

    if (data1 === 65) {
      robot.keyTap('y', 'control');
      return true;
    }

    return false;
  };

  handleLetterInput = (data1, data2) => {
    if (data1 === 42) {
      robot.keyTap('space');
      return true;
    }

    if (data1 === 43) {
      this.typeLetter('L', data2);
      return true;
    }

    if (data1 === 44) {
      this.typeLetter('P', data2);
      return true;
    }

    if (data1 === 45) {
      this.typeLetter('R', data2);
      return true;
    }

    if (data1 === 46) {
      this.typeLetter('M', data2);
      return true;
    }

    if (data1 === 47) {
      this.typeLetter('N', data2);
      return true;
    }

    if (data1 === 48) {
      this.typeLetter('O', data2);
      return true;
    }

    if (data1 === 49) {
      this.typeLetter('C', data2);
      return true;
    }

    if (data1 === 50) {
      this.typeLetter('T', data2);
      return true;
    }

    if (data1 === 51) {
      this.typeLetter('W', data2);
      return true;
    }

    if (data1 === 52) {
      this.typeLetter('B', data2);
      return true;
    }

    if (data1 === 53) {
      this.typeLetter('K', data2);
      return true;
    }

    if (data1 === 54) {
      this.typeLetter('J', data2);
      return true;
    }

    if (data1 === 55) {
      this.typeLetter('Q', data2);
      return true;
    }

    if (data1 === 56) {
      this.typeLetter('X', data2);
      return true;
    }

    if (data1 === 57) {
      this.typeLetter('Z', data2);
      return true;
    }

    if (data1 === 58) {
      this.typeLetter('Y', data2);
      return true;
    }

    if (data1 === 59) {
      this.typeLetter('G', data2);
      return true;
    }

    if (data1 === 60) {
      this.typeLetter('E', data2);
      return true;
    }

    if (data1 === 61) {
      this.typeLetter('D', data2);
      return true;
    }

    if (data1 === 62) {
      this.typeLetter('A', data2);
      return true;
    }

    if (data1 === 63) {
      this.typeLetter('U', data2);
      return true;
    }

    if (data1 === 64) {
      this.typeLetter('I', data2);
      return true;
    }

    if (data1 === 65) {
      this.typeLetter('S', data2);
      return true;
    }

    if (data1 === 66) {
      this.typeLetter('F', data2);
      return true;
    }

    if (data1 === 67) {
      this.typeLetter('H', data2);
      return true;
    }

    if (data1 === 68) {
      this.typeLetter('V', data2);
      return true;
    }

    return false;
  };

  printAllKeysPressed() {
    if (_.isEmpty(this.keys)) {
      console.log('(you have no keys pressed right now)');
    } else {
      console.log('All keys pressed:');
      const sortedKeys = _.orderBy(this.keys, 'timePressed');
      for (const data1 in sortedKeys) {
        console.log(`\t${data1}: ${sortedKeys[data1]}`);
      }
    }
  }

  /**
   * This function will return all of the keys pressed within the last X
   * milliseconds as they should all be considered part of the same
   * chord/interval.
   * @return {Array<KeyData>}
   */
  getChordKeys(newestKeyData) {
    const curTime = Date.now();

    // Because we're debouncing the handler for this, our latest key press may
    // be up to debounce_time in the past.
    const NUM_MS_FOR_CHORD = 25;

    const debounceAccommodationTime = curTime - newestKeyData.timePressed;

    return _.filter(
      this.keys,
      (keyData) =>
        keyData.timePressed >=
        curTime - NUM_MS_FOR_CHORD - debounceAccommodationTime
    );
  }

  getSecondMostRecentKeyHeld() {
    // The head of the array will be the oldest key
    const sortedKeys = _.orderBy(this.keys, 'timePressed');

    const numKeys = _.size(sortedKeys);
    if (numKeys < 2) {
      return null;
    }

    return sortedKeys[numKeys - 2];
  }

  handleTriadQuality(chordKeys) {
    // Check for major triads
    if (_.size(chordKeys) !== 3) {
      return false;
    }

    // 1. Sort from order of note (low to high)
    // 2. Get the two intervals (bass --> second, bass --> third)
    // 3. Check if the intervals correspond to a major triad

    const sortedAscending = _.orderBy(chordKeys, 'data1');
    const interval1 = sortedAscending[0].getIntervalTo(sortedAscending[1]);
    const interval2 = sortedAscending[0].getIntervalTo(sortedAscending[2]);

    const isMajor =
      (interval1 === 4 && interval2 === 7) ||
      (interval1 === 3 && interval2 === 8) ||
      (interval1 === 5 && interval2 === 9);
    if (isMajor) {
      console.log('MAJOR CHORD PRESSED');
      this.setMode(Modes.LETTERS);
      return true;
    }

    const isMinor =
      (interval1 === 3 && interval2 === 7) ||
      (interval1 === 4 && interval2 === 9) ||
      (interval1 === 5 && interval2 === 8);
    if (isMinor) {
      console.log('MINOR CHORD PRESSED');
      this.setMode(Modes.COMMANDS);
      return true;
    }

    const isAugmented = interval1 === 4 && interval2 === 8;
    if (isAugmented) {
      console.log('AUGMENTED CHORD PRESSED');
      this.setMode(Modes.NUMBERS);
      return true;
    }

    return false;
  }

  setMode(mode) {
    this.mode = mode;
  }

  handleInterval(chordKeys) {
    if (_.size(chordKeys) !== 2) {
      return false;
    }

    const exceededVelocityThreshold = chordKeys[0].data2 > this.velocityThreshold || chordKeys[1].data2 > this.velocityThreshold;

    const interval = chordKeys[0].getIntervalTo(chordKeys[1]);

    // An interval of 24 is two whole octaves, which is where the pinkies naturally rest.
    if (interval === 1 || interval === 2 || interval === 24) {
      // this.typeLetter(' ');
      robot.keyTap('space');
      // console.log('SPACE PRESSED');
      return true;
    }

    if (interval === 3 || interval === 4) {
      console.log(' ENTER PRESSED');
      robot.keyTap('enter');
      return true;
    }

    if (interval === 5) {
      console.log(' COMMA PRESSED');
      // robot.keyTap(',');
      robot.typeString(', ');
      return true;
    }

    if (interval === 6) {
      console.log(' BACKSPACE PRESSED');
      robot.keyTap('backspace');
      return true;
    }

    if (interval === 7) {
      console.log(' PERIOD PRESSED');
      robot.typeString('. ');
      // robot.keyTap('.');
      return true;
    }

    if (interval === 8) {
      console.log(' - PRESSED');
      robot.keyTap('-');
      return true;
    }

    if (interval === 9) {
      console.log(' APOSTROPHE PRESSED');
      robot.keyTap("'", exceededVelocityThreshold ? 'shift' : 'none');
      return true;
    }

    if (interval === 10) {
      console.log(' ? PRESSED');
      robot.keyTap('/', 'shift');
      robot.typeString(' ');
      return true;
    }

    if (interval === 11) {
      console.log(' ! PRESSED');
      robot.keyTap('1', 'shift');
      robot.typeString(' ');

      return true;
    }

    // An interval of 14 is a major 9th, which is where both pointer fingers naturally rest.
    if (interval === 14) {
      this.temporarilyInNumbersMode = true;
      this.setMode(Modes.NUMBERS);
      console.log('In Numbers Mode temporarily');
      return true;
    }

    if (interval === 12) {
      console.log(' ctrl+bckspc');
      robot.keyTap('backspace', 'control');
      return true;
    }

    return false;
  }

  handleChord(chordKeys) {
    if (this.handleTriadQuality(chordKeys)) {
      return true;
    }

    if (this.handleInterval(chordKeys)) {
      return true;
    }

    return false;
  }

  typeLetter(letter, velocity = 0) {
    if (velocity > this.velocityThreshold) {
      letter = letter.toUpperCase();
    } else {
      letter = letter.toLowerCase();
    }

    robot.typeString(letter);

    process.stdout.write(letter);
  }

  handleNonChord(chordKeys) {
    if (_.size(chordKeys) !== 1) {
      return false;
    }

    const data1 = chordKeys[0].data1;
    const data2 = chordKeys[0].data2;

    return this.handlers[this.mode](data1, data2);
  }

  handleKeyPress(newestKeyData) {
    // Figure out how much time passed between the last key that was held and
    // this one so that we can figure out if it should be part of the chord.

    const chordKeys = this.getChordKeys(newestKeyData);

    // this.printAllKeysPressed();
    // console.log('chordKeys: ' + JSON.stringify(chordKeys, null, 2));

    // TODO: check for chords / intervals / keys and run their handlers
    // accordingly based on the mode we're in
    if (this.handleChord(chordKeys)) {
      return;
    }

    // If we didn't find a chord handler, then interpret all of the keys we
    // collected as individual keys.
    const unhandled = [];
    if (_.size(chordKeys) > 1) {
      console.log('Interpreting multiple chord keys as single keys chordKeys: ' + JSON.stringify(chordKeys, null, 2));
    }

    // Play them back from oldest to newest
    const sortedKeys = _.orderBy(chordKeys, 'timePressed');
    _.forEach(sortedKeys, (chordKey) => {
      const handled = this.handleNonChord([chordKey]);
      if (!handled) {
        unhandled.push(chordKey);
      }
    })
    // if (this.handleNonChord(chordKeys)) {
    //   return;
    // }

    if (_.isEmpty(unhandled)) {
      return;
    }

    console.log('Found NO handler for this');
    this.printAllKeysPressed();
    console.log('chordKeys: ' + JSON.stringify(chordKeys, null, 2));

    // const secondMostRecentKeyHeld = this.getSecondMostRecentKeyHeld();

    // console.log('In debounced function');

    // this.getPenultimateKeyHeld();
  }

  addKeyData(keyData) {
    this.keys[keyData.data1] = keyData;
  }

  processMessage(status, data1, data2, deltaTime) {
    if (status === MidiConstants.NOTE_ON) {
      const keyData = new KeyData(data1, data2);
      this.addKeyData(keyData);

      // console.log(`You pressed: ${keyData}`);
      // this.printAllKeysPressed();

      this.debouncedHandleKeyPress(keyData);
    } else if (status === MidiConstants.NOTE_OFF) {
      // console.log(`You let go of: ${data1}`);
      delete this.keys[data1];

      // this.printAllKeysPressed();
    } else {
      console.log(
        `status: ${status} data1: ${data1} data2: ${data2} deltaTime: ${deltaTime}`
      );
    }

    if (status === MidiConstants.NOTE_OFF && data1 === 36) {
      for (let i = 0; i < 15; ++i) {
        console.log(' ');
      }
    }
  }
}

export default KeyRecognizer;

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
    this.intervalModeKeyNumber = 41;

    /**
     * Keys: the "data1" property
     * Values: KeyData objects
     *
     * A key/value pair is added when a note is pressed and removed when the
     * note is released.
     * @type {Object<number, KeyData>}
     */
    this.keys = {};

    /**
     * History:
     * 3/29/19 - changing from 90 to 80 since it's too high
     * 3/30/19 - changing from 80 to 85 since it's too low
     */
    this.velocityThreshold = 85;

    // This gets added to velocityThreshold for some keys. This is only intended
    // for use for keys where you either end up naturally mashing that key or
    // the key itself is broken.
    this.additionalVelocityThreshold = 10;

    /**
     * When true, we are only in Numbers Mode for a single keypress. After that
     * keypress, we enter Letters Mode regardless of where we came from.
     */
    this.temporarilyInNumbersMode = false;

    this.mode = Modes.LETTERS;

    this.handlers = {
      [Modes.LETTERS]: this.handleLetterInput,
      [Modes.COMMANDS]: this.handleCommandInput,
      [Modes.NUMBERS]: this.handleNumberInput,
    };

    /**
     * The keys of this object are the piano key numbers. The values are
     * handlers for those keys. This is populated by
     * formPianoKeyToLetterMapping.
     *
     * The functions will get two arguments: velocity (number) and
     * hasExceededVelocityThreshold (boolean).
     * @type {Object<string, Function>}
     * @see formPianoKeyToLetterMapping
     */
    this.pianoKeyToLetterMapping = {};

    /**
     * See pianoKeyToLetterMapping. This structure is used when in NUMBERS mode.
     *
     * This could be combined with pianoKeyToLetterMapping by just making the
     * values be objects with different handlers based on the mode that you're
     * in.
     */
    this.pianoKeyToNumberMapping = {};

    /**
     * See pianoKeyToLetterMapping. This structure is used when in COMMANDS
     * mode.
     */
    this.pianoKeyToCommandMapping = {};

    this.formPianoKeyToLetterMapping();
    this.formPianoKeyToNumberMapping();
    this.formPianoKeyToCommandMapping();

    setInterval(() => {
      if (this.isTemporarilyHandlingIntervalsAndChords()) {
        this.handleKeyPress();
      }
    }, 16);
  }

  /**
   * This just populates the key-mapping dictionary.
   */
  formPianoKeyToNumberMapping() {
    this.pianoKeyToNumberMapping[51] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) robot.keyTap('\\');
      else robot.keyTap('/');
    };
    this.pianoKeyToNumberMapping[63] = (vel, hasExceededVelocityThreshold) =>
      robot.keyTap('\\', 'shift');
    this.pianoKeyToNumberMapping[66] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) robot.keyTap(']', 'shift');
      else robot.keyTap('[', 'shift');
    };
    this.pianoKeyToNumberMapping[68] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) robot.keyTap(']');
      else robot.keyTap('[');
    };
    this.pianoKeyToNumberMapping[70] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) robot.keyTap('.');
      else robot.keyTap(',');
    };

    const pianoKeyToNumberMap = {
      43: '1',
      44: ';',
      45: '2',
      47: '3',
      48: '4',
      50: '5',
      60: '6',
      62: '7',
      64: '8',
      65: '9',
      67: '0',
      69: '-',
      71: '=',
    };

    _.forEach(pianoKeyToNumberMap, (number, pianoKeyNumber) => {
      this.pianoKeyToNumberMapping[pianoKeyNumber] = (
        vel,
        hasExceededVelocityThreshold
      ) =>
        robot.keyTap(number, hasExceededVelocityThreshold ? 'shift' : 'none');
    });
  }

  formPianoKeyToCommandMapping() {
    this.pianoKeyToCommandMapping[43] = () => robot.keyTap('down');
    this.pianoKeyToCommandMapping[44] = () => robot.keyTap('up');
    this.pianoKeyToCommandMapping[64] = () => robot.keyTap('z', 'control');
    this.pianoKeyToCommandMapping[65] = () => robot.keyTap('y', 'control');
    this.pianoKeyToCommandMapping[48] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) {
        robot.keyTap('backspace', ['control', 'shift']);
      } else {
        robot.keyTap('home');
      }
    };
    this.pianoKeyToCommandMapping[49] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) robot.keyTap('backspace', 'control');
      else robot.keyTap('left', 'control');
    };
    this.pianoKeyToCommandMapping[50] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) robot.keyTap('backspace');
      else robot.keyTap('left');
    };
    this.pianoKeyToCommandMapping[60] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) robot.keyTap('delete');
      else robot.keyTap('right');
    };
    this.pianoKeyToCommandMapping[61] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) robot.keyTap('delete', 'control');
      else robot.keyTap('right', 'control');
    };
    this.pianoKeyToCommandMapping[62] = (vel, hasExceededVelocityThreshold) => {
      if (hasExceededVelocityThreshold) {
        robot.keyTap('delete', ['control', 'shift']);
      } else {
        robot.keyTap('end');
      }
    };
  }

  formPianoKeyToLetterMapping() {
    this.pianoKeyToLetterMapping[42] = (vel, hasExceededVelocityThreshold) =>
      robot.keyTap('space');
    this.pianoKeyToLetterMapping[69] = (vel, hasExceededVelocityThreshold) =>
      robot.keyTap('backspace');

    const pianoKeyToLetterMap = {
      43: 'L',
      44: 'P',
      45: 'R',
      46: 'M',
      47: 'N',
      48: 'O',
      49: 'C',
      50: 'T',
      51: 'W',
      52: 'B',
      53: 'K',
      54: 'J',
      55: 'Q',
      56: 'X',
      57: 'Z',
      58: 'Y',
      59: 'G',
      60: 'E',
      61: 'D',
      62: 'A',
      63: 'U',
      64: 'I',
      65: 'S',
      66: 'F',
      67: 'H',
      68: 'V',
    };

    _.forEach(pianoKeyToLetterMap, (letter, pianoKeyNumber) => {
      this.pianoKeyToLetterMapping[pianoKeyNumber] = (
        vel,
        hasExceededVelocityThreshold
      ) => this.typeLetter(letter, hasExceededVelocityThreshold);
    });
  }

  hasExceededVelocityThreshold = (data1, data2) => {
    let threshold = this.velocityThreshold;
    if (data1 === 47) {
      threshold += this.additionalVelocityThreshold;
    }

    return data2 > threshold;
  };

  handleNumberInput = (data1, data2) => {
    const exceededVelocityThreshold = this.hasExceededVelocityThreshold(
      data1,
      data2
    );

    let handled = false;
    if (data1 in this.pianoKeyToNumberMapping) {
      const handlerFn = this.pianoKeyToNumberMapping[data1];
      handlerFn(data2, exceededVelocityThreshold);
      handled = true;
    }

    if (handled && this.temporarilyInNumbersMode) {
      this.temporarilyInNumbersMode = false;
      this.setMode(Modes.LETTERS);
    }

    return handled;
  };

  handleCommandInput = (data1, data2) => {
    const exceededVelocityThreshold = this.hasExceededVelocityThreshold(
      data1,
      data2
    );

    if (data1 in this.pianoKeyToCommandMapping) {
      const handlerFn = this.pianoKeyToCommandMapping[data1];
      handlerFn(data2, exceededVelocityThreshold);
      return true;
    }
    return false;
  };

  handleLetterInput = (data1, data2) => {
    const exceededVelocityThreshold = this.hasExceededVelocityThreshold(
      data1,
      data2
    );

    if (data1 in this.pianoKeyToLetterMapping) {
      const handlerFn = this.pianoKeyToLetterMapping[data1];
      handlerFn(data2, exceededVelocityThreshold);
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
  getChordKeys() {
    const curTime = Date.now();

    if (this.isTemporarilyHandlingIntervalsAndChords()) {
      // The head of the array will be the oldest key.
      //
      // We need to wait a long enough time after the last key before trying to
      // handle them as an interval or chord. That way, pressing C-E isn't
      // interpreted as a major third when a G would follow shortly thereafter
      // (thus making it a major triad),
      const sortedKeys = _.orderBy(this.keys, 'timePressed');
      const lastKeyPressed = _.last(sortedKeys);

      if (
        !_.isNil(lastKeyPressed) &&
        curTime < lastKeyPressed.timePressed + 25
      ) {
        return [];
      }
      // return _.filter(sortedKeys, (keyData, index) => {
      //   const onLastKey = index === _.size(sortedKeys);
      //   const waitTime = onLastKey - 1 ? 50 : 0;
      //   return curTime >= keyData.timePressed + waitTime && !keyData.handled;
      // });
    }

    return _.filter(this.keys, (keyData, index) => !keyData.handled);
  }

  getOldestKeyHeld() {
    // The head of the array will be the oldest key
    const sortedKeys = _.orderBy(this.keys, 'timePressed');

    const numKeys = _.size(sortedKeys);
    if (numKeys < 2) {
      return null;
    }

    return _.head(sortedKeys);
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

    const exceededVelocityThreshold =
      chordKeys[0].data2 > this.velocityThreshold ||
      chordKeys[1].data2 > this.velocityThreshold;

    const interval = chordKeys[0].getIntervalTo(chordKeys[1]);

    // An interval of 24 is two whole octaves, which is where the pinkies naturally rest.
    if (interval === 1 || interval === 2 || interval === 24) {
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
    let handled = false;
    if (this.handleTriadQuality(chordKeys)) {
      handled = true;
    }

    if (!handled && this.handleInterval(chordKeys)) {
      handled = true;
    }

    if (handled) {
      _.forEach(chordKeys, (keyData) => {
        keyData.handled = handled;
      });
    }

    return handled;
  }

  typeLetter(letter, hasExceededVelocityThreshold) {
    if (hasExceededVelocityThreshold) {
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

    const { data1, data2, handled: wasAlreadyHandled } = chordKeys[0];

    // Don't handle one of these twice.
    if (wasAlreadyHandled) {
      return true;
    }

    const handled = this.handlers[this.mode](data1, data2);
    chordKeys[0].handled = handled;
    return handled;
  }

  isTemporarilyHandlingIntervalsAndChords() {
    return !_.isNil(this.keys[this.intervalModeKeyNumber]);
  }

  handleKeyPress() {
    // Figure out how much time passed between the last key that was held and
    // this one so that we can figure out if it should be part of the chord.

    const chordKeys = this.getChordKeys();

    // this.printAllKeysPressed();
    // console.log("chordKeys: " + JSON.stringify(chordKeys, null, 2));

    // TODO: check for chords / intervals / keys and run their handlers
    // accordingly based on the mode we're in
    if (this.isTemporarilyHandlingIntervalsAndChords()) {
      this.handleChord(chordKeys);
      return;
    }

    // If we didn't find a chord handler, then interpret all of the keys we
    // collected as individual keys.
    const unhandled = [];
    if (_.size(chordKeys) > 1) {
      console.log(
        'Interpreting multiple chord keys as single keys chordKeys: ' +
          JSON.stringify(chordKeys, null, 2)
      );
    }

    // Play them back from oldest to newest
    const sortedKeys = _.orderBy(chordKeys, 'timePressed');
    _.forEach(sortedKeys, (chordKey) => {
      const handled = this.handleNonChord([chordKey]);
      if (!handled) {
        unhandled.push(chordKey);
      }
    });
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

    // Mark it as handled immediately so that we don't try handling it twice.
    if (keyData.data1 === this.intervalModeKeyNumber) {
      keyData.handled = true;
    }
  }

  processMessage(status, data1, data2, deltaTime) {
    if (status === MidiConstants.NOTE_ON) {
      const keyData = new KeyData(data1, data2);
      this.addKeyData(keyData);

      this.handleKeyPress();
    } else if (status === MidiConstants.NOTE_OFF) {
      // console.log(`You let go of: ${data1}`);

      delete this.keys[data1];

      // this.printAllKeysPressed();
    } else {
      console.log(
        `status: ${status} data1: ${data1} data2: ${data2} deltaTime: ${deltaTime}`
      );
    }
  }
}

export default KeyRecognizer;

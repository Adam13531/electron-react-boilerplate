import { MidiConstants, PianoKeyConstants } from './constants';
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
    this.intervalModeKeyNumber = PianoKeyConstants.F2;

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
    this.pianoKeyToNumberMapping[PianoKeyConstants.DS3] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) robot.keyTap('\\');
      else robot.keyTap('/');
    };
    this.pianoKeyToNumberMapping[PianoKeyConstants.DS4] = (
      vel,
      hasExceededVelocityThreshold
    ) => robot.keyTap('\\', 'shift');
    this.pianoKeyToNumberMapping[PianoKeyConstants.FS4] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) robot.keyTap(']', 'shift');
      else robot.keyTap('[', 'shift');
    };
    this.pianoKeyToNumberMapping[PianoKeyConstants.GS4] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) robot.keyTap(']');
      else robot.keyTap('[');
    };
    this.pianoKeyToNumberMapping[PianoKeyConstants.AS4] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) robot.keyTap('.');
      else robot.keyTap(',');
    };

    const pianoKeyToNumberMap = {
      [PianoKeyConstants.G2]: '1',
      [PianoKeyConstants.GS2]: ';',
      [PianoKeyConstants.A2]: '2',
      [PianoKeyConstants.B2]: '3',
      [PianoKeyConstants.C3]: '4',
      [PianoKeyConstants.D3]: '5',
      [PianoKeyConstants.C4]: '6',
      [PianoKeyConstants.D4]: '7',
      [PianoKeyConstants.E4]: '8',
      [PianoKeyConstants.F4]: '9',
      [PianoKeyConstants.G4]: '0',
      [PianoKeyConstants.A4]: '-',
      [PianoKeyConstants.B4]: '=',
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
    this.pianoKeyToCommandMapping[PianoKeyConstants.G2] = () =>
      robot.keyTap('down');
    this.pianoKeyToCommandMapping[PianoKeyConstants.GS2] = () =>
      robot.keyTap('up');
    this.pianoKeyToCommandMapping[PianoKeyConstants.E4] = () =>
      robot.keyTap('z', 'control');
    this.pianoKeyToCommandMapping[PianoKeyConstants.F4] = () =>
      robot.keyTap('y', 'control');
    this.pianoKeyToCommandMapping[PianoKeyConstants.C3] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) {
        robot.keyTap('backspace', ['control', 'shift']);
      } else {
        robot.keyTap('home');
      }
    };
    this.pianoKeyToCommandMapping[PianoKeyConstants.CS3] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) robot.keyTap('backspace', 'control');
      else robot.keyTap('left', 'control');
    };
    this.pianoKeyToCommandMapping[PianoKeyConstants.D3] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) robot.keyTap('backspace');
      else robot.keyTap('left');
    };
    this.pianoKeyToCommandMapping[PianoKeyConstants.C4] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) robot.keyTap('delete');
      else robot.keyTap('right');
    };
    this.pianoKeyToCommandMapping[PianoKeyConstants.CS4] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) robot.keyTap('delete', 'control');
      else robot.keyTap('right', 'control');
    };
    this.pianoKeyToCommandMapping[PianoKeyConstants.D4] = (
      vel,
      hasExceededVelocityThreshold
    ) => {
      if (hasExceededVelocityThreshold) {
        robot.keyTap('delete', ['control', 'shift']);
      } else {
        robot.keyTap('end');
      }
    };
  }

  formPianoKeyToLetterMapping() {
    this.pianoKeyToLetterMapping[PianoKeyConstants.FS2] = (
      vel,
      hasExceededVelocityThreshold
    ) => robot.keyTap('space');
    this.pianoKeyToLetterMapping[PianoKeyConstants.A4] = (
      vel,
      hasExceededVelocityThreshold
    ) => robot.keyTap('backspace');

    const pianoKeyToLetterMap = {
      [PianoKeyConstants.G2]: 'L',
      [PianoKeyConstants.GS2]: 'P',
      [PianoKeyConstants.A2]: 'R',
      [PianoKeyConstants.AS2]: 'M',
      [PianoKeyConstants.B2]: 'N',
      [PianoKeyConstants.C3]: 'O',
      [PianoKeyConstants.CS3]: 'C',
      [PianoKeyConstants.D3]: 'T',
      [PianoKeyConstants.DS3]: 'W',
      [PianoKeyConstants.E3]: 'B',
      [PianoKeyConstants.F3]: 'K',
      [PianoKeyConstants.FS3]: 'J',
      [PianoKeyConstants.G3]: 'Q',
      [PianoKeyConstants.GS3]: 'X',
      [PianoKeyConstants.A3]: 'Z',
      [PianoKeyConstants.AS3]: 'Y',
      [PianoKeyConstants.B3]: 'G',
      [PianoKeyConstants.C4]: 'E',
      [PianoKeyConstants.CS4]: 'D',
      [PianoKeyConstants.D4]: 'A',
      [PianoKeyConstants.DS4]: 'U',
      [PianoKeyConstants.E4]: 'I',
      [PianoKeyConstants.F4]: 'S',
      [PianoKeyConstants.FS4]: 'F',
      [PianoKeyConstants.G4]: 'H',
      [PianoKeyConstants.GS4]: 'V',
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
    if (data1 === PianoKeyConstants.B2) {
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

    if (_.isEmpty(unhandled)) {
      return;
    }

    console.log('Found NO handler for this');
    this.printAllKeysPressed();
    console.log('chordKeys: ' + JSON.stringify(chordKeys, null, 2));
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
      delete this.keys[data1];
    } else {
      console.log(
        `status: ${status} data1: ${data1} data2: ${data2} deltaTime: ${deltaTime}`
      );
    }
  }
}

export default KeyRecognizer;

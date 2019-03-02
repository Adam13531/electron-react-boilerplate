import midi from 'midi';

class MidiWrapper {
  constructor(keyRecognizer) {
    // Set up a new input.
    this.input = new midi.input();

    this.keyRecognizer = keyRecognizer;

    // Count the available input ports.
    const numPorts =  this.input.getPortCount();

    console.log('numPorts: ' + JSON.stringify(numPorts));

    const portToGet = 1;

    // Get the name of a specified input port.
    const portName = this.input.getPortName(portToGet);
    console.log('portName: ' + JSON.stringify(portName));

    // Open the first available input port.
    this.input.openPort(portToGet);

    // Sysex, timing, and active sensing messages are ignored
    // by default. To enable these message types, pass false for
    // the appropriate type in the function below.
    // Order: (Sysex, Timing, Active Sensing)
    // For example if you want to receive only MIDI Clock beats
    // you should use
    this.input.ignoreTypes(true, true, true);
    // this.input.ignoreTypes(false, false, false);

    this.input.on('message', this.handleMidiMessage);
  }

  handleMidiMessage = (deltaTime, message) => {
    // The message is an array of numbers corresponding to the MIDI bytes:
    //   [status, data1, data2]
    // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
    // information interpreting the messages.
    //
    // http://computermusicresource.com/MIDI.Commands.html
    const [status, data1, data2] = message;
    this.keyRecognizer.processMessage(status, data1, data2, deltaTime);
  }

  dispose() {
    this.input.closePort();
    this.input = null;
  }
}

export default MidiWrapper;

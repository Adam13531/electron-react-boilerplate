class KeyData {
  constructor(data1, data2) {
    this.data1 = data1;
    this.data2 = data2;
    this.timePressed = Date.now();

    // Whether or not this key was already handled. This is important when a key
    // is handled on just pressing it, but the user continues to hold the key
    // while they press another. For example, if you hold A and press B, it
    // shouldn't be considered typing both "A" AND "AB" (forming "AAB"), it
    // should just be "AB".
    this.handled = false;
  }

  getIntervalTo(otherKeyData) {
    return Math.abs(otherKeyData.data1 - this.data1);
    // let lowerKey = this.data1;
    // let higherKey = this.data2;
    // if (lowerKey > higherKey) {
    //   const temp = lowerKey;
    //   lowerKey = higherKey;
    //   higherKey = temp;
    // }

    // return higherKey - lowerKey;
  }

  toString() {
    return `KeyData: data1=${this.data1} data2=${this.data2} timePressed=${this.timePressed}`;
  }
}

export default KeyData;

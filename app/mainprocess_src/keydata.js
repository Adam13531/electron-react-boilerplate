class KeyData {
  constructor(data1, data2) {
    this.data1 = data1;
    this.data2 = data2;
    this.timePressed = Date.now();
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

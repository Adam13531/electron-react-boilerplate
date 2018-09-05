// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';
import { ipcRenderer } from 'electron';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  componentDidMount() {
    ipcRenderer.on('midi', (event, message, deltaTime) => {
      console.log('m:' + message + ' d:' + deltaTime);

    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('midi');
  }

  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <h2>Home</h2>
          <Link to="/counter">to Counter</Link>
        </div>
      </div>
    );
  }
}

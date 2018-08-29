import React, { Component } from 'react';

export default class Intro extends Component {
  render() {
    return (
      <div className="intro">
      <h1>Rock Paper Scissors</h1>
        <p>
          Win money from strangers! This blockchain-based rock-paper-scissors game is provably fair and guarantees immediate payouts.
          See the code <a href='https://github.com/joelsfoster/rock-paper-scissors'>here</a>.
        </p>
        <h4><p><i>To play, first log into your MetaMask browser extension.</i></p></h4>
      </div>
    )
  }
}

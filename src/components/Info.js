import React, { Component } from 'react';

export default class Rules extends Component {
  render() {
    return (
      <div className="info">
        <p>Your ETH balance and address: {this.props.balance} ETH | {this.props.account}</p>
        <p>
          This game's contract is deployed at: {this.props.contractAddress}
          <br/><i>(Ensure this address matches your MetaMask's "send transaction" confirmations!)</i>
        </p>
      </div>
    )
  }
}

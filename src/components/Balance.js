import React, { Component } from 'react';

export default class Balance extends Component {

  render() {

    /* Rounding to make the user ignore dust in their account, because for some
     * God-knows-why reason if the user tries to withdraw their full balance,
     * the front end won't permit the withdrawal. I have no idea why its doing
     * that and it's very frustrating.
     */
    const lowBalanceNumber = 0.0001;

    return (
      <div className="balance">
        <p>Your ETH wallet address: {this.props.account}</p>
        <p>Your wallet balance: {this.props.accountBalance > lowBalanceNumber ? this.props.accountBalance.toFixed(4) : 0} ETH</p>
        <p>Your in-game balance: {this.props.gameBalance > lowBalanceNumber ? this.props.gameBalance.toFixed(4) : 0 } ETH</p>
        <form>
          <input type="text" name="deposit" placeholder="ETH" value={this.props.deposit ? this.props.deposit : ""} onChange={this.props.handleDepositChange} />
          <button onClick={this.props.handleDeposit}>Deposit</button>
        </form>
        <form>
          <input type="text" name="withdraw" placeholder="ETH" value={this.props.withdraw ? this.props.withdraw : ""} onChange={this.props.handleWithdrawChange} />
          <button onClick={this.props.handleWithdraw}>Withdraw</button>
        </form>
      </div>
    )
  }
}

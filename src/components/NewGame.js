import React, { Component } from 'react';

export default class NewGame extends Component {

  render() {
    return (
      <div className="new-game">
        <h3>Create New Game</h3>
        <p>Minimum wager: {this.props.minimumWager} ETH</p>
        <form>
          <select onChange={this.props.handleNewGameMoveChange}>
            <option value="Rock">Rock</option>
            <option value="Paper">Paper</option>
            <option value="Scissors">Scissors</option>
          </select>
          <input type="password" name="password" placeholder="Password" value={this.props.newGamePassword ? this.props.newGamePassword : ""} onChange={this.props.handleNewGamePasswordChange} />
          <input type="text" name="wager" placeholder="Wager (in ETH)" value={this.props.wager ? this.props.wager : ""} onChange={this.props.handleWagerChange} />
          <button onClick={this.props.handleNewGame}>Create Game</button>
        </form>
      </div>
    )
  }
}

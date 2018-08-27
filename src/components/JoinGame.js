import React, { Component } from 'react';

export default class JoinGame extends Component {

  render() {
    return (
      <div className="join-game">
        <h3>Join Game</h3>
        <form>
          <select onChange={this.props.handleJoinGameMoveChange}>
            <option value="Rock">Rock</option>
            <option value="Paper">Paper</option>
            <option value="Scissors">Scissors</option>
          </select>
          <input type="password" name="password" placeholder="Password" value={this.props.joinGamePassword ? this.props.joinGamePassword : ""} onChange={this.props.handleJoinGamePasswordChange} />
          <input type="text" name="gameId" placeholder="Game ID" value={this.props.joinGameId ? this.props.joinGameId : ""} onChange={this.props.handleJoinGameIdChange} />
          <button onClick={this.props.handleJoinGame}>Join Game</button>
        </form>
      </div>
    )
  }
}

import React, { Component } from 'react';

export default class AvailableGames extends Component {

  renderAvailableGames() {
    if (this.props.availableGames.length > 0) {
      return this.props.availableGames.map(game => {
        return (
          <div key={game.gameId}>
            <p>Game ID: {game.gameId} | Wager: {game.wager} ETH | Creator: {game.creator}</p>
          </div>
        )
      });
    } else {
      return ( <p>No available games. Try creating one!</p> )
    }
  }

  render() {
    return (
      <div className="available-games">
        <h3>Available Games</h3>
        {this.renderAvailableGames()}
      </div>
    )
  }
}

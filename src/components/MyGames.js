/* eslint-disable */

import React, { Component } from 'react';

export default class MyGames extends Component {

  renderMyGames() {
    if (this.props.myGames.length > 0) {
      return this.props.myGames.map(game => {
        return (
          <div key={game.gameId}>
            <p>
              Game ID: {game.gameId}<br/>
              Wager: {game.wager} ETH<br/>
              Status: {this.props.gameStatusReference[game.status]}<br/>
              Creator: {game.creator}<br/>
              Challenger: {game.challenger == "0x0000000000000000000000000000000000000000" ? "" : game.challenger}<br/>
              Winner: {this.displayWinner(game)}
            </p>
          </div>
        )
      });
    } else {
      return ( <p>You haven't played any games with this account!</p> )
    }
  }

  displayWinner(game) {
    if (game.winner == "0x0000000000000000000000000000000000000000" && game.status == 5) { return "Tie" } // game.status = Finished
    else if (game.winner == "0x0000000000000000000000000000000000000000") { return "" }
    else { return game.winner }
  }

  render() {
    return (
      <div className="my-games">
        <h3>My Games</h3>
        {this.renderMyGames()}
      </div>
    )
  }
}

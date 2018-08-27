import React, { Component } from 'react';

export default class CancelGame extends Component {

  render() {
    return (
      <div className="cancel-game">
        <h3>Cancel Open Game</h3>
        <form>
          <input type="text" name="gameId" placeholder="Game ID" value={this.props.cancelGameId ? this.props.cancelGameId : ""} onChange={this.props.handleCancelGameIdChange} />
          <button onClick={this.props.handleCancelGame}>Cancel Game</button>
        </form>
      </div>
    )
  }
}

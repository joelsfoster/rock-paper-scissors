import React, { Component } from 'react';

export default class RevealMove extends Component {

  render() {
    return (
      <div className="reveal-move">
        <h3>Reveal Move</h3>
        <form>
          <select onChange={this.props.handleRevealMoveChange}>
            <option value="Rock">Rock</option>
            <option value="Paper">Paper</option>
            <option value="Scissors">Scissors</option>
          </select>
          <input type="password" name="password" placeholder="Password" value={this.props.revealMovePassword ? this.props.revealMovePassword : ""} onChange={this.props.handleRevealMovePasswordChange} />
          <input type="text" name="gameId" placeholder="Game ID" value={this.props.revealMoveGameId ? this.props.revealMoveGameId : ""} onChange={this.props.handleRevealMoveGameIdChange} />
          <button onClick={this.props.handleRevealMove}>Reveal Move</button>
        </form>
      </div>
    )
  }
}

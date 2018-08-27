import React, { Component } from 'react';

export default class Rules extends Component {
  render() {
    return (
      <div className="rules">
        <h2>Rules</h2>
        <ol>
          <li>Create a game by setting a wager. If you win, your opponent will pay you that wager. If you lose, you'll pay them.</li>
          <li>You and your opponent each submit a password-encrypted move (rock, paper, or scissors) that no human or computer is capable of reverse-encrypting.</li>
          <li>Make sure you remember your move! You will need to re-enter it later.</li>
          <li>Once both players submit their moves, their wagers are locked in the game.</li>
          <li>Both players must then reveal their moves by entering their password and move to prove that it matches their original one.</li>
          <li>You have 24 hours to complete the game.</li>
          <li>If only one player has revealed their move by the game's expiration, they automatically win regardless of their opponent's move.</li>
          <li>If neither player reveals their move, or if both players reveal a tie, both players get their wagers back.</li>
          <li>If you created a game and no one joins it, you can always cancel that game and get your wager back.</li>
        </ol>
      </div>
    )
  }
}

pragma solidity ^0.4.23;

contract RockPaperScissors {




  // Player can create a game by submitting his/her entry fee and their encrypted submission: sha3(answer, msg.sender, password)

  // Player can cancel the open game and get their entry fee back

  // Opponent can see all open games

  // Opponent can join a open game by submitting his/her entry fee and their encrypted submission

  // Game has begun, and funds are locked for the next 5,760 blocks (roughly 24 hours @ a 15sec blocktime) or unless there is a winner

  // Allow players to reveal their answers

  // If both player's answers are revealed and there is a winner, pay out to them

  // If both players reveal and there is a tie, refund both players

  // If the game time is over, and there is only one revealed answer, pay out to them

  // If the game time is over and there is no revealed answer, refund both players




}

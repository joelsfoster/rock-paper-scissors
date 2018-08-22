pragma solidity ^0.4.23;

contract RockPaperScissors {

  // Declare constructor variables
  address owner;
  uint gameIdCounter;
  uint minimumWager;
  uint gameBlockTimeLimit;

  // When the contract is deployed, set the owner and the variables
  constructor(_minimumEntryFee) public {
    owner = msg.sender;
    gameIdCounter = 0;
    minimumWager = _minimumWager;
    gameBlockTimeLimit = 5760; // Roughly 24 hours @ a 15 second blocktime
  }

  // The Game object
  struct Game {
    uint gameId;
    uint wager;
    uint gameStartBlock;
    address creator;
    address challenger;
    address winner;
    string creatorEncryptedMove;
    string challengerEncryptedMove;
    Status status;
  }

  // Game objects are identified by their gameId in a mapping called 'games', i.e. games[0] returns the first Game
  mapping (uint => Game) public games;

  // Three possible Moves in this game
  enum Move {
    Rock,
    Paper,
    Scissors
  }

  // Game statuses
  enum Status {
    Open,
    Cancelled,
    AwaitingReveals,
    AwaitingCreatorReveal,
    AwaitingChallengerReveal,
    Finished,
    Expired
  }

  // Reusable code to return any extra funds sent to the contract
  modifier returnExtraPayment(_wager) internal {
    _; // This function modifier code executes after its parent function is called
    uint amountToRefund = msg.value - _wager;
    msg.sender.transfer(amountToRefund);
  }

  // Reusable code to check that a valid _password was submitted
  modifier validatePassword(_password) internal {
    require(_password != '');
    _;
  }

  // Reusable code to check that a valid _wager was submitted and that enough funds were sent to pay it
  modifier validateWager(_wager) internal {
    require(msg.value >= _wager && _wager >= minimumWager);
    _;
  }

  // Reusable code to check if the game has been open for too long
  modifier checkGameExpiration(_gameId) internal {
    Game memory game = games[_gameId];
    if (game.gameStartBlock >= game.gameStartBlock + gameBlockTimeLimit) {
      game.status = Status.Expired;
      // There is no _; here because if this is called because the game is expired, no further action is taken
    }
  }

  // Reusable code to check that a valid _move (string) was submitted
  /// @return Will return the appropriate Move enum matching the string
  function validateMove(_move) internal {
    require(_move == 'Rock' || _move == 'Paper' || _move == 'Scissors');
    if (_move == 'Rock') { return Move.Rock }
    else if (_move == 'Paper') { return Move.Paper }
    else if (_move == 'Scissors') { return Move.Scissors }
    else { return null };
  }

  // Players can create a game by submitting their wager, using a password to encrypt their move
  function createGame(_move, _password, _wager) public payable validatePassword(_password) validateWager(_wager) returnExtraPayment(_wager) {
    Move validatedMove = validateMove(_move);
    if (validatedMove) {
      games[gameIdCounter] = Game({ // Create a new game
        gameId: gameIdCounter,
        wager: _wager,
        gameStartBlock: null,
        creator: msg.sender,
        challenger: null,
        winner: null,
        creatorEncryptedMove: sha3(validatedMove, msg.sender, _password), // Encrypted using the user's password
        challengerEncryptedMove: null,
        status: Status.Open
      });
      gameIdCounter++; // Prep the counter for the next game
    }
  }

  // Players can cancel their open game and get their wager deposits back
  function cancelGame(_gameId) public {
    Game storage game = games[_gameId];
    require(msg.sender == game.creator);
    game.status = Status.Cancelled;
    game.creator.transfer(game.wager);
  }

  // Opponent can join a open game by submitting his/her entry fee and their encrypted submission
  function joinGame(_gameId, _move, _password) public payable validatePassword(_password) validateWager(games[_gameId].wager) returnExtraPayment(games[_gameId].wager) {
    Game storage game = games[_gameId]; // Too bad Solidity doesn't let you define local variables in function arguments like JavaScript
    require(game.creator != msg.sender); // You can't challenge yourself!
    Move validatedMove = validateMove(_move);
    if (validatedMove) {
      game.status = Status.AwaitingReveals;
      game.challenger = msg.sender;
      game.gameStartBlock = block.number;
      game.challengerEncryptedMove = sha3(validatedMove, msg.sender, _password) // Encrypted using the user's password
    }
  }

  // Game has begun, and funds are locked for the next 5,760 blocks (roughly 24 hours @ a 15sec blocktime) or unless there is a winner
  // Include the checkGameExpiration(_gameId) modifier in every function below
  // Write a comment in the design pattern doc about how game expiration works


  // Allow players to reveal their answers

  // If both player's answers are revealed and there is a winner, pay out to them

  // If both players reveal and there is a tie, refund both players

  // If the game time is over, and there is only one revealed answer, pay out to them

  // If the game time is over and there is no revealed answer, refund both players




}

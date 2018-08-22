pragma solidity ^0.4.23;

contract RockPaperScissors {


  /*
  <-- Global Variables, Data Structures, and Constructor -->
  */

  // Declare global variables
  address public owner;
  uint public gameIdCounter;
  uint public minimumWager;
  uint public gameBlockTimeLimit;

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
    Move creatorMove;
    Move challengerMove;
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

  // @return i.e. moveWinsAgainst[Move.Rock] returns Move.Paper
  mapping (Move => Move) public moveWinsAgainst;

  // Seeds the moveWinsAgainst mapping
  function seedMoveWinsAgainst() internal pure {
    moveWinsAgainst[Move.Rock] = Move.Paper;
    moveWinsAgainst[Move.Paper] = Move.Scissors;
    moveWinsAgainst[Move.Scissors] = Move.Rock;
  }

  // When the contract is deployed, set the owner and the global variables and seed the moveWinsAgainst mapping
  constructor(_minimumEntryFee) public {
    owner = msg.sender;
    gameIdCounter = 0;
    minimumWager = _minimumWager;
    gameBlockTimeLimit = 5760; // Roughly 24 hours @ a 15 second blocktime
    seedMoveWinsAgainst();
  }


  /*
  <-- Modifiers -->
  */

  // Reusable code to return any extra funds sent to the contract
  modifier returnExtraPayment(_wager) internal pure {
    _; // This function modifier code executes after its parent function resolves
    uint amountToRefund = msg.value - _wager;
    msg.sender.transfer(amountToRefund);
  }

  // Reusable code to check that a valid _password was submitted
  modifier validatePassword(_password) internal pure {
    require(_password != '');
    _;
  }

  // Reusable code to check that a valid _wager was submitted and that enough funds were sent to pay it
  modifier validateWager(_wager) internal pure {
    require(msg.value >= _wager && _wager >= minimumWager);
    _;
  }

  // Reusable code to check if the game has been open for too long
  modifier checkGameExpiration(_gameId) internal {
    Game storage game = games[_gameId];
    if (game.gameStartBlock >= game.gameStartBlock + gameBlockTimeLimit) {
      game.status = Status.Expired;
      // There is no _; here because if this is called because the game is expired, no further action is taken
    }
  }


  /*
  <-- Functions -->
  */

  // Reusable code to check that a valid _move (string) was submitted
  /// @return Will return the appropriate Move enum matching the string
  function validateMove(_move) internal pure {
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
  // OR try using Ethereum Alarm Clock!!!
  // Write a comment in the design pattern doc about how game expiration works


  // Allow players to reveal their moves by providing their password and repeating their move
  function revealMove(_gameId, _move, _password) public validatePassword(_password) {
    Game storage game = games[_gameId];
    Move validatedMove = validateMove(_move);
    require(validatedMove);

    // If the creator reveals
    if (msg.sender == game.creator) {
      require(game.creatorEncryptedMove == sha3(validatedMove, msg.sender, _password));
      game.creatorMove = validatedMove;
      game.status = Status.AwaitingChallengerReveal;
    }

    // // If the challenger reveals
    else if (msg.sender == game.challenger) {
      require(game.creatorEncryptedMove == sha3(validatedMove, msg.sender, _password));
      game.challengerMove = validatedMove;
      game.status = Status.AwaitingCreatorReveal;
    }

    // If both players' moves are revealed, determine the winner
    if (game.creatorMove && game.challengerMove) {
      determineWinner(_gameId);
    }
  }


  // If both player's answers are revealed and there is a winner, pay out to them
  function determineWinner(_gameId) internal {
    Game storage game = games[_gameId];
    uint totalPrizePool = game.wager * 2;

    // If both players reveal and there is a tie, refund both players
    if (game.creatorMove == game.challengerMove) {
      game.creator.transfer(game.wager);
      game.challenger.transfer(game.wager);
    }

    // The challenger wins
    /// @dev i.e. moveWinsAgainst[Move.Rock] returns Move.Paper
    else if (moveWinsAgainst[game.creatorMove] == game.challengerMove) {
      game.challenger.transfer(totalPrizePool);
    }

    // The creator wins
    /// @dev i.e. moveWinsAgainst[Move.Rock] returns Move.Paper
    else if (moveWinsAgainst[game.challengerMove] == game.creatorMove) {
      game.creator.transfer(totalPrizePool);
    }

    game.status = Status.Finished;
  }



  // If the game time is over, and there is only one revealed answer, pay out to them

  // If the game time is over and there is no revealed answer, refund both players




}

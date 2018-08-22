pragma solidity ^0.4.23;

contract RockPaperScissors {

  // Declare constructor variables
  address owner;
  uint gameIdCounter;
  uint minimumWager;

  // When the contract is deployed, set the owner and the variables
  constructor(_minimumEntryFee) public {
    owner = msg.sender;
    gameIdCounter = 0;
    minimumWager = _minimumWager;
  }

  // The Game object
  struct Game {
    uint gameId;
    address creator;
    string creatorEncryptedMove;
    uint wager;
    uint gameStartBlock;
    address challenger;
  }

  // Game objects are identified by their gameId in a mapping called 'games', i.e. games[0] returns the first Game
  mapping (uint => Game) public games;

  // Three possible Moves in this game
  enum Move {
    Rock,
    Paper,
    Scissors
  }

  // Reusable code to return any extra funds sent to the contract
  modifier returnExtraPayment(_wager) {
    _; // This function modifier code executes after its parent function is called
    uint amountToRefund = msg.value - _wager;
    msg.sender.transfer(amountToRefund);
  }

  // Reusable code to check that a valid _password was submitted
  modifier validatePassword(_password) {
    require(_password != '');
    _;
  }

  // Reusable code to check that a valid _wager was submitted and that enough funds were sent to pay it
  modifier validateWager(_wager) {
    require(msg.value >= _wager && _wager >= minimumWager);
    _;
  }

  // Reusable code to check that a valid _move (string) was submitted
  /// @return Will return the appropriate Move enum matching the string
  function validateMove(_move) {
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
      string encryptedMove = sha3(validatedMove, msg.sender, _password);
      games[gameIdCounter] = Game({gameId: gameIdCounter, creator: msg.sender, creatorEncryptedMove: encryptedMove, wager: _wager, gameStartBlock: 0, challenger: 0x0});
      gameIdCounter++;
    }
  }


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

pragma solidity ^0.4.24;

import "./Ownable.sol";
import "./SafeMath.sol";

contract RockPaperScissors is Ownable {

  /*
  <-- Global Variables, Data Structures, Constructor, Events, and Circuit Breaker -->
  */

  // The SafeMath library protects from overflows
  using SafeMath for uint;

  // Declare global variables
  bool public contractPaused = false;
  uint public gameIdCounter;
  uint public minimumWager; // In wei, recommended: 5000000000000000 wei = .005 ether
  uint public gameBlockTimeLimit;
  bytes32 internal emptyStringHash = keccak256('');

  // The Game object
  struct Game {
    uint gameId;
    uint wager;
    uint gameExpirationBlock;
    address creator;
    address challenger;
    address winner;
    bytes32 creatorEncryptedMove;
    bytes32 challengerEncryptedMove;
    string creatorMove;
    string challengerMove;
    Status status;
  }

  // Used by the front end to find open, in-progress, and completed games
  event GameUpdates(uint gameId, uint wager, address indexed creator, address indexed challenger, Status indexed status, address winner);

  // Game objects are identified by their gameId in a mapping called 'games', i.e. games[0] returns the first Game
  mapping (uint => Game) public games;

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

  /// @dev i.e. moveWinsAgainst['Rock'] returns 'Paper'
  mapping (string => string) internal moveWinsAgainst;

  // Seeds the moveWinsAgainst mapping above
  function seedMoveWinsAgainst() internal {
    moveWinsAgainst['Rock'] = 'Paper';
    moveWinsAgainst['Paper'] = 'Scissors';
    moveWinsAgainst['Scissors'] = 'Rock';
  }

  // When the contract is deployed, set the owner and the global variables and seed the moveWinsAgainst mapping
  constructor(uint _minimumWager) public {
    gameIdCounter = 1; // We want the first game created to have ID = 1
    minimumWager = _minimumWager; // In wei (1 eth = 1000000000000000000 wei)
    gameBlockTimeLimit = 5760; // Roughly 24 hours @ a 15 second blocktime
    seedMoveWinsAgainst();
  }

  // The contract owner can pause all functionality
  function circuitBreaker() public onlyOwner {
    if (contractPaused == false) { contractPaused = true; }
    else { contractPaused = false; }
  }


  /*
  <-- Modifiers -->
  */

  // If the contract is paused, stop the modified function
  modifier checkIfPaused() {
    require(contractPaused == false);
    _;
  }

  // Reusable code to return any extra funds sent to the contract
  modifier returnExtraPayment(uint _wager) {
    _; // This function modifier code executes after its parent function resolves
    uint amountToRefund = msg.value.sub(_wager);
    msg.sender.transfer(amountToRefund);
  }

  // Reusable code to check that a valid _move (string) was submitted
  /// @dev We can't compare strings in solidity, so instead we compare hashes of strings to see if they match
  modifier validateMove(string _move) {
    require(
      keccak256(_move) == keccak256('Rock') ||
      keccak256(_move) == keccak256('Paper') ||
      keccak256(_move) == keccak256('Scissors')
    );
    _;
  }

  // Reusable code to check that a valid _password was submitted
  modifier validatePassword(string _password) {
    require(keccak256(_password) != emptyStringHash);
    _;
  }

  // Reusable code to check that a valid _wager was submitted and that enough funds were sent to pay it
  modifier validateWager(uint _wager) {
    require(
      msg.value >= _wager &&
      _wager >= minimumWager
    );
    _;
  }

  // When attempting to reveal your move, first check if the game expired and handle accordingly
  modifier checkGameExpiration(uint _gameId) {
    Game storage game = games[_gameId];
    uint totalPrizePool = game.wager.mul(2);

    // If the game is expired, handle payments then set the status BEFORE payment is issued, to prevent a recursive call attack
    /// @dev The game.gameExpirationBlock is set to 0 at game creation and is changed to the real expiration when a challenger joins
    if (block.number >= game.gameExpirationBlock && game.gameExpirationBlock != 0 && game.status != Status.Expired) {
      game.status = Status.Expired;
      emit GameUpdates(game.gameId, game.wager, game.creator, game.challenger, Status.Expired, 0x0);

      // If only the challenger revealed, pay them
      if (
        keccak256(game.creatorMove) == emptyStringHash &&
        keccak256(game.challengerMove) != emptyStringHash
        ) { game.challenger.transfer(totalPrizePool); }

      // If only the creator revealed, pay them
      else if (
        keccak256(game.creatorMove) != emptyStringHash &&
        keccak256(game.challengerMove) == emptyStringHash
        ) { game.creator.transfer(totalPrizePool); }

      // If neither of the players are revealed and the game is expired, refund both players
      else if (
        keccak256(game.creatorMove) == emptyStringHash &&
        keccak256(game.challengerMove) == emptyStringHash
        ) {
        game.creator.transfer(game.wager);
        game.challenger.transfer(game.wager);
      }

      revert(); // Ends the parent function without continuing (uses the same opcode as require())
    }

    else {
      _; // If the game is not expired, carry on
    }
  }


  /*
  <-- Functions -->
  */

  // Players can create a game by submitting their wager, using a password to encrypt their move
  function createGame(string _move, string _password, uint _wager) public payable checkIfPaused() validateMove(_move) validatePassword(_password) validateWager(_wager) returnExtraPayment(_wager) {
    games[gameIdCounter] = Game({ // Create a new game
      gameId: gameIdCounter,
      wager: _wager,
      gameExpirationBlock: 0,
      creator: msg.sender,
      challenger: 0x0,
      winner: 0x0,
      creatorEncryptedMove: keccak256(_move, msg.sender, _password), // Encrypted using the user's password
      challengerEncryptedMove: emptyStringHash,
      creatorMove: '',
      challengerMove: '',
      status: Status.Open
    });
    emit GameUpdates(gameIdCounter, _wager, msg.sender, 0x0, Status.Open, 0x0);
    gameIdCounter = gameIdCounter.add(1); // Prep the counter for the next game
  }

  // Players can cancel their open game and get their wager deposits back
  function cancelGame(uint _gameId) public checkIfPaused() {
    Game storage game = games[_gameId];
    require(
      msg.sender == game.creator &&
      game.status == Status.Open
    );
    game.status = Status.Cancelled;
    game.creator.transfer(game.wager); /// @dev Called after state changes to prevent recursive call attacks
    emit GameUpdates(game.gameId, game.wager, msg.sender, 0x0, Status.Cancelled, 0x0);
  }

  // Opponent can join a open game by submitting his/her entry fee and their encrypted submission
  function joinGame(string _move, string _password, uint _gameId) public payable checkIfPaused() validateMove(_move) validatePassword(_password) validateWager(games[_gameId].wager) returnExtraPayment(games[_gameId].wager) {
    Game storage game = games[_gameId]; // Too bad Solidity doesn't let you define local variables in function arguments like JavaScript
    require(
      game.creator != msg.sender && // You can't challange yourself
      game.status == Status.Open
    );
    game.status = Status.AwaitingReveals;
    game.challenger = msg.sender;
    game.gameExpirationBlock = block.number.add(gameBlockTimeLimit);
    game.challengerEncryptedMove = keccak256(_move, msg.sender, _password); // Encrypted using the user's password
    emit GameUpdates(game.gameId, game.wager, game.creator, msg.sender, Status.AwaitingReveals, 0x0);
  }

  // Allow players to reveal their moves by providing their password and repeating their move
  function revealMove(string _move, string _password, uint _gameId) public checkIfPaused() checkGameExpiration(_gameId) validateMove(_move) validatePassword(_password) {
    Game storage game = games[_gameId];
    require(
      game.status == Status.AwaitingReveals ||
      game.status == Status.AwaitingCreatorReveal ||
      game.status == Status.AwaitingChallengerReveal
    );

    if (msg.sender == game.creator) { // If the creator reveals
      require(game.creatorEncryptedMove == keccak256(_move, msg.sender, _password));
      game.creatorMove = _move;
      game.status = Status.AwaitingChallengerReveal;
      emit GameUpdates(game.gameId, game.wager, game.creator, game.challenger, Status.AwaitingChallengerReveal, 0x0);
    } else if (msg.sender == game.challenger) { // If the challenger reveals
      require(game.challengerEncryptedMove == keccak256(_move, msg.sender, _password));
      game.challengerMove = _move;
      game.status = Status.AwaitingCreatorReveal;
      emit GameUpdates(game.gameId, game.wager, game.creator, game.challenger, Status.AwaitingCreatorReveal, 0x0);
    } else { // Return the poor stranger his/her remaining gas
      revert();
    }

    if (keccak256(game.creatorMove) != emptyStringHash && keccak256(game.challengerMove) != emptyStringHash) { // If both players' moves are revealed, determine the winner
      determineWinner(_gameId);
    }
  }

  // If both player's answers are revealed, determine the winner or if it's a tie, and pay out accordingly
  function determineWinner(uint _gameId) internal checkIfPaused() {
    Game storage game = games[_gameId];
    uint totalPrizePool = game.wager.mul(2);
    require(
      keccak256(game.creatorMove) != emptyStringHash &&
      keccak256(game.challengerMove) != emptyStringHash
    );

    /// @dev i.e. moveWinsAgainst['Rock'] returns 'Paper'
    if (keccak256(game.creatorMove) == keccak256(game.challengerMove)) { // If both players tie, refund both players
      game.creator.transfer(game.wager);
      game.challenger.transfer(game.wager);
    } else if (keccak256(moveWinsAgainst[game.creatorMove]) == keccak256(game.challengerMove)) { // The challenger wins
      game.winner = game.challenger;
      game.winner.transfer(totalPrizePool);
    } else if (keccak256(moveWinsAgainst[game.challengerMove]) == keccak256(game.creatorMove)) { // The creator wins
      game.winner = game.creator;
      game.winner.transfer(totalPrizePool);
    } else { // Refund the poor stranger his/her remaining gas
      revert();
    }
    game.status = Status.Finished;
    emit GameUpdates(game.gameId, game.wager, game.creator, game.challenger, Status.Finished, 0x0);
  }

}

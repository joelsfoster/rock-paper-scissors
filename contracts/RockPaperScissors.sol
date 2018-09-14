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
  uint public gameIdCounter = 0;
  uint public minimumWager;
  uint public gameBlockTimeLimit;
  bytes32 internal emptyStringHash = keccak256('');

  // Store user balances, public because the front end needs to update without the user signing a transaction
  mapping (address => uint) public balances;

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

  // Event emitter Helper function
  function emitGameUpdates(uint gameId) internal {
    Game memory game = games[gameId];
    emit GameUpdates(game.gameId, game.wager, game.creator, game.challenger, game.status, game.winner);
  }

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
  constructor() public {
    minimumWager = 5000000000000000; // .005 ETH
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

  // When attempting to reveal your move, first check if the game expired and handle accordingly
  modifier checkGameExpiration(uint _gameId) {
    Game storage game = games[_gameId];
    uint totalPrizePool = game.wager.mul(2);

    // If the game is expired, handle payments then set the status BEFORE payment is issued, to prevent a recursive call attack
    /// @dev The game.gameExpirationBlock is set to 0 at game creation and is changed to the real expiration when a challenger joins
    if (block.number >= game.gameExpirationBlock && game.gameExpirationBlock != 0 && game.status != Status.Expired) {
      game.status = Status.Expired;
      emitGameUpdates(game.gameId);

      // If only the challenger revealed, pay them
      if (
        keccak256(game.creatorMove) == emptyStringHash &&
        keccak256(game.challengerMove) != emptyStringHash
        ) { increaseBalance(game.challenger, totalPrizePool); }

      // If only the creator revealed, pay them
      else if (
        keccak256(game.creatorMove) != emptyStringHash &&
        keccak256(game.challengerMove) == emptyStringHash
        ) { increaseBalance(game.creator, totalPrizePool); }

      // If neither of the players are revealed and the game is expired, refund both players
      else if (
        keccak256(game.creatorMove) == emptyStringHash &&
        keccak256(game.challengerMove) == emptyStringHash
        ) {
        increaseBalance(game.creator, game.wager);
        increaseBalance(game.challenger, game.wager);
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

  // Helper function to increase balance
  function increaseBalance(address _account, uint _amount) internal {
    balances[_account] = balances[_account].add(_amount);
  }

  // Helper function to decrease balance
  function decreaseBalance(address _account, uint _amount) internal {
    balances[_account] = balances[_account].sub(_amount);
  }

  // Players can deposit funds into their balance, fallback function executes this
  function depositFunds() public payable {
    increaseBalance(msg.sender, msg.value);
  }

  // Players can withdraw the specified funds
  function withdrawFunds(uint _amount) public {
    require(balances[msg.sender] >= _amount);
    decreaseBalance(msg.sender, _amount);
    msg.sender.transfer(_amount);
  }

  // Players can create a game by submitting their wager, using a password to encrypt their move
  function createGame(string _move, string _password, uint _wager) public checkIfPaused() validateMove(_move) validatePassword(_password) {
    require(balances[msg.sender] >= _wager);
    decreaseBalance(msg.sender, _wager);
    gameIdCounter = gameIdCounter.add(1); // The first game's ID will be 1
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
    emitGameUpdates(gameIdCounter);
  }

  // Players can cancel their open game and get their wager deposits back
  function cancelGame(uint _gameId) public checkIfPaused() {
    Game storage game = games[_gameId];
    require(
      msg.sender == game.creator &&
      game.status == Status.Open
    );
    game.status = Status.Cancelled;
    emitGameUpdates(game.gameId);
    increaseBalance(game.creator, game.wager); /// @dev Called after state changes to prevent recursive call attacks
  }

  // Opponent can join a open game by submitting his/her entry fee and their encrypted submission
  function joinGame(string _move, string _password, uint _gameId) public checkIfPaused() validateMove(_move) validatePassword(_password) {
    Game storage game = games[_gameId]; // Too bad Solidity doesn't let you define local variables in function arguments like JavaScript
    require(
      game.creator != msg.sender && // You can't challange yourself
      game.status == Status.Open &&
      balances[msg.sender] >= game.wager
    );
    decreaseBalance(msg.sender, game.wager);
    game.status = Status.AwaitingReveals;
    game.challenger = msg.sender;
    game.gameExpirationBlock = block.number.add(gameBlockTimeLimit);
    game.challengerEncryptedMove = keccak256(_move, msg.sender, _password); // Encrypted using the user's password
    emitGameUpdates(game.gameId);
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
      emitGameUpdates(game.gameId);
    } else if (msg.sender == game.challenger) { // If the challenger reveals
      require(game.challengerEncryptedMove == keccak256(_move, msg.sender, _password));
      game.challengerMove = _move;
      game.status = Status.AwaitingCreatorReveal;
      emitGameUpdates(game.gameId);
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
    if (keccak256(game.creatorMove) == keccak256(game.challengerMove)) { // If players tie, refund both players
      increaseBalance(game.creator, game.wager);
      increaseBalance(game.challenger, game.wager);
    } else if (keccak256(moveWinsAgainst[game.creatorMove]) == keccak256(game.challengerMove)) { // The challenger wins
      game.winner = game.challenger;
      increaseBalance(game.winner, totalPrizePool);
    } else if (keccak256(moveWinsAgainst[game.challengerMove]) == keccak256(game.creatorMove)) { // The creator wins
      game.winner = game.creator;
      increaseBalance(game.winner, totalPrizePool);
    } else { // Fallback, refund any remaining gas
      revert();
    }
    game.status = Status.Finished;
    emitGameUpdates(game.gameId);
  }

  function () public payable {
    depositFunds();
  }

}

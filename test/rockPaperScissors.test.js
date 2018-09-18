const RockPaperScissors = artifacts.require('RockPaperScissors');
const web3Utils = require('web3-utils');

contract('RockPaperScissors', async (accounts) => {

    let rockPaperScissors;
    const owner = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];

    /// @dev Before each test, instantiate new contract to avoid exceeding transaction gas limit
    beforeEach(async () => {
      rockPaperScissors = await RockPaperScissors.new();
    });


    /*
    <--- Testing the main contract functions --->
    They're listed in logical sequence, i.e. the game creation
    and game getter functions are needed for subsequent tests.
    */

    /// @dev Testing the circuitBreaker function
    it("should flip the circuit breaker", async () => {
      await rockPaperScissors.circuitBreaker({from: owner});
      const contractPaused = await rockPaperScissors.contractPaused.call();
      const expected = true;
      assert.equal(contractPaused, expected);
    });

    /// @dev Testing the createGame function
    it("should create a new game", async () => {
      const _move = "Rock";
      const _password = "password";
      const _encryptedMove = web3Utils.soliditySha3(_move, alice, _password);
      const _wager = 5000000000000000;
      const _funds = 5000000000000000;

      // Deposit funds, then create game and check that the gameIdCounter has incremented
      await rockPaperScissors.depositFunds({from: alice, value: _funds});
      await rockPaperScissors.createGame(_encryptedMove, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter();
      const expected = 1;
      assert.equal(gameIdCounter, expected);
    });

    /// @dev Testing the games mapping's public getter function
    it("should return details about an individual game", async () => {
      const _move = "Rock";
      const _password = "password";
      const _passwordHash = web3Utils.soliditySha3(_password);
      const _encryptedMove = web3Utils.soliditySha3(_move, alice, _passwordHash);
      const _wager = 5000000000000000;
      const _funds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _funds});
      await rockPaperScissors.createGame(_encryptedMove, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter();
      const gameId = gameIdCounter;

      // After a game is created, retreive its creator
      const game = await rockPaperScissors.games(gameId);
      const creator = game[3];
      const expected = alice;
      assert.equal(creator, expected);
    });

    /// @dev Testing the cancelGame function
    it("should cancel an open game", async () => {
      const _move = "Rock";
      const _password = "password";
      const _passwordHash = web3Utils.soliditySha3(_password);
      const _encryptedMove = web3Utils.soliditySha3(_move, alice, _passwordHash);
      const _wager = 5000000000000000;
      const _funds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _funds});
      await rockPaperScissors.createGame(_encryptedMove, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter;

      // After a game is created, cancel it, then verify its status is cancelled
      await rockPaperScissors.cancelGame(_gameId, {from: alice});
      const game = await rockPaperScissors.games(_gameId);
      const gameStatus = game[10];
      const expected = 1; // Status[1] == Status.Cancelled
      assert.equal(gameStatus, expected);
    });

    /// @dev Testing web3.utils.soliditySha3()
    it("should encrypt players' moves correctly", async () => {
      const _move = "Rock";
      const _password = "password";
      const _passwordHash = web3Utils.soliditySha3(_password);
      const _encryptedMove = web3Utils.soliditySha3(_move, alice, _passwordHash);
      const _wager = 5000000000000000;
      const _funds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _funds});
      await rockPaperScissors.createGame(_encryptedMove, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter();
      const gameId = gameIdCounter;

      // Ensure encrypted move in storage matches original submission
      const game = await rockPaperScissors.games(gameId);
      const encryptedMove = game[6];
      const expected = _encryptedMove;
      assert.equal(encryptedMove, expected);
    });

    /// @dev Testing the joinGame function
    it("should allow a challenger to join an open game", async () => {
      const _creatorMove = "Rock";
      const _creatorPassword = "password";
      const _creatorPasswordHash = web3Utils.soliditySha3(_creatorPassword);
      const _encryptedCreatorMove = web3Utils.soliditySha3(_creatorMove, alice, _creatorPasswordHash);
      const _challengerMove = "Paper";
      const _challengerPassword = "123";
      const _challengerPasswordHash = web3Utils.soliditySha3(_challengerPassword);
      const _encryptedChallengerMove = web3Utils.soliditySha3(_challengerMove, bob, _challengerPasswordHash);
      const _wager = 5000000000000000;
      const _creatorFunds = 5000000000000000;
      const _challengerFunds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _creatorFunds});
      await rockPaperScissors.createGame(_encryptedCreatorMove, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter;

      // After a game is created, join it using a different address, and verify by retrieving the challengers address
      await rockPaperScissors.depositFunds({from: bob, value: _challengerFunds});
      await rockPaperScissors.joinGame(_encryptedChallengerMove, _gameId, {from: bob});
      const game = await rockPaperScissors.games(_gameId);
      const challenger = game[4];
      const expected = bob;
      assert.equal(challenger, expected);
    });

    /// @dev Testing the revealMove function
    it("should allow players to reveal their moves", async () => {
      const _creatorMove = "Rock";
      const _creatorPassword = "password";
      const _creatorPasswordHash = web3Utils.soliditySha3(_creatorPassword);
      const _encryptedCreatorMove = web3Utils.soliditySha3(_creatorMove, alice, _creatorPasswordHash);
      const _challengerMove = "Paper";
      const _challengerPassword = "123";
      const _challengerPasswordHash = web3Utils.soliditySha3(_challengerPassword);
      const _encryptedChallengerMove = web3Utils.soliditySha3(_challengerMove, bob, _challengerPasswordHash);
      const _wager = 5000000000000000;
      const _creatorFunds = 5000000000000000;
      const _challengerFunds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _creatorFunds});
      await rockPaperScissors.createGame(_encryptedCreatorMove, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter;

      // After the game is created, challenger joins game
      await rockPaperScissors.depositFunds({from: bob, value: _challengerFunds});
      await rockPaperScissors.joinGame(_encryptedChallengerMove, _gameId, {from: bob});

      // Both players reveal moves
      await rockPaperScissors.revealMove(_creatorMove, _creatorPasswordHash, _gameId, {from: alice});
      await rockPaperScissors.revealMove(_challengerMove, _challengerPasswordHash, _gameId, {from: bob});
      const game = await rockPaperScissors.games(_gameId);
      const winner = game[5];
      const expected = bob;
      assert.equal(winner, expected);
    });

});

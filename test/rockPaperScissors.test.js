const RockPaperScissors = artifacts.require('RockPaperScissors');


contract('RockPaperScissors', async (accounts) => {

    let rockPaperScissors;
    const owner = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];

    /// @dev Before each test, instantiate new contract with constructor variable (to avoid running out of gas)
    beforeEach(async () => {
      rockPaperScissors = await RockPaperScissors.new(5000000000000000); // minimumWager (in wei)
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
      const _wager = 5000000000000000;
      const _funds = 5000000000000000;

      // Deposit funds, then create game and check that the gameIdCounter has incremented
      await rockPaperScissors.depositFunds({from: alice, value: _funds});
      await rockPaperScissors.createGame(_move, _password, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter();
      const expected = 1;
      assert.equal(gameIdCounter, expected);
    });

    /// @dev Testing the games mapping's public getter function
    it("should return details about an individual game", async () => {
      const _move = "Rock";
      const _password = "password";
      const _wager = 5000000000000000;
      const _funds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _funds});
      await rockPaperScissors.createGame(_move, _password, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter();
      const gameId = gameIdCounter;

      // After a game is created, retreive its creator
      const game = await rockPaperScissors.games(gameId);
      const creator = game[3]; // The 4th item returned in the array
      const expected = alice;
      assert.equal(creator, expected);
    });

    /// @dev Testing the cancelGame function
    it("should cancel an open game", async () => {
      const _move = "Rock";
      const _password = "password";
      const _wager = 5000000000000000;
      const _funds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _funds});
      await rockPaperScissors.createGame(_move, _password, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter;

      // After a game is created, cancel it, then verify its status is cancelled
      await rockPaperScissors.cancelGame(_gameId, {from: alice});
      const game = await rockPaperScissors.games(_gameId);
      const gameStatus = game[10]; // The 11th item returned in the array
      const expected = 1; // Status[1] == Status.Cancelled
      assert.equal(gameStatus, expected);
    });

    /// @dev Testing the joinGame function
    it("should allow a challenger to join an open game", async () => {
      const _creatorMove = "Rock";
      const _challengerMove = "Paper";
      const _creatorPassword = "password";
      const _challengerPassword = "123";
      const _wager = 5000000000000000;
      const _creatorFunds = 5000000000000000;
      const _challengerFunds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _creatorFunds});
      await rockPaperScissors.createGame(_creatorMove, _creatorPassword, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter;

      // After a game is created, join it using a different address, and verify by retrieving the challengers address
      await rockPaperScissors.depositFunds({from: bob, value: _challengerFunds});
      await rockPaperScissors.joinGame(_challengerMove, _challengerPassword, _gameId, {from: bob});
      const game = await rockPaperScissors.games(_gameId);
      const challenger = game[4]; // The 5th item returned in the array
      const expected = bob;
      assert.equal(challenger, expected);
    });

    /// @dev Testing the revealMove function
    it("should allow a player to reveal their moves", async () => {
      const _creatorMove = "Rock";
      const _challengerMove = "Paper";
      const _creatorPassword = "password";
      const _challengerPassword = "123";
      const _wager = 5000000000000000;
      const _creatorFunds = 5000000000000000;
      const _challengerFunds = 5000000000000000;

      await rockPaperScissors.depositFunds({from: alice, value: _creatorFunds});
      await rockPaperScissors.createGame(_creatorMove, _creatorPassword, _wager, {from: alice});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter;

      // After the game is created and joined, the challenger reveals his move, then verify by retrieving it
      await rockPaperScissors.depositFunds({from: bob, value: _challengerFunds});
      await rockPaperScissors.joinGame(_challengerMove, _challengerPassword, _gameId, {from: bob});
      await rockPaperScissors.revealMove(_challengerMove, _challengerPassword, _gameId, {from: bob});
      const game = await rockPaperScissors.games(_gameId);
      const challengerMove = game[9]; // The 10th item returned in the array
      const expected = _challengerMove;
      assert.equal(challengerMove, expected);
    });

});

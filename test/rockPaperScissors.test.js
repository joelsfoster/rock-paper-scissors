const RockPaperScissors = artifacts.require('RockPaperScissors');


contract('RockPaperScissors', async (accounts) => {

    let rockPaperScissors;
    const owner = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];

    /// @dev Before each test, instantiate new contract with constructor variable (to avoid running out of gas)
    beforeEach(async () => {
      rockPaperScissors = await RockPaperScissors.new(5000000000000000);
    });

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
      const _msgvalue = 5000000000000000;

      // Create game and check that the gameIdCounter has incremented
      await rockPaperScissors.createGame(_move, _password, _wager, {from: alice, value: _msgvalue});
      const gameIdCounter = await rockPaperScissors.gameIdCounter();
      const expected = 1;
      assert.equal(gameIdCounter, expected);
    });

    /// @dev Testing the games mapping's public getter function
    it("should return details about an individual game", async () => {
      const _move = "Rock";
      const _password = "password";
      const _wager = 5000000000000000;
      const _msgvalue = 5000000000000000;

      await rockPaperScissors.createGame(_move, _password, _wager, {from: alice, value: _msgvalue});
      const gameIdCounter = await rockPaperScissors.gameIdCounter();
      const gameId = gameIdCounter - 1;

      // After a game is created, retreive its creator
      const game = await rockPaperScissors.games(0);
      const creator = game[3]; // The 4th item returned in the array
      const expected = alice;
      assert.equal(creator, expected);
    });

    /// @dev Testing the cancelGame function
    it("should cancel an open game", async () => {
      const _move = "Rock";
      const _password = "password";
      const _wager = 5000000000000000;
      const _msgvalue = 5000000000000000;

      await rockPaperScissors.createGame(_move, _password, _wager, {from: alice, value: _msgvalue});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter - 1;

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
      const _creatorMsgvalue = 5000000000000000;
      const _challengerMsgvalue = 5000000000000000;

      await rockPaperScissors.createGame(_creatorMove, _creatorPassword, _wager, {from: alice, value: _creatorMsgvalue});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter - 1;

      // After a game is created, join it using a different address, and verify by retrieving the challengers address
      await rockPaperScissors.joinGame(_gameId, _challengerMove, _challengerPassword, {from: bob, value: _challengerMsgvalue});
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
      const _creatorMsgvalue = 5000000000000000;
      const _challengerMsgvalue = 5000000000000000;

      await rockPaperScissors.createGame(_creatorMove, _creatorPassword, _wager, {from: alice, value: _creatorMsgvalue});
      const gameIdCounter = await rockPaperScissors.gameIdCounter.call();
      const _gameId = gameIdCounter - 1;

      // After the game is created and joined, the challenger reveals his move, then verify by retrieving it
      await rockPaperScissors.joinGame(_gameId, _challengerMove, _challengerPassword, {from: bob, value: _challengerMsgvalue});
      await rockPaperScissors.revealMove(_gameId, _challengerMove, _challengerPassword, {from: bob});
      const game = await rockPaperScissors.games(_gameId);
      const challengerMove = game[9]; // The 10th item returned in the array
      const expected = _challengerMove;
      assert.equal(challengerMove, expected);
    });

});

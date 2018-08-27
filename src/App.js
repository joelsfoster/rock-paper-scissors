/* eslint-disable */

import React, { Component } from 'react';
import RockPaperScissorsContract from '../build/contracts/RockPaperScissors.json';
import getWeb3 from './utils/getWeb3';
// import NewGameField from './components/NewGameField';

import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './App.css';

class App extends Component {


  /*
  <-- App State -->
  */

  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      contract: null, // This is the object containing the methods that can be called
      contractAddress: null,
      minimumWager: null,
      account: null,
      balance: null,
      wager: null, // In ETH
      wagerInWei: null,
      newGameMove: "Rock", // "Rock" by default
      newGamePassword: null,
      cancelGameId: null,
      joinGameId: null,
      joinGameMove: "Rock", // "Rock" by default
      joinGamePassword: null,
      revealMove: "Rock", // "Rock" by default
      revealMovePassword: null,
      revealMoveGameId: null,
      availableGames: [], // All open games where the user is not the creator
      myGames: [] // All games where the user is/was either the creator or challenger
    };

    this.gameStatusReference = {
      0: "Open",
      1: "Cancelled",
      2: "Awaiting Reveals",
      3: "Awaiting Creator Reveal",
      4: "Awaiting Challenger Reveal",
      5: "Finished",
      6: "Expired"
    }
  }


  /*
  <-- On page load -->
  */

  // Check for a web3 instance and network provider, see './utils/getWeb3' for info
  componentWillMount() {
    getWeb3
    .then(results => {
      this.setState({ web3: results.web3 });
      this.instantiateContract(); // Instantiate contract once web3 provided.
    })
    .catch(() => {
      console.log('Error finding web3.');
    });
  }

  // Once a web3 instance is detected in the browser, mount the contract ABI
  instantiateContract() {
    const contract = require('truffle-contract');
    const rockPaperScissors = contract(RockPaperScissorsContract);
    rockPaperScissors.setProvider(this.state.web3.currentProvider); // Point to the contract ABI json

    // When contract is instantiated, get the account and the minimumWager
    this.state.web3.eth.getAccounts((error, accounts) => {
      rockPaperScissors.deployed().then((instance) => {
        this.setState({ contract: instance, contractAddress: instance.address, account: accounts[0] });
        this.getMinimumWager();

        // Then set an event listener for open games to join (where user is not the creator)
      }).then((result) => {
        this.state.contract.GameUpdates({status: 0}, {fromBlock: 0, toBlock: 'latest'})
        .watch((error, result) => {
          const data = result.args;
          const game = {
            gameId: data.gameId.c[0],
            wager: this.state.web3.fromWei(data.wager, 'ether').c[0], // Converting BigNumber wei into number eth
            creator: data.creator,
            challenger: data.challenger,
            status: data.status.c[0],
            winner: data.winner
          }

          if (game.creator !== this.state.account) {
            this.updateGameArray(game, this.state.availableGames, "availableGames");
          }
        });

        // Then set event listeners to grab game history
        /// @dev Unfortunately, logical operators (i.e. $OR) are not supported, so sadly there are two listeners
      }).then((error, result) => {

        // Where the user created a game
        this.state.contract.GameUpdates({creator: this.state.account}, {fromBlock: 0, toBlock: 'latest'})
        .watch((error, result) => {
          const data = result.args;
          const game = {
            gameId: data.gameId.c[0],
            wager: this.state.web3.fromWei(data.wager, 'ether').c[0], // Converting BigNumber wei into number eth
            creator: data.creator,
            challenger: data.challenger,
            status: data.status.c[0],
            winner: data.winner
          }
          this.updateGameArray(game, this.state.myGames, "myGames");
        });

        // Where the user joined a game
        this.state.contract.GameUpdates({challenger: this.state.account}, {fromBlock: 0, toBlock: 'latest'})
        .watch((error, result) => {
          const data = result.args;
          const game = {
            gameId: data.gameId.c[0],
            wager: this.state.web3.fromWei(data.wager, 'ether').c[0], // Converting BigNumber wei into number eth
            creator: data.creator,
            challenger: data.challenger,
            status: data.status.c[0],
            winner: data.winner
          }
          this.updateGameArray(game, this.state.myGames, "myGames");
        });

        // Then get the balance for this account
      }).then((error, result) => {
        this.getBalance();

        // Lastly, monitor if the account has changed, and refresh state if so
      }).then((error, result) => {
        setInterval( () => {
          const currentAccount = this.state.web3.eth.accounts[0];
          if (currentAccount !== this.state.account) {
            this.setState({ account: currentAccount });
            window.location.reload(); /// @dev Important because it resets the event listeners by reloading the App component!!!
          }
        }, 100);
      });
    });
  }


  /*
  <-- Utils, state refresher functions, and UI loaders -->
  */

  // Replaces stale event data, such as when a game is created then cancelled in the same session
  /// @params game is the game object
  /// @params i.e. array = this.state.availableGames
  /// @params i.e. stateObject = "availableGames"
  updateGameArray(game, stateArray, stateObject) {
    let index = 0;
    stateArray.map(currentGame => { // Loop through the array and delete stale data
      if (currentGame.gameId == game.gameId) {
        stateArray.splice(index, 1); // Delete from array
      }
      return index++;
    });

    // Add the new game to the cleaned array and set the state to the cleaned, updated array
    const newArray = stateArray.concat(game);
    const updatedStateObject = { [stateObject]: newArray };
    this.setState(updatedStateObject);
  }

  getMinimumWager() {
    this.state.contract.minimumWager.call(this.state.account)
    .then((result) => {
      const minimumWagerInWei = result.toNumber();
      const minimumWagerInEth = this.state.web3.fromWei(minimumWagerInWei, 'ether');
      this.setState({ minimumWager: minimumWagerInEth });
    });
  }

  getBalance() {
    this.state.web3.eth.getBalance(this.state.account, (error, result) => {
      const balanceInWei = result.toNumber();
      const balanceInEth = this.state.web3.fromWei(balanceInWei, 'ether');
      this.setState({ balance: balanceInEth });
    });
  }

  handleNewGameMoveChange(event) {
    this.setState({newGameMove: event.target.value});
  }

  handleNewGamePasswordChange(event) {
    this.setState({newGamePassword: event.target.value});
  }

  handleWagerChange(event) {
    this.setState({wager: event.target.value});
    const wagerInWei = this.state.web3.toWei(event.target.value);
    this.setState({wagerInWei: wagerInWei});
  }

  handleCancelGameIdChange(event) {
    this.setState({cancelGameId: event.target.value});
  }

  handleJoinGameMoveChange(event) {
    this.setState({joinGameMove: event.target.value});
  }

  handleJoinGamePasswordChange(event) {
    this.setState({joinGamePassword: event.target.value});
  }

  handleJoinGameIdChange(event) {
    this.setState({joinGameId: event.target.value});
  }

  handleRevealMoveChange(event) {
    this.setState({revealMove: event.target.value});
  }

  handleRevealMovePasswordChange(event) {
    this.setState({revealMovePassword: event.target.value});
  }

  handleRevealMoveGameIdChange(event) {
    this.setState({revealMoveGameId: event.target.value});
  }

  renderAvailableGames() {
    return this.state.availableGames.map(game => {
      return (
        <div key={game.gameId}>
          <p>Game ID: {game.gameId} | Wager: {game.wager} ETH | Creator: {game.creator}</p>
        </div>
      )
    });
  }

  renderMyGames() {
    return this.state.myGames.map(game => {
      return (
        <div key={game.gameId}>
          <p>
            Game ID: {game.gameId}<br/>
            Wager: {game.wager} ETH<br/>
            Status: {this.gameStatusReference[game.status]}<br/>
            Creator: {game.creator}<br/>
            Challenger: {game.challenger == "0x0000000000000000000000000000000000000000" ? "" : game.challenger}<br/>
            Winner: {game.winner == "0x0000000000000000000000000000000000000000" ? "" : game.winner}
          </p>
        </div>
      )
    });
  }


  /*
  <-- Game action functions -->
  */

  handleNewGame(event) {
    event.preventDefault();
    this.state.contract.createGame(this.state.newGameMove, this.state.newGamePassword, this.state.wagerInWei, {from: this.state.account, value: this.state.wagerInWei})
    .then((error, result) => {
      console.log("Game created");
      // Can implement front end message "Transaction successful! Waiting for the block to be mined..."
    });
  }

  handleCancelGame(event) {
    event.preventDefault();
    this.state.contract.cancelGame(this.state.cancelGameId, {from: this.state.account})
    .then((error, result) => {
      console.log("Game cancelled");
      // Can implement front end message "Transaction successful! Waiting for the block to be mined..."
    });
  }

  handleJoinGame(event) {
    event.preventDefault();
    let wager;
    this.state.availableGames.map(game => { // Find the game's wager by looking in the availableGames array
      if (game.gameId == this.state.joinGameId) {
        wager = game.wager;
        return null;
      }
      return null;
    });

    const wagerInWei = this.state.web3.toWei(wager, 'ether');
    this.state.contract.joinGame(this.state.joinGameMove, this.state.joinGamePassword, this.state.joinGameId, {from: this.state.account, value: wagerInWei})
    .then((error, result) => {
      console.log("Game joined");
      // Can implement front end message "Transaction successful! Waiting for the block to be mined..."
    });
  }

  handleRevealMove(event) {
    event.preventDefault();
    this.state.contract.revealMove(this.state.revealMove, this.state.revealMovePassword, this.state.revealMoveGameId, {from: this.state.account})
    .then((error, result) => {
      console.log("Move revealed");
      // Can implement front end message "Transaction successful! Waiting for the block to be mined..."
    });
  }


  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Rock Paper Scissors</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <div className="intro">
              <h1>Rock Paper Scissors</h1>
                <p>
                  Win money from strangers! This blockchain-based rock-paper-scissors game is provably fair and guarantees immediate payouts.
                  See the code <a href='https://github.com/joelsfoster/rock-paper-scissors'>here</a>.
                </p>
              </div>

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

              <div className="info">
                <p>Your ETH balance and address: {this.state.balance} ETH | {this.state.account}</p>
                <p>
                  This game's contract is deployed at: {this.state.contractAddress}
                  <br/><i>(Ensure this address matches your MetaMask's "send transaction" confirmations!)</i>
                </p>
              </div>

              <div className="new-game">
                <h3>Create New Game</h3>
                <p>Minimum wager: {this.state.minimumWager} ETH</p>
                <form>
                  <select onChange={this.handleNewGameMoveChange.bind(this)}>
                    <option value="Rock">Rock</option>
                    <option value="Paper">Paper</option>
                    <option value="Scissors">Scissors</option>
                  </select>
                  <input type="password" name="password" placeholder="Password" value={this.state.newGamePassword ? this.state.newGamePassword : ""} onChange={this.handleNewGamePasswordChange.bind(this)} />
                  <input type="text" name="wager" placeholder="Wager (in ETH)" value={this.state.wager ? this.state.wager : ""} onChange={this.handleWagerChange.bind(this)} />
                  <button onClick={this.handleNewGame.bind(this)}>Create Game</button>
                </form>
              </div>

              <hr style={{ color: "lightgrey", backgroundColor: "lightgrey", height: .1 }}/>

              <div className="available-games">
                <h3>Available Games</h3>
                {this.renderAvailableGames()}
              </div>

              <div className="join-game">
                <h3>Join Game</h3>
                <form>
                  <select onChange={this.handleJoinGameMoveChange.bind(this)}>
                    <option value="Rock">Rock</option>
                    <option value="Paper">Paper</option>
                    <option value="Scissors">Scissors</option>
                  </select>
                  <input type="password" name="password" placeholder="Password" value={this.state.joinGamePassword ? this.state.joinGamePassword : ""} onChange={this.handleJoinGamePasswordChange.bind(this)} />
                  <input type="text" name="gameId" placeholder="Game ID" value={this.state.joinGameId ? this.state.joinGameId : ""} onChange={this.handleJoinGameIdChange.bind(this)} />
                  <button onClick={this.handleJoinGame.bind(this)}>Join Game</button>
                </form>
              </div>

              <hr style={{ color: "lightgrey", backgroundColor: "lightgrey", height: .1 }}/>

              <div className="my-games">
                <h3>My Games</h3>
                {this.renderMyGames()}
              </div>

              <div className="reveal-move">
                <h3>Reveal Move</h3>
                <form>
                  <select onChange={this.handleRevealMoveChange.bind(this)}>
                    <option value="Rock">Rock</option>
                    <option value="Paper">Paper</option>
                    <option value="Scissors">Scissors</option>
                  </select>
                  <input type="password" name="password" placeholder="Password" value={this.state.revealMovePassword ? this.state.revealMovePassword : ""} onChange={this.handleRevealMovePasswordChange.bind(this)} />
                  <input type="text" name="gameId" placeholder="Game ID" value={this.state.revealMoveGameId ? this.state.revealMoveGameId : ""} onChange={this.handleRevealMoveGameIdChange.bind(this)} />
                  <button onClick={this.handleRevealMove.bind(this)}>Reveal Move</button>
                </form>
              </div>

              <div className="cancel-game">
                <h3>Cancel Open Game</h3>
                <form>
                  <input type="text" name="gameId" placeholder="Game ID" value={this.state.cancelGameId ? this.state.cancelGameId : ""} onChange={this.handleCancelGameIdChange.bind(this)} />
                  <button onClick={this.handleCancelGame.bind(this)}>Cancel Game</button>
                </form>
              </div>

            </div>
          </div>
        </main>
      </div>
    );
  }
}


export default App;

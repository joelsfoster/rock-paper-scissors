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
      newGameMove: "Rock", // "Rock" by default
      newGamePassword: null,
      joinGameId: null,
      joinGameMove: "Rock", // "Rock" by default
      joinGamePassword: null,
      availableGames: [], // All open games where the user is not the creator
      myGames: [] // All games where the user is/was either the creator or challenger
    };
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
            let newAvailableGamesArray = this.state.availableGames.concat(game); // Add the new game to a temporary array
            this.setState({ availableGames: newAvailableGamesArray }); // Replace the state with the new array
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
          let newMyGamesArray = this.state.myGames.concat(game); // Add the new game to a temporary array
          this.setState({ myGames: newMyGamesArray }); // Replace the state with the new array
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
          let newMyGamesArray = this.state.myGames.concat(game); // Add the new game to a temporary array
          this.setState({ myGames: newMyGamesArray }); // Replace the state with the new array
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
  <-- State refresher functions and UI loaders -->
  */

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

  handleWagerChange(event) {
    this.setState({wager: event.target.value});
    const wagerInWei = this.state.web3.toWei(event.target.value);
    this.setState({wagerInWei: wagerInWei});
  }

  handleNewGameMoveChange(event) {
    this.setState({newGameMove: event.target.value});
  }

  handleNewGamePasswordChange(event) {
    this.setState({newGamePassword: event.target.value});
  }

  handleJoinGameIdChange(event) {
    this.setState({joinGameId: event.target.value});
  }

  handleJoinGameMoveChange(event) {
    this.setState({newGameMove: event.target.value});
  }

  handleJoinGamePasswordChange(event) {
    this.setState({joinGamePassword: event.target.value});
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
            Status: {game.status}<br/>
            Creator: {game.creator}<br/>
            Challenger: {game.challenger}<br/>
            Winner: {game.winner}
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
    .then((result) => {
      console.log("Game created");
    });
  }

  handleJoinGame(event) {
    event.preventDefault();
    // Find the game's wager by looking in the availableGames array
    let wager;
    this.state.availableGames.map(game => {
      // eslint-disable-next-line
      if (game.gameId == this.state.joinGameId) {
        wager = game.wager;
        console.log("1st", wager);
        return null;
      }
      return null;
    });

    const wagerInWei = this.state.web3.toWei(wager, 'ether');
    this.state.contract.joinGame(this.state.joinGameMove, this.state.joinGamePassword, this.state.joinGameId, {from: this.state.account, value: wagerInWei})
    .then((result) => {
      console.log("Game joined");
    });
  }


  // Ability to reveal moves in ongoing games
  // Status translator in "my games"
  // Empty states for Challenger and Winner
  // Add loading GIF



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
                  Win money from strangers! This blockchain-based rock-paper-scissors game is provably fair and guarantees payouts!
                  See the code <a href='https://github.com/joelsfoster/rock-paper-scissors'>here</a>.
                </p>
              </div>

              <div className="rules">
                <h2>Rules</h2>
                <ol>
                  <li>Create a game by setting a wager. If you win, your opponent will pay you that wager. If you lose, you'll pay them.</li>
                  <li>You and your opponent each submit a password-encrypted move (rock, paper, or scissors) that no human or computer is capable of reverse-encrypting.</li>
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
                  <button onClick={this.handleNewGame.bind(this)}>Create</button>
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
                  <button onClick={this.handleJoinGame.bind(this)}>Join</button>
                </form>
              </div>

              <hr style={{ color: "lightgrey", backgroundColor: "lightgrey", height: .1 }}/>

              <div className="my-games">
                <h3>My Games</h3>
                {this.renderMyGames()}
              </div>

            </div>
          </div>
        </main>
      </div>
    );
  }
}


export default App;

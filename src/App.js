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
      wager: null,
      newGameMove: "Rock", // "Rock" by default
      newGamePassword: null,
      joinGameId: null,
      joinGameMove: "Rock", // "Rock" by default
      joinGamePassword: null,
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
      }).then((result) => {

        // Set event listeners to grab game history
        this.state.contract.GameUpdates({creator: this.state.account}, {fromBlock: 0, toBlock: 'latest'})
        .watch((error, result) => {

          const data = result.args;
          const game = {
            gameId: data.gameId.c[0],
            creator: data.creator,
            challenger: data.challenger,
            status: data.status.c[0]
          };

          let newMyGamesArray = this.state.myGames.concat(game);
          this.setState({ myGames: newMyGamesArray });

        });

        this.refreshBalance(); // Lastly, get the balance for this account
      });

      // Constantly be checking if the account has changed, and refresh state if so
      setInterval( () => {
        const currentAccount = this.state.web3.eth.accounts[0];
        if (currentAccount !== this.state.account) {
          this.setState({ account: currentAccount });
          window.location.reload();
        }
      }, 100);
    });
  }


  /*
  <-- State refresher functions -->
  */

  getMinimumWager() {
    this.state.contract.minimumWager.call(this.state.account)
    .then((result) => {
      const minimumWagerInWei = result.toNumber();
      const minimumWagerInEth = this.state.web3.fromWei(minimumWagerInWei, 'ether');
      this.setState({ minimumWager: minimumWagerInEth });
    });
  }

  refreshBalance() {
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


  /*
  <-- Game action functions -->
  */

  handleNewGame(event) {
    this.state.contract.createGame(this.state.newGameMove, this.state.newGamePassword, this.state.wagerInWei, {from: this.state.account, value: this.state.wagerInWei})
    .then((result) => {
      console.log("Game created");
    });
    event.preventDefault();
  }


  // "Tab" window for New Game, Join Game, My Games (with Cancel Game button), Reveal Move
  // Ability to join game by by entering in UI fields and sending ether
  // Ability to look at ongoing and finished games
  // Ability to reveal moves in ongoing games

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
                <p>Win money from strangers! This blockchain-based rock-paper-scissors game is provably fair and guarantees payouts!</p>
                <p>See the code <a href='https://github.com/joelsfoster/rock-paper-scissors'>here</a>.</p>
              </div>

              <div className="rules">
                <h2>Rules</h2>
                <ol>
                  <li>Create a game by setting a wager. If you win, your opponent will pay you that wager. If you lose, you'll pay them.</li>
                  <li>You and your opponent each submit a password-encrypted move (rock, paper, or scissors) that no human or computer is capable of reverse-encrypting.</li>
                  <li>Once both players submit their moves, your wagers are locked in the game.</li>
                  <li>Both players must re-submit their password-encrypted move to reveal that it matches their original move.</li>
                  <li>You have 24 hours to complete the game.</li>
                  <li>If only one player has revealed their move by the game's expiration, they automatically win regardless of their opponent's move.</li>
                  <li>If neither player reveals their move, or if both players reveal a tie, both players will get their wagers back.</li>
                  <li>If you created a game and no one joins it, you can always cancel that game and get your wager back.</li>
                </ol>
              </div>

              <div className="info">
                <p>The address you are playing with is: {this.state.account}</p>
                <p>Your ETH balance is: {this.state.balance} ETH</p>
                <p>This game's contract is deployed at: {this.state.contractAddress}<br/><i>Ensure this address matches your MetaMask's "send transaction" confirmations!</i></p>
                <p>Minimum wager: {this.state.minimumWager} ETH</p>
              </div>

              <div className="new-game">
                <form>
                  <input type="text" name="wager" placeholder="Wager (in ETH)" value={this.state.wager ? this.state.wager : ""} onChange={this.handleWagerChange.bind(this)} />
                  <select onChange={this.handleNewGameMoveChange.bind(this)}>
                    <option value="Rock">Rock</option>
                    <option value="Paper">Paper</option>
                    <option value="Scissors">Scissors</option>
                  </select>
                  <input type="password" name="password" placeholder="Password" value={this.state.newGamePassword ? this.state.newGamePassword : ""} onChange={this.handleNewGamePasswordChange.bind(this)} />
                  <button onClick={this.handleNewGame.bind(this)}>New Game</button>
                </form>
              </div>

              <div className="join-game">
                <form>
                  <input type="text" name="gameId" placeholder="Game ID" value={this.state.joinGameId ? this.state.joinGameId : ""} onChange={this.handleJoinGameIdChange.bind(this)} />
                  <select onChange={this.handleJoinGameMoveChange.bind(this)}>
                    <option value="Rock">Rock</option>
                    <option value="Paper">Paper</option>
                    <option value="Scissors">Scissors</option>
                  </select>
                  <input type="password" name="password" placeholder="Password" value={this.state.joinGamePassword ? this.state.joinGamePassword : ""} onChange={this.handleJoinGamePasswordChange.bind(this)} />
                  <button onClick={this.handleNewGame.bind(this)}>Join Game</button>
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

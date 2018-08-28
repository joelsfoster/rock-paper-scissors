/* eslint-disable */

import React, { Component } from 'react';
import RockPaperScissorsContract from '../build/contracts/RockPaperScissors.json';
import getWeb3 from './utils/getWeb3';

import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './App.css';
import Intro from './components/Intro';
import Rules from './components/Rules';
import Info from './components/Info';
import NewGame from './components/NewGame';
import CancelGame from './components/CancelGame';
import JoinGame from './components/JoinGame';
import RevealMove from './components/RevealMove';
import DividerLine from './components/DividerLine';
import AvailableGames from './components/AvailableGames';
import MyGames from './components/MyGames';


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
      newGameMove: "Rock",
      newGamePassword: null,
      cancelGameId: null,
      joinGameId: null,
      joinGameMove: "Rock",
      joinGamePassword: null,
      revealMove: "Rock",
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
            wager: this.state.web3.fromWei(data.wager, 'ether').toNumber(), // BigNumber wei -> BigNumber eth -> Number eth
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
            wager: this.state.web3.fromWei(data.wager, 'ether').toNumber(), // BigNumber wei -> BigNumber eth -> Number eth
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
            wager: this.state.web3.fromWei(data.wager, 'ether').toNumber(), // BigNumber wei -> BigNumber eth -> Number eth
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
            Winner: {this.displayWinner(game)}
          </p>
        </div>
      )
    });
  }

  displayWinner(game) {
    if (game.winner == "0x0000000000000000000000000000000000000000" && game.status == 5) { return "Tie" }
    else if (game.winner == "0x0000000000000000000000000000000000000000") { return "" }
    else { return game.winner }
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


  /*
  <-- Render the app -->
  */


  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Rock Paper Scissors</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <Intro />
              <Rules />
              <Info
                balance={this.state.balance}
                account={this.state.account}
                contractAddress={this.state.contractAddress}
              />
              <NewGame
                minimumWager={this.state.minimumWager}
                wager={this.state.wager}
                newGamePassword={this.state.newGamePassword}
                handleNewGameMoveChange={this.handleNewGameMoveChange.bind(this)}
                handleNewGamePasswordChange={this.handleNewGamePasswordChange.bind(this)}
                handleWagerChange={this.handleWagerChange.bind(this)}
                handleNewGame={this.handleNewGame.bind(this)}
              />
              <DividerLine />
              <AvailableGames renderAvailableGames={this.renderAvailableGames()}/>
              <JoinGame
                joinGamePassword={this.state.joinGamePassword}
                joinGameId={this.state.joinGameId}
                handleJoinGameMoveChange={this.handleJoinGameMoveChange.bind(this)}
                handleJoinGamePasswordChange={this.handleJoinGamePasswordChange.bind(this)}
                handleJoinGameIdChange={this.handleJoinGameIdChange.bind(this)}
                handleJoinGame={this.handleJoinGame.bind(this)}
              />
              <DividerLine />
              <MyGames renderMyGames={this.renderMyGames()}/>
              <RevealMove
                revealMovePassword={this.state.revealMovePassword}
                revealMoveGameId={this.state.revealMoveGameId}
                handleRevealMoveChange={this.handleRevealMoveChange.bind(this)}
                handleRevealMovePasswordChange={this.handleRevealMovePasswordChange.bind(this)}
                handleRevealMoveGameIdChange={this.handleRevealMoveGameIdChange.bind(this)}
                handleRevealMove={this.handleRevealMove.bind(this)}
              />
              <CancelGame
                cancelGameId={this.state.cancelGameId}
                handleCancelGameIdChange={this.handleCancelGameIdChange.bind(this)}
                handleCancelGame={this.handleCancelGame.bind(this)}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }
}


export default App;

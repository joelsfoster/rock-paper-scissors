/* eslint-disable */

import React, { Component } from 'react';
import RockPaperScissorsContract from '../build/contracts/RockPaperScissors.json';
import getWeb3 from './utils/getWeb3';
import web3Utils from 'web3-utils'; /* Needed because if I try to upgrade to
                                     * web3@1.0 I get tons of cryptic errors.
                                     * Needed for the soliditySha3() method because
                                     * older versions of web3 use the sha3() method,
                                     * which doesn't do what Solidity does in keccak256()
                                     */

import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './App.css';
import Intro from './components/Intro';
import Rules from './components/Rules';
import Balance from './components/Balance';
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
      accountBalance: null,
      gameBalance: null,
      deposit: null,
      withdraw: null,
      wager: null,
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
  <-- On page load / app initialization -->
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
      })

      // Then set an event listener to track game updates
      .then( (response) => {
        this.state.contract.GameUpdates({}, {fromBlock: 0, toBlock: 'latest'})
        .watch((error, result) => {
          const data = result.args;
          const game = {
            gameId: data.gameId.c[0],
            wager: this.convertToEther(data.wager).toNumber(),
            creator: data.creator,
            challenger: data.challenger,
            status: data.status.c[0],
            winner: data.winner
          }

          this.updateGamesData(game);
        });
      })

      // Watch for differences or changes between account and/or in-game balances, and refresh state if so
      .then( (response) => {
        setInterval( () => {
          this.state.web3.eth.getBalance(this.state.account, (error, result) => {
            const currentBalance = this.convertToEther(result).toNumber();

            if (currentBalance !== this.state.accountBalance) { // On the first pass, this will be [number] !== null
              this.updateBalances();
            }
          })
        }, 100);
      })

      // Lastly, monitor if the account has changed, and refresh state if so
      .then( (response) => {
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
  <-- Utils and state refresher functions -->
  */

  convertToEther(numberInWei) {
    if (numberInWei) { return this.state.web3.fromWei(numberInWei, 'ether'); }
    else { return null }
  }

  convertToWei(numberInEth) {
    if (numberInEth) { return this.state.web3.toWei(numberInEth, 'ether'); }
    else { return null }
  }

  updateGamesData(game) {
    // If a challenger joined a game, delist it from availableGames
    if (game.status !== 0) {
      this.deleteGameRecord(game, this.state.availableGames, "availableGames");
    }
    // If it's an available game, add it to availableGames
    if (game.creator !== this.state.account && game.status == 0) {
      this.deleteGameRecord(game, this.state.availableGames, "availableGames"); // Delete old record
      this.addGameRecord(game, this.state.availableGames, "availableGames"); // Add updated record
    }
    // If it's one of myGames, update it
    if (game.creator == this.state.account || game.challenger == this.state.account) {
      this.deleteGameRecord(game, this.state.myGames, "myGames"); // Delete old record
      this.addGameRecord(game, this.state.myGames, "myGames");// Add updated record
    }
  }

  // Helper function for updateGamesData
  addGameRecord(game, array, arrayName) {
    let updatedArray = array;
    updatedArray.push(game);
    this.setState( { [arrayName]: updatedArray } );
  }

  // Helper function for updateGamesData
  deleteGameRecord(game, array, arrayName) {
    let index = 0;
    let prunedArray = [];

    array.map(currentGame => {
      if (currentGame.gameId !== game.gameId) { // Drop out any old records of games with this ID
        prunedArray.push(currentGame);
      }
      return index++;
    });

    this.setState( { [arrayName]: prunedArray } );
  }

  getMinimumWager() {
    this.state.contract.minimumWager.call()
    .then( (response) => {
      this.setState({ minimumWager: this.convertToEther(response).toNumber() });
    });
  }

  updateBalances() {
    this.state.web3.eth.getBalance(this.state.account, (error, result) => { // Account balance
      this.setState({ accountBalance: this.convertToEther(result).toNumber() });
    });

    this.state.contract.balances.call(this.state.account) // In-game balance
    .then( (response) => {
      this.setState({ gameBalance: this.convertToEther(response).toNumber() });
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
  }

  handleDepositChange(event) {
    this.setState({deposit: event.target.value});
  }

  handleWithdrawChange(event) {
    this.setState({withdraw: event.target.value});
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


  /*
  <-- Game action functions -->
  */

  handleDeposit(event) {
    event.preventDefault();
    this.state.contract.depositFunds({from: this.state.account, value: this.convertToWei(this.state.deposit)})
    .then( (response) => {
      // Function must have a callback
    });
  }

  // For some God-knows-why reason, the front end won't allow withdrawing the FULL amount. So I did this. Leaves some "dust" in the contract.
  handleWithdraw(event) {
    event.preventDefault();
    const amountToWithdraw = this.convertToWei(this.state.withdraw) - 5000; // <- Yep! Frustrating...
    this.state.contract.withdrawFunds(amountToWithdraw, {from: this.state.account})
    .then( (response) => {
      // Function must have a callback
    });
  }

  handleNewGame(event) {
    event.preventDefault();
    let encryptedMove = web3Utils.soliditySha3(
      this.state.newGameMove,
      this.state.account,
      web3Utils.soliditySha3(this.state.newGamePassword)
    );
    this.state.contract.createGame(encryptedMove, this.convertToWei(this.state.wager), {from: this.state.account})
    .then( (response) => {
      // Function must have a callback
    });
  }

  handleCancelGame(event) {
    event.preventDefault();
    this.state.contract.cancelGame(this.state.cancelGameId, {from: this.state.account})
    .then( (response) => {
      // Function must have a callback
    });
  }

  handleJoinGame(event) {
    event.preventDefault();
    let encryptedMove = web3Utils.soliditySha3(
      this.state.joinGameMove,
      this.state.account,
      web3Utils.soliditySha3(this.state.joinGamePassword)
    );
    this.state.contract.joinGame(encryptedMove, this.state.joinGameId, {from: this.state.account})
    .then( (response) => {
      // Function must have a callback
    });
  }

  handleRevealMove(event) {
    event.preventDefault();
    let hashedPassword = web3Utils.soliditySha3(this.state.revealMovePassword);
    this.state.contract.revealMove(this.state.revealMove, hashedPassword, this.state.revealMoveGameId, {from: this.state.account})
    .then( (response) => {
      // Function must have a callback
    });
  }


  /*
  <-- Render the UI -->
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
              <Intro contractAddress={this.state.contractAddress} />
              <Rules />
              <Balance
                account={this.state.account}
                accountBalance={this.state.accountBalance}
                gameBalance={this.state.gameBalance}
                deposit={this.state.deposit}
                withdraw={this.state.withdraw}
                handleDepositChange={this.handleDepositChange.bind(this)}
                handleDeposit={this.handleDeposit.bind(this)}
                handleWithdrawChange={this.handleWithdrawChange.bind(this)}
                handleWithdraw={this.handleWithdraw.bind(this)}

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
              <AvailableGames
                availableGames={this.state.availableGames}
              />
              <JoinGame
                joinGamePassword={this.state.joinGamePassword}
                joinGameId={this.state.joinGameId}
                handleJoinGameMoveChange={this.handleJoinGameMoveChange.bind(this)}
                handleJoinGamePasswordChange={this.handleJoinGamePasswordChange.bind(this)}
                handleJoinGameIdChange={this.handleJoinGameIdChange.bind(this)}
                handleJoinGame={this.handleJoinGame.bind(this)}
              />
              <DividerLine />
              <MyGames
                myGames={this.state.myGames}
                gameStatusReference={this.gameStatusReference}
              />
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

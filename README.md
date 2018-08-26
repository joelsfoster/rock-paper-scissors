# Rock Paper Scissors - ConsenSys Academy final project


*Disclaimer: I actually had no idea https://github.com/SCBuergel/ethereum-rps existed before I did this project. I certainly like my implementation better.*


### What does this project do?

Rock-paper-scissors is a game where players can be matched up against each other for a chance to win money from their opponents. The game creator locks in an encrypted move (rock, paper, or scissors) and places a wager, and waits for an opponent to accept by matching the wager and submitting their own encrypted move. The game creator can also cancel any of their open games if no opponent has joined. When a challenger joins a created game, both players' wagers are locked in the contract and both players must then reveal their moves to determine the winner. A winner must be determined within 5,760 blocks (roughly 24 hours @ a 15 second blocktime) of the game's start, or the game will expire and both player's wagers will be refunded.

If only one player reveals their move by the end of the game's time limit, the revealed player automatically wins regardless of their opponent's unrevealed move. This would happen, for example, if the first player reveals and their opponent sees their move and knows that they've lost, and thus refuses to reveal. In the event that both players reveal and tie, the game ends and both player's wagers are returned to them.


### How to set it up

1. Clone this repository to your local machine.
2. Open up Ganache (desktop or command line) and configure it to hostname = 127.0.0.1 and port = 8545 to get your local blockchain up and running. Copy the mnemonic provided for later.
3. In terminal, navigate to the cloned directory and use `truffle compile`, then `truffle migrate` to deploy the DApp to your local blockchain. *Note that you will see a number of compilation warnings which all have to do with the keccak256() function complaining about taking in strings. Ignore these.*
4. (Optional) While you're still in this directory, use `truffle test` to see that all the tests are working. Note that this will cost a lot of gas because the contract will be redeployed for each test.
5. Use `npm run start` to launch the front end. It will open to localhost:3000, which is connected to your local blockchain at 127.0.0.1:8545.
6. Take the mnemonic you copied from Ganache in step 2 and open MetaMask in your browser, copying the mnemonic there. In MetaMask, set your blockchain network to Localhost 8545, which will refresh the page.
7. Conduct game actions in the DApp and sign them using MetaMask. If you want to join a game you created, you have to use a different address--this is as simple as adding a new account in MetaMask (no need to use a different private key). Try creating a game, joining using a different account, revealing your moves with both accounts, and verifying that your winning account got paid the prize.


### If you want to review my code

- Game logic is found at ./contracts/RockPaperScissors.sol
- Front end is defined in ./src/App.js (I used the `truffle react` box)
- Read ./design_pattern_decisions.md
- Read ./avoiding_common_attacks.md


### My stretch goals (if I have time)

- Consider implementing the "Balance Withdrawal" design pattern (increasing safety but sacrificing UX)
- Deploy the DApp to the Rinkby testnet (and add a deployed_addresses.txt file containing the address)
- Implement Ethereum Alarm Clock to trigger game expirations
- Unit tests for modifiers that throw revert() via require fails
- Unit tests for all publicly-callable getter functions
- Optimize gas costs
- Make a nicer UI

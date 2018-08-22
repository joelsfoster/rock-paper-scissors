# Rock Paper Scissors - ConsenSys Academy final project


What does this project do?

Rock-paper-scissors is a game where players can be matched up against each other for a chance to win money from their opponents. The game creator locks in an encrypted move (rock, paper, or scissors) and places a wager, and waits for an opponent to accept by matching the wager and submitting their own encrypted move. The game creator can also cancel any of their open games if no opponent has joined. When an opponent joins a created game, both players' wagers are locked in the contract and both players must then reveal their moves to determine the winner. A winner must be determined within 5,760 blocks (roughly 24 hours @ a 15 second blocktime) of the game's start, or the game will automatically be cancelled with each player's wager returned to them.

If only one player reveals their move by the end of the game's time limit (such as the opponent knowing that they lost and refusing to reveal), the revealed player automatically wins regardless of their opponent's unrevealed move. In the event of a double-reveal tie, the game ends and each player's wager is returned to them.


How to set it up

1) Clone this repository to your local machine.
2) Open up Ganache (desktop or command line) and configure it to hostname = 127.0.0.1 and port = 8545 to get your local blockchain up and running.
3) In terminal, navigate to the cloned directory and use `truffle compile`, then `truffle migrate` to deploy the DApp to your local blockchain.
4) (Optional) While you're still in this directory, use `truffle test` for fun to see that all the tests are working.
5) In your browser, go to localhost:8545 to use the DApp. This project uses the lite-server package to serve up the front end locally.


My stretch goals (if I have time)

- Deploy the DApp to the Rinkby testnet (and add a deployed_addresses.txt file containing the address).
- Implement Ethereum Alarm Clock to trigger game expirations.

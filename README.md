# Rock Paper Scissors - ConsenSys Academy final project


What does this project do?

Rock-paper-scissors is a game where players can be matched up against each other to win their opponent's entry fees. The game creator locks in an encrypted submission (rock, paper, or scissors) and an entry fee, and waits for an opponent to accept by matching the entry fee and submitting their own encrypted move. The game creator can also cancel any of their open games if no opponent has joined. When an opponent joins a created game, both players' entry fees are locked in the contract and both players are to reveal their submissions to determine the winner. A winner must be determined within 5,760 blocks (roughly 24 hours @ a 15sec blocktime) of the game's start, or the game will automatically be cancelled with the entry fee funds returned to both players.

If only one player reveals their submission by the end of the game's time limit (such as the opponent knowing that they lost and refusing to reveal), the revealing player automatically wins regardless of their opponent's unrevealed move. In the event of a double-reveal tie, the game ends and all funds are returned to players.


How to set it up

1) Clone this repository to your local machine.
2) Open up Ganache (desktop or command line) and configure it to hostname = 127.0.0.1 and port = 8545 to get your local blockchain up and running.
3) In terminal, navigate to the cloned directory and use `truffle compile`, then `truffle migrate` to deploy the DApp to your local blockchain.
4) (Optional) While you're still in this directory, use `truffle test` for fun to see that all the tests are working.
5) In your browser, go to localhost:8545 to use the DApp. This project uses the lite-server package to serve up the front end locally.


My stretch goals (if I have time)

- Deploy the DApp to the Rinkby testnet (and add a deployed_addresses.txt file containing the address).

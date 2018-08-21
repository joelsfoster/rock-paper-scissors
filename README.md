# Rock Paper Scissors - ConsenSys Academy final project


What does this project do?

Rock-paper-scissors is a game where a player can propose a single rock-paper-scissors game with a specified bet/entry fee that the winner of the game will receive as the prize. The game creator locks in their proposal (which can be canceled at any time before the game begins) and waits for an opponent to accept by paying the entry fee. At this stage, the funds are locked in the contract and both players are to commit an encrypted submission (rock, paper, or scissors). When both players have finished committing, both players' submissions are revealed and the winner is awarded the prize. In the event of a tie, players must commit a new submission until there is a winner. The game must conclude with a winner within 5,760 blocks (roughly 24 hours @ a 15sec blocktime) of the game's start, or the game will automatically be cancelled with the entry fee funds returned to both players.


How to set it up

1) Clone this repository to your local machine.
2) Open up Ganache (desktop or command line) and configure it to hostname = 127.0.0.1 and port = 8545 to get your local blockchain up and running.
3) In terminal, navigate to the cloned directory and use `truffle compile`, then `truffle migrate` to deploy the DApp to your local blockchain.
4) (Optional) While you're still in this directory, use `truffle test` for fun to see that all the tests are working.
5) In your browser, go to localhost:8545 to use the DApp. This project uses the lite-server package to serve up the front end locally.


My stretch goals (if I have time)

- Deploy the DApp to the Rinkby testnet (and add a deployed_addresses.txt file containing the address).

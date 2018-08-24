var RockPaperScissors = artifacts.require("RockPaperScissors");

module.exports = function(deployer) {
  deployer.deploy(RockPaperScissors, 5000000000000000); // Setting the minimumWager to .005 ETH
};

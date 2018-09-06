# Avoiding common attacks

### Integer overflows/underflows

I use the SafeMath library to protect from this.

### Circuit breaker

The contract owner is able to pause/unpause any action on the contract as an emergency stop-gap. As of right now, that does in fact mean that games can expire while the contract is paused.

### Contract ownership

I use OpenZeppelin's Ownable package for contract ownership.

### Tried-and-true packages and libraries

Importing and using battle-tested packages and libraries like Ownable and SafeMath are far more secure than creating my own solutions from scratch.

### Delegatecall vulnerability

Learning from the Parity Wallet multi-sig hack, I avoided using delegatecall (although I don't have reason to use it for this project) and ensured the libraries I used don't carry that risk.

### Reentrancy

Learning from the DAO hack, I made sure that any functions moving value occur AFTER any and all state updates, as otherwise these state values will be vulnerable to reentrancy/recursive calls.

### Timestamp vulnerabilities

I use block.number instead of timestamps because miners can tamper with the timestamps. Fortunately I don't have to worry about frontrunning in an app like this (miners intentionally ordering transactions within blocks favorably).

### Infinite loop gas trap / DoS attack

I don't loop/iterate over arrays of variable or undetermined length. In fact I avoided having to do array iterations by (for example) using mappings like moveWinsAgainst.

### Contract balance dependency vulnerability

I don't use any code that depends on the contract's balance, as I know that Ether can be forcibly sent to the contract, even before deployment, and even can avoid a fallback function that isn't payable (such as when you selfdestruct() another contract and target this one to be paid).

### Data cleanliness

I sanitize user-input data by using function modifiers that validate the data before passing it to my functions.

###

I audited all my public-facing functions and interfaces and ensured all other functions are marked as "internal".

### Other

There are additional attack types that I not mention here because they're not highly relevant to this project, but I did spend a massive amount of time studying them all to be aware and knowledgable about them for future DApps!

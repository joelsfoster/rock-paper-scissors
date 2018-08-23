# Avoiding common attacks

- I use SafeMath to protect from overflows.
- I use Ownable to control the circuitBreaker function.
- I'm using field-tested packages/libraries/contracts like Ownable and SafeMath as opposed to custom-building my own solutions.
- Learning from the Parity Wallet multi-sig hack, I avoided using delegatecall (although I don't have reason to use it for this project) and ensured the libraries I used don't carry that risk.
- Learning from the DAO hack, I made sure that any functions moving value occur AFTER any and all state updates, as otherwise these state values will be vulnerable to reentrancy/recursive calls.
- I use block.number instead of timestamps because miners can tamper with the timestamps. Fortunately I don't have to worry about frontrunning (miners intentionally ordering transactions within blocks favorably).
- I don't loop/iterate over arrays of variable or undetermined length. In fact I avoided having to do array iterations by (for example) using mappings like moveWinsAgainst.
- I don't use any code that depends on the contract's balance, as I know that Ether can be forcibly sent to the contract, even before deployment.
- I sanitize user-input data by using function modifiers that validate the data before passing it to my functions.
- I audited all my public-facing functions and interfaces and ensured all other functions are marked as "internal".
- There are additional attack types that I not mention here because they're not highly relevant to this project, but I did spend a massive amount of time studying them all to be aware and knowledgable about them for future DApps!

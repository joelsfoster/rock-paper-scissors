# Avoiding common attacks

- Executing functions from contract addresses (as opposed to user addresses)
- I used SafeMath to protect from overflows.
- I'm using field-tested packages/libraries/contracts like Ownable and SafeMath as opposed to custom-building my own solutions.
- Learning from the Parity Wallet multi-sig hack, I avoided using delegatecall (although I don't have reason to use it for this project).
- Learning from the DAO hack, I made sure that any functions moving value occur after any and all state updates, as otherwise these state values will be vulnerable to reentrancy/recursive calls.

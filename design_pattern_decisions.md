# Design pattern decisions

- Talk about commit/reveal
- Contract simplicity and readability
- Reducing gas/storage costs (use Remix to test different storage structures)
- Emergency stop "circuit breaker"


Game Incentives / UX Design

I wrestled with the friction involved with having users (especially game creators) take multiple actions. The first iteration of the game's design was to have both players enter into the game and be locked in, then commit their move, then reveal. I realized since we're using encryption, the game creator can submit their move at the time they create the game, and reveal it after the opponent joined and committed their move. However, continuing that train of thought I realized that would mean the opponent's move didn't have to be encrypted since it's being submitted at the same time both players are locked into the game (auto-reveal the challenger's move at lock-in time, basically). This is a great experience for the challenger (1 MetaMask action), but a disincentivized experience for the game creator, who would not only have to create the game but also reveal their move within 24 hours of being challenged. This is 2 MetaMask actions, and the second action would have to take place only after a challenger is found, which could be inconvenient timing for the game creator. So, I decided to keep the system of both creator and challenger having to commit and reveal as separate actions, to keep things "more fair" in terms of inconvenience being experienced by either player. I went with this option instead of finding a way to compensate/incentivize game creators for the trouble of going through more friction. If you have opinions on this, please share them with me!

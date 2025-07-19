import { GameState, Player, Tile, Meld, AmbitionType, WinCondition, ClaimAction } from '@/types/mahjong'
import { createTileSet, shuffleTiles, tilesMatch, isValidSequence, isValidTriplet, isValidQuad } from '@/utils/mahjongTiles'

// Initialize a new Filipino Mahjong game
export function initializeGame(players: Player[]): GameState {
  const tiles = shuffleTiles(createTileSet())
  
  // Separate bonus tiles (flowers/seasons) from regular tiles
  const bonusTiles = tiles.filter(tile => tile.isBonus)
  const regularTiles = tiles.filter(tile => !tile.isBonus)
  
  // Build walls - regular tiles for main wall, bonus tiles for replacement
  const wall = shuffleTiles(regularTiles) // 136 regular tiles
  const flowerWall = shuffleTiles(bonusTiles) // 8 bonus tiles
  
  // Deal initial tiles
  const dealerIndex = Math.floor(Math.random() * 4)
  const gameState: GameState = {
    id: `game-${Date.now()}`,
    players: players.map((player, index) => ({
      ...player,
      hand: [],
      melds: [],
      flowers: [],
      discards: [],
      isDealer: index === dealerIndex
    })),
    currentPlayer: dealerIndex,
    dealer: dealerIndex,
    wall: [],
    flowerWall: [],
    discardPile: [],
    round: 1,
    wind: 'east',
    status: 'playing',
    scores: [0, 0, 0, 0],
    ambitions: [],
    phase: 'discard', // Dealer starts with 17 tiles, so they discard first
    hasDrawnThisTurn: false,
    skippedPlayer: undefined
  }

  // Deal exactly 16 tiles to each player (including dealer initially)
  let tileIndex = 0
  
  // Deal 4 rounds of 4 tiles each (16 tiles per player)
  for (let round = 0; round < 4; round++) {
    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      for (let tileCount = 0; tileCount < 4; tileCount++) {
        if (tileIndex < wall.length) {
          gameState.players[playerIndex].hand.push(wall[tileIndex])
          tileIndex++
        }
      }
    }
  }

  // Set remaining wall and flower wall
  gameState.wall = wall.slice(tileIndex)
  gameState.flowerWall = flowerWall

  // Auto-expose and replace flowers for all players to ensure exactly 16 non-flower tiles
  gameState.players.forEach((player, index) => {
    ensureCorrectHandSize(gameState, index)
    console.log(`Player ${player.name} has ${player.flowers.length} flowers:`, player.flowers.map(f => f.flower || f.season))
  })

  // Dealer draws the 17th tile to start the game
  drawTile(gameState, dealerIndex)

  return gameState
}

// Ensure player has exactly 16 non-flower tiles in hand
export function ensureCorrectHandSize(gameState: GameState, playerIndex: number): void {
  const player = gameState.players[playerIndex]
  let hasFlowers = true
  
  while (hasFlowers) {
    hasFlowers = false
    
    // Find bonus tiles in hand
    for (let i = player.hand.length - 1; i >= 0; i--) {
      const tile = player.hand[i]
      if (tile.isBonus) {
        // Move to flowers collection
        player.flowers.push(tile)
        player.hand.splice(i, 1)
        hasFlowers = true
        
        // Draw replacement from main wall (not flower wall)
        if (gameState.wall.length > 0) {
          const replacement = gameState.wall.shift()!
          player.hand.push(replacement)
          
          // If replacement is also a flower, continue loop
          if (replacement.isBonus) {
            hasFlowers = true
          }
        }
      }
    }
  }
  
  // Ensure exactly 16 tiles in hand (excluding flowers)
  while (player.hand.length < 16 && gameState.wall.length > 0) {
    const tile = gameState.wall.shift()!
    if (tile.isBonus) {
      player.flowers.push(tile)
      // Continue drawing until we get a non-flower tile
    } else {
      player.hand.push(tile)
    }
  }
}

// Legacy function for backward compatibility
export function exposeAndReplaceFlowers(gameState: GameState, playerIndex: number): void {
  ensureCorrectHandSize(gameState, playerIndex)
}

// Validate game state for consistency
export function validateGameState(gameState: GameState): { isValid: boolean, errors: string[] } {
  const errors: string[] = []
  
  // Check hand sizes
  gameState.players.forEach((player, index) => {
    const handSize = player.hand.length
    const isCurrentPlayer = index === gameState.currentPlayer
    const isDrawPhase = gameState.phase === 'draw'
    
    // Filipino Mahjong: Normal hand size should be 16, or 17 if current player in discard phase
    const expectedHandSize = (isCurrentPlayer && (isDrawPhase || gameState.phase === 'discard')) ? 17 : 16
    
    if (handSize > 17) {
      errors.push(`Player ${player.name} has ${handSize} tiles (max 17)`)
    } else if (handSize < expectedHandSize - 1) {
      errors.push(`Player ${player.name} has ${handSize} tiles (expected ~${expectedHandSize})`)
    }
  })
  
  // Check total tiles
  const totalTilesInGame = gameState.players.reduce((sum, p) => sum + p.hand.length, 0) +
                          gameState.wall.length +
                          gameState.discardPile.length +
                          gameState.players.reduce((sum, p) => sum + p.flowers.length, 0) +
                          gameState.players.reduce((sum, p) => sum + p.melds.reduce((meldSum, m) => meldSum + m.tiles.length, 0), 0)
  
  if (totalTilesInGame !== 144) {
    errors.push(`Total tiles: ${totalTilesInGame} (expected 144)`)
  }
  
  return { isValid: errors.length === 0, errors }
}

// Draw a tile from the wall
export function drawTile(gameState: GameState, playerIndex: number): Tile | null {
  if (gameState.wall.length === 0) return null
  
  const player = gameState.players[playerIndex]
  
  // CRITICAL: Strict hand size validation
  if (player.hand.length >= 17) {
    console.error(`❌ BLOCKED: Player ${player.name} already has ${player.hand.length} tiles. Cannot draw more.`)
    console.error('Current game state validation:', validateGameState(gameState))
    return null
  }
  
  let drawnTile: Tile | null = null
  
  // Clear previous recently drawn markers
  player.hand.forEach(tile => {
    tile.isRecentlyDrawn = false
  })
  
  // Keep drawing until we get a non-flower tile
  while (gameState.wall.length > 0) {
    const tile = gameState.wall.shift()!
    
    if (tile.isBonus) {
      // Auto-expose flower and continue drawing
      player.flowers.push(tile)
      console.log(`🌸 Player ${player.name} drew a bonus tile: ${tile.suit} ${tile.flower || tile.season}`)
    } else {
      // Found a regular tile
      tile.isRecentlyDrawn = true
      player.hand.push(tile)
      drawnTile = tile
      gameState.lastDrawnTile = tile
      gameState.phase = 'discard' // After drawing, player must discard
      gameState.hasDrawnThisTurn = true // Mark that current player has drawn
      break
    }
  }
  
  // Validate state after drawing
  const validation = validateGameState(gameState)
  if (!validation.isValid) {
    console.warn('⚠️ Game state validation warnings after draw:', validation.errors)
  }
  
  console.log(`🎯 Player ${player.name} drew tile. Hand size: ${player.hand.length}, Flowers: ${player.flowers.length}`)
  
  // Check for automatic win after drawing
  const totalTiles = player.hand.length + player.melds.reduce((sum, meld) => sum + meld.tiles.length, 0)
  console.log(`🔍 Win check for ${player.name}: Hand=${player.hand.length}, Melds=${player.melds.length} (${player.melds.reduce((sum, meld) => sum + meld.tiles.length, 0)} tiles), Total=${totalTiles}`)
  
  const winCondition = isWinningHand(player.hand, player.melds, player.flowers)
  if (winCondition.isValid) {
    console.log(`🏆 ${player.name} has a winning hand after drawing! Type: ${winCondition.handType}`)
    gameState.status = 'finished'
    gameState.winner = playerIndex
    gameState.winType = winCondition.handType
    gameState.phase = 'finished'
    
    // Capture winning hand and winning tile
    gameState.winningTile = drawnTile
    gameState.winningHand = {
      tiles: [...player.hand],
      melds: [...player.melds],
      flowers: [...player.flowers]
    }
  } else {
    console.log(`❌ ${player.name} does not have a winning hand (total tiles: ${totalTiles}, expected: 17)`)
  }
  
  return drawnTile
}

// Discard a tile
export function discardTile(gameState: GameState, playerIndex: number, tile: Tile): void {
  const player = gameState.players[playerIndex]
  const tileIndex = player.hand.findIndex(t => t.id === tile.id)
  
  if (tileIndex !== -1) {
    // Clear recently drawn marker from all tiles
    player.hand.forEach(t => {
      t.isRecentlyDrawn = false
    })
    
    // Mark tile as recently discarded
    tile.isRecentlyDiscarded = true
    
    // Remove tile from hand
    player.hand.splice(tileIndex, 1)
    player.discards.push(tile)
      gameState.discardPile.push(tile)
  gameState.lastDiscard = tile
  gameState.lastDiscardPlayer = playerIndex
    gameState.lastDrawnTile = undefined
    
    // CRITICAL: Enter claim resolution phase instead of advancing turn immediately
    // The turn does NOT advance yet - currentPlayer remains the discarding player
    gameState.phase = 'claimResolution'
    gameState.hasDrawnThisTurn = false // Reset for claim evaluation
    
    // Initialize claim window
    gameState.claimWindow = {
      startTime: Date.now(),
      duration: 8000, // 8 seconds for human claims
      timeout: undefined
    }
  }
}

// Centralized AI claim decision logic (moved from enhancedMahjongAI.ts)
function evaluateAIClaimDecision(player: any, discardedTile: Tile, claimType: string, gameState: GameState): boolean {
  switch (claimType) {
    case 'win':
      // Priority 1: Can we win with this tile?
      const testHand = [...player.hand, discardedTile]
      const winCondition = isWinningHand(testHand, player.melds, player.flowers)
      return winCondition.isValid

    case 'kong':
      // Priority 2: Kong (4 of a kind) - highest value meld
      const kongMatches = player.hand.filter((t: Tile) => tilesMatch(t, discardedTile))
      return kongMatches.length >= 3

    case 'pung':
      // Priority 3: Pung (3 of a kind) - with strategic evaluation
      const pungMatches = player.hand.filter((t: Tile) => tilesMatch(t, discardedTile))
      if (pungMatches.length >= 2) {
        // Simplified strategic check - claim if we have 2+ matching tiles
        console.log(`🎯 PUNG evaluation for ${player.name}: found ${pungMatches.length} matching tiles - claiming`)
        return true
      }
      return false

    case 'chow':
      // Priority 4: Chow (sequence) - more selective
      const sequences = getAllPossibleSequences(player.hand, discardedTile)
      if (sequences.length > 0) {
        // Simplified: claim chow if we can form a sequence
        console.log(`🎯 CHOW evaluation for ${player.name}: found ${sequences.length} possible sequences - claiming`)
        return true
      }
      return false

    default:
      return false
  }
}

// Function to advance the turn if no claim is made
export function advanceTurn(gameState: GameState): void {
  console.log('🚨 advanceTurn CALLED')
  if (gameState.phase !== 'claimResolution') {
    console.log(`🚨 advanceTurn SKIPPED: phase is ${gameState.phase}, not claimResolution`)
    return
  }

  // Clear claim window
  if (gameState.claimWindow?.timeout) {
    clearTimeout(gameState.claimWindow.timeout)
  }
  gameState.claimWindow = null

  // Move to next player and set phase to draw
  let nextPlayer = (gameState.currentPlayer + 1) % 4
  
  console.log(`🔄 advanceTurn: Current=${gameState.players[gameState.currentPlayer].name}(${gameState.currentPlayer}), Next=${gameState.players[nextPlayer].name}(${nextPlayer}), SkippedPlayer=${gameState.skippedPlayer !== undefined ? gameState.players[gameState.skippedPlayer].name + '(' + gameState.skippedPlayer + ')' : 'none'}`)
    
  // Skip the player if they were marked as skipped due to a claim
  if (gameState.skippedPlayer !== undefined && nextPlayer === gameState.skippedPlayer) {
    console.log(`⏭️ Skipping ${gameState.players[nextPlayer].name}(${nextPlayer}) due to previous claim`)
    nextPlayer = (nextPlayer + 1) % 4
    console.log(`🔄 After skip: Next player is now ${gameState.players[nextPlayer].name}(${nextPlayer})`)
  }
  
  // Always clear skippedPlayer after any turn advancement (skip only lasts for one turn)
  if (gameState.skippedPlayer !== undefined) {
    console.log(`🧹 Clearing skippedPlayer after turn advancement`)
    gameState.skippedPlayer = undefined
  }
    
  gameState.currentPlayer = nextPlayer
  console.log(`✅ Turn advanced to: ${gameState.players[nextPlayer].name}(${nextPlayer})`)
  gameState.phase = 'draw' // Next player needs to draw first
  gameState.hasDrawnThisTurn = false // Reset for next player
}

// Centralized claim window handler
export function handleClaimWindow(
  gameState: GameState, 
  humanPlayerId: string,
  aiInstances: any,
  onStateUpdate: (newState: GameState) => void,
  onNotification: (title: string, description: string) => void,
  onContinueAI: () => void
): void {
  if (gameState.phase !== 'claimResolution' || !gameState.lastDiscard) return

  console.log('🎯 Starting claim window for discard:', gameState.lastDiscard)

    // STEP 1: Give human player 3-second advantage window (but don't force them to claim)
  console.log('👤 Starting 6-second human advantage window (human can claim but is not forced to)')
  
  // Check what AI players could potentially claim (but don't let them claim yet)
  const aiPlayers = gameState.players.filter(p => p.id.startsWith('ai-'))
  const potentialAiClaims: { claim: ClaimAction, priority: number, player: any }[] = []

  for (const aiPlayer of aiPlayers) {
    // Check each claim type
    const claimTypes: Array<'win' | 'kong' | 'pung' | 'chow'> = ['win', 'kong', 'pung', 'chow']
    
    for (const claimType of claimTypes) {
      const testClaim: ClaimAction = { type: claimType, playerId: aiPlayer.id }
      
      const isValid = isValidClaim(gameState, testClaim)
      console.log(`🔍 AI ${aiPlayer.name} could claim ${claimType}: ${isValid ? 'YES' : 'no'} (waiting for human advantage window)`)
      
      if (isValid) {
        // Use centralized AI claim decision logic (moved from enhancedMahjongAI.ts)
        const shouldClaim = evaluateAIClaimDecision(aiPlayer, gameState.lastDiscard!, claimType, gameState)
        
        if (shouldClaim) {
          let priority = 0
          switch (claimType) {
            case 'win': priority = 4; break
            case 'kong': priority = 3; break
            case 'pung': priority = 2; break
            case 'chow': priority = 1; break
          }
          
          console.log(`🎯 AI ${aiPlayer.name} wants to claim ${claimType} (queued for after human window)`)
          potentialAiClaims.push({ 
            claim: { type: claimType, playerId: aiPlayer.id }, 
            priority, 
            player: aiPlayer 
          })
          break // Only add one claim per AI player
        }
      }
    }
  }

  // STEP 2: After 3-second human advantage, let AI players claim
  const aiClaimTimeout = setTimeout(() => {
    if (gameState.phase !== 'claimResolution') {
      console.log('❌ AI claim timeout cancelled: not in claimResolution phase anymore')
      return // Human already claimed or game advanced
    }
    
    if (potentialAiClaims.length > 0) {
      // Sort by priority (highest first)
      potentialAiClaims.sort((a, b) => b.priority - a.priority)
      const bestClaim = potentialAiClaims[0]
      
      console.log(`🤖 AI ${bestClaim.player.name} making ${bestClaim.claim.type} claim after human window`)
      
      const success = processClaim(gameState, bestClaim.claim)
      if (success) {
        console.log(`✅ AI claim successful! Current player is now: ${gameState.players[gameState.currentPlayer].name}`)
        console.log(`✅ Game phase is now: ${gameState.phase}`)
        
        onNotification(
          `${bestClaim.player.name} claimed!`, 
          `Used ${bestClaim.claim.type.toUpperCase()} to claim the tile`
        )
        onStateUpdate(gameState)
        
        // Continue AI simulation for the claiming player
        console.log(`🎯 AI ${bestClaim.player.name} claimed and now needs to discard`)
        setTimeout(() => {
          console.log('🚀 Triggering AI continuation after claim...')
          onContinueAI()
        }, 500)
      } else {
        console.log(`❌ AI claim failed for ${bestClaim.player.name}`)
      }
      return
    }
    
    // No AI wants to claim either, advance turn normally
    console.log('📦 No AI claims after human window, advancing turn')
    console.log(`🚨 Before advanceTurn: phase=${gameState.phase}, current=${gameState.players[gameState.currentPlayer].name}(${gameState.currentPlayer})`)
    advanceTurn(gameState)
    console.log(`🚨 After advanceTurn: phase=${gameState.phase}, current=${gameState.players[gameState.currentPlayer].name}(${gameState.currentPlayer})`)
    onStateUpdate(gameState)
    setTimeout(() => onContinueAI(), 500)
    
  }, 6000) // 6-second human advantage window

  // Store cleanup function for the AI timeout
  if (gameState.claimWindow) {
    const cleanupTimeout = () => {
      clearTimeout(aiClaimTimeout)
    }
    
    // Store cleanup function (we'll call this when human claims are made)
    gameState.claimWindow.cleanup = cleanupTimeout
  }
}

// Check if a claim is valid
export function isValidClaim(gameState: GameState, claim: ClaimAction): boolean {
  const player = gameState.players.find(p => p.id === claim.playerId)
  if (!player || !gameState.lastDiscard) return false
  
  const lastDiscard = gameState.lastDiscard
  const playerIndex = gameState.players.findIndex(p => p.id === claim.playerId)
  
  // CRITICAL: Cannot claim your own discard
  if (playerIndex === gameState.currentPlayer) {
    console.log(`❌ ${player.name} cannot claim their own discard`)
    return false
  }
  
  // Check rotation restrictions: Cannot claim if the current player has already drawn this turn
  if (gameState.hasDrawnThisTurn) {
    return false
  }
  
  switch (claim.type) {
    case 'chow': {
      // CHOW RESTRICTION: Can only be claimed by the player immediately after the discarding player
      if (gameState.lastDiscardPlayer !== undefined) {
        const nextPlayerIndex = (gameState.lastDiscardPlayer + 1) % 4
        if (playerIndex !== nextPlayerIndex) {
          console.log(`❌ CHOW can only be claimed by player ${nextPlayerIndex} (next in sequence), but player ${playerIndex} tried to claim`)
          return false
        }
      }
      
      // Need 2 tiles to form sequence with discard
      return canFormSequence(player.hand, lastDiscard)
    }
      
    case 'pung': {
      // PUNG can be claimed by any player (no turn sequence restriction)
      // Need 2 matching tiles
      const matchingTiles = player.hand.filter(t => tilesMatch(t, lastDiscard))
      const isValid = matchingTiles.length >= 2
      console.log(`🎯 PUNG check for ${player.name}: found ${matchingTiles.length} matching tiles for ${lastDiscard.suit} ${lastDiscard.value || lastDiscard.wind || lastDiscard.dragon} - ${isValid ? 'VALID' : 'invalid'}`)
      return isValid
    }
      
    case 'kong':
      // KONG can be claimed by any player (no turn sequence restriction)
      // Need 3 matching tiles
      return player.hand.filter(t => tilesMatch(t, lastDiscard)).length >= 3
      
    case 'win':
      // WIN can be claimed by any player (no turn sequence restriction)
      return isWinningHand(player.hand.concat([lastDiscard]), player.melds, player.flowers).isValid
      
    default:
      return false
  }
}

// Check if player can form a sequence with the discard
function canFormSequence(hand: Tile[], discard: Tile): boolean {
  if (!['circles', 'bamboos', 'characters'].includes(discard.suit)) return false
  
  const suitTiles = hand.filter(t => t.suit === discard.suit && t.value)
  const discardValue = discard.value!
  
  console.log(`Checking chow for discard: ${discard.suit} ${discardValue}`)
  console.log(`Available suit tiles:`, suitTiles.map(t => `${t.suit} ${t.value}`))
  
  // Pattern 1: discard + 1 + 2 (e.g., 2-3-4 with discard=2)
  if (discardValue <= 7) {
    const hasNext = suitTiles.some(t => t.value === discardValue + 1)
    const hasNext2 = suitTiles.some(t => t.value === discardValue + 2)
    if (hasNext && hasNext2) {
      console.log(`Found chow pattern 1: ${discardValue}-${discardValue + 1}-${discardValue + 2}`)
      return true
    }
  }
  
  // Pattern 2: -1 + discard + 1 (e.g., 2-3-4 with discard=3)
  if (discardValue >= 2 && discardValue <= 8) {
    const hasPrev = suitTiles.some(t => t.value === discardValue - 1)
    const hasNext = suitTiles.some(t => t.value === discardValue + 1)
    if (hasPrev && hasNext) {
      console.log(`Found chow pattern 2: ${discardValue - 1}-${discardValue}-${discardValue + 1}`)
      return true
    }
  }
  
  // Pattern 3: -2 + -1 + discard (e.g., 2-3-4 with discard=4)
  if (discardValue >= 3) {
    const hasPrev = suitTiles.some(t => t.value === discardValue - 1)
    const hasPrev2 = suitTiles.some(t => t.value === discardValue - 2)
    if (hasPrev && hasPrev2) {
      console.log(`Found chow pattern 3: ${discardValue - 2}-${discardValue - 1}-${discardValue}`)
      return true
    }
  }
  
  console.log('No chow patterns found')
  return false
}

// Get all possible sequences that can be formed with a discard tile
export function getAllPossibleSequences(hand: Tile[], discard: Tile): Tile[][] {
  if (!['circles', 'bamboos', 'characters'].includes(discard.suit)) return []
  
  const suitTiles = hand.filter(t => t.suit === discard.suit && t.value)
  const discardValue = discard.value!
  const sequences: Tile[][] = []
  
  // Pattern 1: discard is the lowest (e.g., 2-3-4 with discard=2)
  if (discardValue <= 7) {
    const tile1 = suitTiles.find(t => t.value === discardValue + 1)
    const tile2 = suitTiles.find(t => t.value === discardValue + 2)
    if (tile1 && tile2) {
      sequences.push([discard, tile1, tile2])
    }
  }
  
  // Pattern 2: discard is in the middle (e.g., 2-3-4 with discard=3)
  if (discardValue >= 2 && discardValue <= 8) {
    const tile1 = suitTiles.find(t => t.value === discardValue - 1)
    const tile2 = suitTiles.find(t => t.value === discardValue + 1)
    if (tile1 && tile2) {
      sequences.push([tile1, discard, tile2])
    }
  }
  
  // Pattern 3: discard is the highest (e.g., 2-3-4 with discard=4)
  if (discardValue >= 3) {
    const tile1 = suitTiles.find(t => t.value === discardValue - 2)
    const tile2 = suitTiles.find(t => t.value === discardValue - 1)
    if (tile1 && tile2) {
      sequences.push([tile1, tile2, discard])
    }
  }
  
  return sequences
}

// Process a claim
export function processClaim(gameState: GameState, claim: ClaimAction): boolean {
  if (!isValidClaim(gameState, claim)) return false
  
  const playerIndex = gameState.players.findIndex(p => p.id === claim.playerId)
  const player = gameState.players[playerIndex]
  const lastDiscard = gameState.lastDiscard!
  
  switch (claim.type) {
    case 'chow': {
      // Use specific tiles if provided (from UI multi-option selection), otherwise use legacy auto-detection
      let chowTiles: Tile[] | null = null
      
      if (claim.tiles && claim.tiles.length === 3) {
        // User chose specific tiles from UI - validate they form a valid sequence with the discard
        const userChowTiles = claim.tiles
        const hasDiscard = userChowTiles.some(tile => tile.id === lastDiscard.id)
        const sortedValues = userChowTiles.map(t => t.value!).sort((a, b) => a - b)
        const isValidSequence = sortedValues[1] === sortedValues[0] + 1 && sortedValues[2] === sortedValues[1] + 1
        const sameSuit = userChowTiles.every(t => t.suit === lastDiscard.suit)
        
        if (hasDiscard && isValidSequence && sameSuit) {
          console.log(`✅ Using user-selected CHOW tiles:`, userChowTiles.map(t => `${t.suit} ${t.value}`))
          chowTiles = userChowTiles
        } else {
          console.error(`❌ Invalid user-selected CHOW tiles:`, userChowTiles.map(t => `${t.suit} ${t.value}`))
          return false
        }
      } else {
        // Legacy auto-detection (for AI or fallback)
        chowTiles = formChow(player.hand, lastDiscard)
        console.log(`🤖 Auto-detected CHOW tiles:`, chowTiles?.map(t => `${t.suit} ${t.value}`) || 'none')
      }
      
      if (chowTiles) {
        // Remove the claimed tile from discard pile
        const discardIndex = gameState.discardPile.findIndex(t => t.id === lastDiscard.id)
        if (discardIndex !== -1) {
          gameState.discardPile.splice(discardIndex, 1)
        }
        
        // Remove tiles from hand (the 2 tiles that form chow with discard, excluding the discard itself)
        const handTilesToRemove = chowTiles.filter(tile => tile.id !== lastDiscard.id)
        handTilesToRemove.forEach(tile => {
          const index = player.hand.findIndex(t => t.id === tile.id)
          if (index !== -1) player.hand.splice(index, 1)
        })
        
        // Add meld
        player.melds.push({
          id: `meld-${Date.now()}`,
          type: 'chow',
          tiles: chowTiles,
          isConcealed: false,
          claimedFrom: gameState.currentPlayer
        })
        
        // Store original discarder before changing current player
        const originalDiscarder = gameState.currentPlayer
        
        // Set turn to claiming player and mark the original discarder's right rotation as skipped
        gameState.currentPlayer = playerIndex
        gameState.phase = 'discard' // Player must discard after claiming (NO DRAWING)
        gameState.lastDiscard = undefined
        gameState.hasDrawnThisTurn = true // Mark as having "drawn" to prevent further claims until discard
        
        // Only skip if the claiming player is NOT the original discarder's right rotation
        // (i.e., if claiming player is the original discarder's right rotation, don't skip anyone)
        const rightRotation = (originalDiscarder + 1) % 4
        console.log(`🔄 CHOW: Discarder=${gameState.players[originalDiscarder].name}(${originalDiscarder}), Claimer=${gameState.players[playerIndex].name}(${playerIndex}), RightRotation=${gameState.players[rightRotation].name}(${rightRotation})`)
        
        if (playerIndex !== rightRotation) {
          gameState.skippedPlayer = rightRotation // Mark original discarder's right rotation as skipped
          console.log(`⏭️ CHOW: Setting skippedPlayer to ${gameState.players[gameState.skippedPlayer].name} (${gameState.skippedPlayer})`)
        } else {
          gameState.skippedPlayer = undefined // Clear any previous skipped player
          console.log(`✅ CHOW: Clearing skippedPlayer - claimer IS the right rotation`)
        }
        return true
      }
      break
    }
      
    case 'pung': {
      const pungTiles = player.hand.filter(t => tilesMatch(t, lastDiscard)).slice(0, 2)
      if (pungTiles.length === 2) {
        // Remove the claimed tile from discard pile
        const discardIndex = gameState.discardPile.findIndex(t => t.id === lastDiscard.id)
        if (discardIndex !== -1) {
          gameState.discardPile.splice(discardIndex, 1)
        }
        
        // Remove tiles from hand
        pungTiles.forEach(tile => {
          const index = player.hand.findIndex(t => t.id === tile.id)
          if (index !== -1) player.hand.splice(index, 1)
        })
        
        // Add meld
        player.melds.push({
          id: `meld-${Date.now()}`,
          type: 'pung',
          tiles: [lastDiscard, ...pungTiles],
          isConcealed: false,
          claimedFrom: gameState.currentPlayer
        })
        
        // Record ambition
        recordAmbition(gameState, claim.playerId, 'kang', 0.25)
        
        // Store original discarder before changing current player
        const originalDiscarder = gameState.currentPlayer
        
        // Set turn to claiming player and mark the original discarder's right rotation as skipped
        gameState.currentPlayer = playerIndex
        gameState.phase = 'discard' // Player must discard after claiming (NO DRAWING)
        gameState.lastDiscard = undefined
        gameState.hasDrawnThisTurn = true // Mark as having "drawn" to prevent further claims until discard
        
        // Only skip if the claiming player is NOT the original discarder's right rotation
        // (i.e., if claiming player is the original discarder's right rotation, don't skip anyone)
        if (playerIndex !== (originalDiscarder + 1) % 4) {
          gameState.skippedPlayer = (originalDiscarder + 1) % 4 // Mark original discarder's right rotation as skipped
        } else {
          gameState.skippedPlayer = undefined // Clear any previous skipped player
        }
        return true
      }
      break
    }
      
    case 'kong': {
      const kongTiles = player.hand.filter(t => tilesMatch(t, lastDiscard)).slice(0, 3)
      if (kongTiles.length === 3) {
        // Remove the claimed tile from discard pile
        const discardIndex = gameState.discardPile.findIndex(t => t.id === lastDiscard.id)
        if (discardIndex !== -1) {
          gameState.discardPile.splice(discardIndex, 1)
        }
        
        // Remove tiles from hand
        kongTiles.forEach(tile => {
          const index = player.hand.findIndex(t => t.id === tile.id)
          if (index !== -1) player.hand.splice(index, 1)
        })
        
        // Add meld
        player.melds.push({
          id: `meld-${Date.now()}`,
          type: 'kong',
          tiles: [lastDiscard, ...kongTiles],
          isConcealed: false,
          claimedFrom: gameState.currentPlayer
        })
        
        // Draw replacement tile for Kong (special case - Kong gets replacement)
        drawTile(gameState, playerIndex)
        
        // Record ambition
        recordAmbition(gameState, claim.playerId, 'kang', 0.25)
        
        // Store original discarder before changing current player
        const originalDiscarder = gameState.currentPlayer
        
        // Set turn to claiming player and mark the original discarder's right rotation as skipped
        gameState.currentPlayer = playerIndex
        gameState.phase = 'discard' // Player must discard after claiming and drawing replacement
        gameState.lastDiscard = undefined
        gameState.hasDrawnThisTurn = true // Mark as having drawn to prevent further claims until discard
        
        // Only skip if the claiming player is NOT the original discarder's right rotation
        // (i.e., if claiming player is the original discarder's right rotation, don't skip anyone)
        if (playerIndex !== (originalDiscarder + 1) % 4) {
          gameState.skippedPlayer = (originalDiscarder + 1) % 4 // Mark original discarder's right rotation as skipped
        } else {
          gameState.skippedPlayer = undefined // Clear any previous skipped player
        }
        return true
      }
      break
    }
      
    case 'win': {
      const winCondition = isWinningHand(player.hand.concat([lastDiscard]), player.melds, player.flowers)
      if (winCondition.isValid) {
        gameState.status = 'finished'
        gameState.winner = playerIndex
        gameState.winType = winCondition.handType
        gameState.phase = 'finished'
        
        // Capture winning hand and winning tile
        gameState.winningTile = lastDiscard
        gameState.winningHand = {
          tiles: [...player.hand, lastDiscard],
          melds: [...player.melds],
          flowers: [...player.flowers]
        }
        
        // Record win ambitions
        winCondition.ambitions.forEach(ambition => {
          recordAmbition(gameState, claim.playerId, ambition, getAmbitionPayout(ambition))
        })
        
        return true
      }
      break
    }
  }
  
  return false
}

// Form a chow from hand tiles and discard
function formChow(hand: Tile[], discard: Tile): Tile[] | null {
  if (!['circles', 'bamboos', 'characters'].includes(discard.suit)) return null
  
  const suitTiles = hand.filter(t => t.suit === discard.suit && t.value)
  const discardValue = discard.value!
  
  console.log(`Forming chow for discard: ${discard.suit} ${discardValue}`)
  console.log(`Available suit tiles:`, suitTiles.map(t => `${t.suit} ${t.value}`))
  
  // Pattern 1: discard + 1 + 2 (e.g., 2-3-4 with discard=2)
  if (discardValue <= 7) {
    const tile1 = suitTiles.find(t => t.value === discardValue + 1)
    const tile2 = suitTiles.find(t => t.value === discardValue + 2)
    if (tile1 && tile2) {
      const chow = [discard, tile1, tile2].sort((a, b) => a.value! - b.value!)
      console.log(`Formed chow pattern 1:`, chow.map(t => `${t.suit} ${t.value}`))
      return chow
    }
  }
  
  // Pattern 2: -1 + discard + 1 (e.g., 2-3-4 with discard=3)
  if (discardValue >= 2 && discardValue <= 8) {
    const tile1 = suitTiles.find(t => t.value === discardValue - 1)
    const tile2 = suitTiles.find(t => t.value === discardValue + 1)
    if (tile1 && tile2) {
      const chow = [tile1, discard, tile2].sort((a, b) => a.value! - b.value!)
      console.log(`Formed chow pattern 2:`, chow.map(t => `${t.suit} ${t.value}`))
      return chow
    }
  }
  
  // Pattern 3: -2 + -1 + discard (e.g., 2-3-4 with discard=4)
  if (discardValue >= 3) {
    const tile1 = suitTiles.find(t => t.value === discardValue - 2)
    const tile2 = suitTiles.find(t => t.value === discardValue - 1)
    if (tile1 && tile2) {
      const chow = [tile1, tile2, discard].sort((a, b) => a.value! - b.value!)
      console.log(`Formed chow pattern 3:`, chow.map(t => `${t.suit} ${t.value}`))
      return chow
    }
  }
  
  console.log('Could not form chow')
  return null
}

// Check if hand is a winning hand (17 tiles total)
export function isWinningHand(hand: Tile[], melds: Meld[], flowers: Tile[]): WinCondition {
  const totalTiles = hand.length + melds.reduce((sum, meld) => sum + meld.tiles.length, 0)
  
  if (totalTiles !== 17) {
    return { isValid: false, handType: '', ambitions: [], totalPayout: 0, breakdown: {} }
  }
  
  // Check for special hands first
  if (isSietePares(hand)) {
    return {
      isValid: true,
      handType: 'Siete Pares',
      ambitions: ['todas', 'siete_pares'],
      totalPayout: 1.5,
      breakdown: { 'Basic Win': 1, 'Siete Pares': 0.5 }
    }
  }
  
  // Check standard hand: 5 trios + 1 pair
  const standardWin = checkStandardWin(hand, melds)
  if (standardWin.isValid) {
    const ambitions: AmbitionType[] = ['todas']
    let totalPayout = 1
    const breakdown: { [key: string]: number } = { 'Basic Win': 1 }
    
    // Check for additional ambitions
    if (isEscalera(melds)) {
      ambitions.push('escalera')
      totalPayout += 0.5
      breakdown['Escalera'] = 0.5
    }
    
    if (flowers.length === 0) {
      ambitions.push('no_flowers_end')
      totalPayout += 0.25
      breakdown['No Flowers'] = 0.25
    }
    
    const concealedMelds = melds.filter(m => m.isConcealed).length
    if (concealedMelds === melds.length && melds.length > 0) {
      ambitions.push('all_up')
      totalPayout += 0.25
      breakdown['All Up'] = 0.25
    }
    
    return {
      isValid: true,
      handType: standardWin.handType,
      ambitions,
      totalPayout,
      breakdown
    }
  }
  
  return { isValid: false, handType: '', ambitions: [], totalPayout: 0, breakdown: {} }
}

// Check for Siete Pares (7 pairs + 1 trio)
function isSietePares(hand: Tile[]): boolean {
  if (hand.length !== 17) return false
  
  const tileCounts = new Map<string, number>()
  
  hand.forEach(tile => {
    const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`
    tileCounts.set(key, (tileCounts.get(key) || 0) + 1)
  })
  
  const counts = Array.from(tileCounts.values()).sort((a, b) => b - a)
  
  // Rule 1: One triple (3) and seven pairs (2 each) = 8 unique tile types
  const hasTripleAndPairs = counts.length === 8 && counts[0] === 3 && counts.slice(1).every(c => c === 2)
  
  if (hasTripleAndPairs) return true
  
  // Rule 2: Check if we can form 7 pairs + 1 trio (sequence or triplet)
  // This means we could have different combinations like 6 pairs + 1 triplet + 1 sequence
  return checkSevenPairsWithTrio(hand)
}

// Check for 7 pairs + 1 trio (either sequence or triplet)
function checkSevenPairsWithTrio(hand: Tile[]): boolean {
  const tiles = [...hand]
  let hasTrioOrSequence = false
  
  // Try to find 7 pairs and 1 trio
  const tileCounts = new Map<string, { tiles: Tile[], count: number }>()
  
  tiles.forEach(tile => {
    const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`
    if (!tileCounts.has(key)) {
      tileCounts.set(key, { tiles: [], count: 0 })
    }
    const entry = tileCounts.get(key)!
    entry.tiles.push(tile)
    entry.count++
  })
  
  // Count exact pairs (groups of 2)
  const pairs: Tile[][] = []
  const remaining: Tile[] = []
  
  for (const [key, entry] of tileCounts) {
    if (entry.count === 2) {
      pairs.push(entry.tiles)
    } else if (entry.count === 3) {
      // This could be our trio
      if (!hasTrioOrSequence) {
        hasTrioOrSequence = true
      } else {
        // Too many trios
        return false
      }
    } else if (entry.count === 1) {
      remaining.push(...entry.tiles)
    } else if (entry.count === 4) {
      // Could be 2 pairs or 1 quad (not valid for this pattern)
      pairs.push([entry.tiles[0], entry.tiles[1]])
      pairs.push([entry.tiles[2], entry.tiles[3]])
    } else {
      // Invalid count
      return false
    }
  }
  
  // If we don't have a triplet, check if remaining tiles can form a sequence
  if (!hasTrioOrSequence && remaining.length === 3) {
    hasTrioOrSequence = canFormSequenceFromTiles(remaining)
  }
  
  return pairs.length === 7 && hasTrioOrSequence
}

// Check if 3 tiles can form a sequence
function canFormSequenceFromTiles(tiles: Tile[]): boolean {
  if (tiles.length !== 3) return false
  
  // All tiles must be from the same numbered suit
  const suit = tiles[0].suit
  if (!['circles', 'bamboos', 'characters'].includes(suit)) return false
  
  if (!tiles.every(t => t.suit === suit && t.value)) return false
  
  const values = tiles.map(t => t.value!).sort((a, b) => a - b)
  return values[1] === values[0] + 1 && values[2] === values[1] + 1
}

// Check standard winning hand structure: 5 trios + 1 pair
function checkStandardWin(hand: Tile[], melds: Meld[]): { isValid: boolean; handType: string } {
  // Create a copy of the hand to work with
  const remainingTiles = [...hand]
  
  // Try to find the winning combination: 5 trios + 1 pair
  const result = findWinningCombination(remainingTiles, melds)
  
  if (result.isValid) {
    return { isValid: true, handType: 'Standard Win' }
  }
  
  return { isValid: false, handType: '' }
}

// Find a valid winning combination of 5 trios + 1 pair
function findWinningCombination(tiles: Tile[], existingMelds: Meld[]): { isValid: boolean; trios: Tile[][]; pair: Tile[] } {
  // We need to form (5 - existingMelds.length) more trios from remaining tiles
  const neededTrios = 5 - existingMelds.length
  
  // Try all possible combinations to find trios and a pair
  return findTriosAndPair(tiles, neededTrios)
}

// Recursively find the required number of trios and exactly one pair
function findTriosAndPair(tiles: Tile[], neededTrios: number): { isValid: boolean; trios: Tile[][]; pair: Tile[] } {
  if (neededTrios === 0) {
    // We've found all needed trios, now check if remaining tiles form exactly one pair
    if (tiles.length === 2 && tilesMatch(tiles[0], tiles[1])) {
      return { isValid: true, trios: [], pair: tiles }
    }
    return { isValid: false, trios: [], pair: [] }
  }
  
  if (tiles.length < 3) {
    return { isValid: false, trios: [], pair: [] }
  }
  
  // Try to form a trio (either triplet or sequence)
  for (let i = 0; i < tiles.length - 2; i++) {
    // Try triplet first (3 of the same)
    const triplet = findTriplet(tiles, i)
    if (triplet.length === 3) {
      const remainingTiles = tiles.filter(t => !triplet.some(tt => tt.id === t.id))
      const result = findTriosAndPair(remainingTiles, neededTrios - 1)
      if (result.isValid) {
        return { isValid: true, trios: [triplet, ...result.trios], pair: result.pair }
      }
    }
    
    // Try sequence (straight like 2-3-4 of same suit)
    const sequence = findSequence(tiles, i)
    if (sequence.length === 3) {
      const remainingTiles = tiles.filter(t => !sequence.some(st => st.id === t.id))
      const result = findTriosAndPair(remainingTiles, neededTrios - 1)
      if (result.isValid) {
        return { isValid: true, trios: [sequence, ...result.trios], pair: result.pair }
      }
    }
  }
  
  return { isValid: false, trios: [], pair: [] }
}

// Find a triplet starting from a specific tile
function findTriplet(tiles: Tile[], startIndex: number): Tile[] {
  const baseTile = tiles[startIndex]
  const matchingTiles = tiles.filter(t => tilesMatch(t, baseTile))
  
  if (matchingTiles.length >= 3) {
    return matchingTiles.slice(0, 3)
  }
  
  return []
}

// Find a sequence starting from a specific tile
function findSequence(tiles: Tile[], startIndex: number): Tile[] {
  const baseTile = tiles[startIndex]
  
  // Only numbered suits can form sequences
  if (!['circles', 'bamboos', 'characters'].includes(baseTile.suit) || !baseTile.value) {
    return []
  }
  
  const suit = baseTile.suit
  const value = baseTile.value
  
  // Look for consecutive tiles in the same suit
  const nextTile = tiles.find(t => t.suit === suit && t.value === value + 1)
  const nextNextTile = tiles.find(t => t.suit === suit && t.value === value + 2)
  
  if (nextTile && nextNextTile) {
    return [baseTile, nextTile, nextNextTile]
  }
  
  return []
}

// Find all possible groups in remaining tiles
function findAllGroups(tiles: Tile[]): Tile[][] {
  // Simplified grouping logic - in a real implementation, this would be more complex
  const groups: Tile[][] = []
  const remaining = [...tiles]
  
  // Find pairs first
  for (let i = 0; i < remaining.length - 1; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      if (tilesMatch(remaining[i], remaining[j])) {
        groups.push([remaining[i], remaining[j]])
        remaining.splice(j, 1)
        remaining.splice(i, 1)
        break
      }
    }
  }
  
  return groups
}

// Check for Escalera (1-9 straight in one suit)
function isEscalera(melds: Meld[]): boolean {
  const chows = melds.filter(m => m.type === 'chow')
  if (chows.length < 3) return false
  
  // Check if we have 1-2-3, 4-5-6, 7-8-9 in same suit
  const suitGroups = new Map<string, number[][]>()
  
  chows.forEach(chow => {
    const suit = chow.tiles[0].suit
    const values = chow.tiles.map(t => t.value!).sort((a, b) => a - b)
    
    if (!suitGroups.has(suit)) {
      suitGroups.set(suit, [])
    }
    suitGroups.get(suit)!.push(values)
  })
  
  // Check each suit for complete 1-9 sequence
  for (const [suit, sequences] of suitGroups) {
    const flatValues = sequences.flat().sort((a, b) => a - b)
    const expectedSequence = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    
    if (JSON.stringify(flatValues) === JSON.stringify(expectedSequence)) {
      return true
    }
  }
  
  return false
}

// Record an ambition
function recordAmbition(gameState: GameState, playerId: string, type: AmbitionType, payout: number): void {
  gameState.ambitions.push({
    id: `ambition-${Date.now()}`,
    playerId,
    type,
    payout,
    isInstant: ['kang', 'secret', 'sagasa', 'thirteen_flowers', 'no_flowers_start'].includes(type),
    timestamp: Date.now()
  })
}

// Get payout amount for ambition
function getAmbitionPayout(ambition: AmbitionType): number {
  const payouts: { [key in AmbitionType]: number } = {
    kang: 0.25,
    secret: 0.5,
    sagasa: 0.5,
    thirteen_flowers: 0.25,
    no_flowers_start: 0.25,
    todas: 1,
    escalera: 0.5,
    siete_pares: 0.5,
    no_flowers_end: 0.25,
    all_up: 0.25,
    all_down: 0.25,
    all_chow: 0.25,
    all_pung: 0.25,
    single: 0.25,
    bisaklat: 1
  }
  
  return payouts[ambition] || 0
}
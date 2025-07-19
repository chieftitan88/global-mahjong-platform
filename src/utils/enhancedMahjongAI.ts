import { GameState, Player, Tile } from '@/types/mahjong'
import { tilesMatch, sortTiles } from '@/utils/mahjongTiles'
import { isWinningHand } from '@/utils/filipinoMahjongLogic'

// Enhanced AI that actively pursues winning strategies
export class EnhancedMahjongAI {
  private difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  
  constructor(difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'expert') {
    this.difficulty = difficulty
  }

  // Main AI decision making function
  makeDecision(gameState: GameState, playerId: string): {
    action: 'draw' | 'discard' | 'win'
    tile?: Tile
  } {
    const player = gameState.players.find(p => p.id === playerId)
    if (!player) return { action: 'draw' }

    // Check if we can win immediately
    const winCheck = this.checkForWin(player, gameState.lastDiscard)
    if (winCheck.canWin) {
      return { action: 'win' }
    }

    // Claims are now handled centrally in handleClaimWindow during claimResolution phase
    // AI should not make claim decisions during their own turn

    // If it's our turn to discard, choose the best tile to discard
    if (gameState.phase === 'discard' && gameState.currentPlayer === gameState.players.findIndex(p => p.id === playerId)) {
      const discardTile = this.chooseBestDiscard(player, gameState)
      return { action: 'discard', tile: discardTile }
    }

    // Default to drawing
    return { action: 'draw' }
  }

  // Check if we can win with current hand + optional extra tile
  private checkForWin(player: Player, extraTile?: Tile): { canWin: boolean; winType?: string } {
    const testHand = extraTile ? [...player.hand, extraTile] : player.hand
    const winCondition = isWinningHand(testHand, player.melds, player.flowers)
    
    return {
      canWin: winCondition.isValid,
      winType: winCondition.handType
    }
  }

  // Note: Claim logic moved to filipinoMahjongLogic.ts handleClaimWindow function
  // AI claim decisions are now made centrally during claimResolution phase

  // Choose the best tile to discard using advanced strategy
  private chooseBestDiscard(player: Player, gameState: GameState): Tile {
    const hand = [...player.hand]
    let bestDiscard = hand[0]
    let lowestValue = Infinity

    // First, check if we're close to winning and prioritize accordingly
    const winningAnalysis = this.analyzeWinningPotential(player)
    
    // If we're very close to winning (1-2 tiles away), be more conservative
    if (winningAnalysis.tilesAwayFromWin <= 2) {
      console.log(`AI ${player.name} is ${winningAnalysis.tilesAwayFromWin} tiles away from winning - being conservative`)
      
      // Prioritize keeping tiles that lead to winning combinations
      for (const tile of hand) {
        const value = this.evaluateDiscardValueForWin(tile, player, gameState, winningAnalysis)
        if (value < lowestValue) {
          lowestValue = value
          bestDiscard = tile
        }
      }
    } else {
      // Normal discard strategy
      for (const tile of hand) {
        const value = this.evaluateDiscardValue(tile, player, gameState)
        if (value < lowestValue) {
          lowestValue = value
          bestDiscard = tile
        }
      }
    }

    return bestDiscard
  }

  // Evaluate how valuable a tile is to keep (lower = better to discard)
  private evaluateDiscardValue(tile: Tile, player: Player, gameState: GameState): number {
    let value = 0

    // Base value - honor tiles are generally less useful for sequences
    if (tile.suit === 'winds' || tile.suit === 'dragons') {
      value += 20
    } else {
      value += 10
    }

    // Check if tile is part of potential melds
    const remainingHand = player.hand.filter(t => t.id !== tile.id)
    
    // Value for potential triplets
    const matchingTiles = remainingHand.filter(t => tilesMatch(t, tile))
    if (matchingTiles.length >= 2) {
      value -= 50 // Very valuable - part of potential kong
    } else if (matchingTiles.length === 1) {
      value -= 25 // Valuable - part of potential pung
    }

    // Value for potential sequences (only for numbered suits)
    if (['circles', 'bamboos', 'characters'].includes(tile.suit) && tile.value) {
      const sequenceValue = this.evaluateSequencePotential(tile, remainingHand)
      value -= sequenceValue
    }

    // Avoid discarding tiles that opponents might need
    const dangerValue = this.evaluateDangerLevel(tile, gameState)
    value += dangerValue

    // Terminal tiles (1, 9) are less flexible
    if (tile.value === 1 || tile.value === 9) {
      value += 5
    }

    // Middle tiles (4, 5, 6) are more flexible
    if (tile.value && tile.value >= 4 && tile.value <= 6) {
      value -= 5
    }

    return value
  }

  // Evaluate potential for sequences
  private evaluateSequencePotential(tile: Tile, hand: Tile[]): number {
    if (!tile.value || !['circles', 'bamboos', 'characters'].includes(tile.suit)) {
      return 0
    }

    let potential = 0
    const suitTiles = hand.filter(t => t.suit === tile.suit && t.value)
    const value = tile.value

    // Check for adjacent tiles
    const hasLower = suitTiles.some(t => t.value === value - 1)
    const hasHigher = suitTiles.some(t => t.value === value + 1)
    const hasLower2 = suitTiles.some(t => t.value === value - 2)
    const hasHigher2 = suitTiles.some(t => t.value === value + 2)

    // Complete sequence potential
    if (hasLower && hasHigher) potential += 30
    
    // Two-tile sequence potential
    if (hasLower || hasHigher) potential += 15
    
    // Gap sequence potential
    if (hasLower2 || hasHigher2) potential += 10

    return potential
  }

  // Evaluate how dangerous it is to discard this tile
  private evaluateDangerLevel(tile: Tile, gameState: GameState): number {
    let danger = 0

    // Check what other players have discarded
    const allDiscards = gameState.players.flatMap(p => p.discards)
    const sameTypeDiscards = allDiscards.filter(t => tilesMatch(t, tile))

    // If others have discarded the same tile, it's safer
    danger -= sameTypeDiscards.length * 5

    // If it's a middle value tile, it's more dangerous
    if (tile.value && tile.value >= 4 && tile.value <= 6) {
      danger += 10
    }

    // Honor tiles are generally safer to discard
    if (tile.suit === 'winds' || tile.suit === 'dragons') {
      danger -= 5
    }

    return danger
  }

  // Evaluate overall hand value for strategic decisions
  private evaluateHandValue(hand: Tile[], melds: any[]): number {
    let value = 0

    // Points for completed melds
    value += melds.length * 30

    // Points for potential melds in hand
    const tileCounts = new Map<string, number>()
    hand.forEach(tile => {
      const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1)
    })

    // Value pairs and triplets
    for (const count of tileCounts.values()) {
      if (count >= 3) value += 25
      else if (count === 2) value += 15
    }

    // Value potential sequences
    const suits = ['circles', 'bamboos', 'characters']
    for (const suit of suits) {
      const suitTiles = hand.filter(t => t.suit === suit && t.value).sort((a, b) => a.value! - b.value!)
      value += this.evaluateSequencePatterns(suitTiles) * 10
    }

    // Bonus for having fewer tiles (closer to winning)
    value += (17 - hand.length) * 5

    return value
  }

  // Evaluate sequence patterns in a suit
  private evaluateSequencePatterns(suitTiles: Tile[]): number {
    if (suitTiles.length < 2) return 0

    let patterns = 0
    const values = suitTiles.map(t => t.value!).sort((a, b) => a - b)

    // Count consecutive sequences
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i + 1] === values[i] + 1) {
        patterns += 1
        // Bonus for longer sequences
        if (i < values.length - 2 && values[i + 2] === values[i] + 2) {
          patterns += 2
        }
      }
    }

    return patterns
  }

  // Analyze how close the player is to winning
  private analyzeWinningPotential(player: Player): {
    tilesAwayFromWin: number
    potentialWinningTiles: Tile[]
    bestStrategy: 'pairs' | 'sequences' | 'mixed'
  } {
    const hand = [...player.hand]
    const totalMelds = player.melds.length
    
    // Check for Siete Pares potential (7 pairs + 1 trio)
    const pairsAnalysis = this.analyzePairsStrategy(hand)
    
    // Check for standard win potential (5 trios + 1 pair)
    const standardAnalysis = this.analyzeStandardStrategy(hand, totalMelds)
    
    // Return the better strategy
    if (pairsAnalysis.tilesAwayFromWin <= standardAnalysis.tilesAwayFromWin) {
      return {
        tilesAwayFromWin: pairsAnalysis.tilesAwayFromWin,
        potentialWinningTiles: pairsAnalysis.potentialWinningTiles,
        bestStrategy: 'pairs'
      }
    } else {
      return {
        tilesAwayFromWin: standardAnalysis.tilesAwayFromWin,
        potentialWinningTiles: standardAnalysis.potentialWinningTiles,
        bestStrategy: standardAnalysis.tilesAwayFromWin <= 3 ? 'sequences' : 'mixed'
      }
    }
  }

  // Analyze pairs strategy potential
  private analyzePairsStrategy(hand: Tile[]): {
    tilesAwayFromWin: number
    potentialWinningTiles: Tile[]
  } {
    const tileCounts = new Map<string, Tile[]>()
    
    hand.forEach(tile => {
      const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`
      if (!tileCounts.has(key)) {
        tileCounts.set(key, [])
      }
      tileCounts.get(key)!.push(tile)
    })
    
    let pairs = 0
    let singles = 0
    let triples = 0
    
    for (const tiles of tileCounts.values()) {
      if (tiles.length === 2) pairs++
      else if (tiles.length === 1) singles++
      else if (tiles.length === 3) triples++
      else if (tiles.length === 4) pairs += 2 // 4 of a kind = 2 pairs
    }
    
    // Need 7 pairs + 1 triple (or equivalent)
    const neededPairs = Math.max(0, 7 - pairs)
    const neededTriples = Math.max(0, 1 - triples)
    
    // Estimate tiles away from win
    let tilesAway = neededPairs + neededTriples
    
    // Singles can become pairs with 1 more tile
    const availableSingles = Math.min(singles, neededPairs)
    tilesAway = Math.max(0, tilesAway - availableSingles)
    
    return {
      tilesAwayFromWin: tilesAway,
      potentialWinningTiles: [] // Simplified for now
    }
  }

  // Analyze standard strategy potential
  private analyzeStandardStrategy(hand: Tile[], existingMelds: number): {
    tilesAwayFromWin: number
    potentialWinningTiles: Tile[]
  } {
    const neededMelds = 5 - existingMelds
    const neededPairs = 1
    
    // Count potential melds in hand
    let potentialMelds = 0
    let potentialPairs = 0
    
    // Count existing pairs and near-sequences
    const tileCounts = new Map<string, number>()
    hand.forEach(tile => {
      const key = `${tile.suit}-${tile.value}-${tile.wind}-${tile.dragon}`
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1)
    })
    
    // Count pairs and triplets
    for (const count of tileCounts.values()) {
      if (count >= 3) potentialMelds++
      else if (count === 2) potentialPairs++
    }
    
    // Count potential sequences
    const suits = ['circles', 'bamboos', 'characters']
    for (const suit of suits) {
      const suitTiles = hand.filter(t => t.suit === suit && t.value).sort((a, b) => a.value! - b.value!)
      potentialMelds += this.countPotentialSequences(suitTiles)
    }
    
    // Estimate tiles away from win
    const meldsShortfall = Math.max(0, neededMelds - potentialMelds)
    const pairsShortfall = Math.max(0, neededPairs - potentialPairs)
    
    return {
      tilesAwayFromWin: meldsShortfall + pairsShortfall,
      potentialWinningTiles: [] // Simplified for now
    }
  }

  // Count potential sequences in a suit
  private countPotentialSequences(suitTiles: Tile[]): number {
    if (suitTiles.length < 3) return 0
    
    let sequences = 0
    const values = suitTiles.map(t => t.value!)
    
    // Look for consecutive runs
    for (let i = 0; i <= values.length - 3; i++) {
      if (values[i + 1] === values[i] + 1 && values[i + 2] === values[i] + 2) {
        sequences++
        i += 2 // Skip the next 2 tiles as they're part of this sequence
      }
    }
    
    return sequences
  }

  // Evaluate discard value when close to winning
  private evaluateDiscardValueForWin(tile: Tile, player: Player, gameState: GameState, winningAnalysis: any): number {
    let value = 0
    
    // Base penalty for discarding when close to win
    value += 50
    
    // Heavy penalty for discarding tiles that could complete winning combinations
    if (winningAnalysis.bestStrategy === 'pairs') {
      // For pairs strategy, heavily penalize discarding singles that could become pairs
      const matchingTiles = player.hand.filter(t => 
        t.suit === tile.suit && t.value === tile.value && 
        t.wind === tile.wind && t.dragon === tile.dragon && t.id !== tile.id
      )
      
      if (matchingTiles.length === 1) {
        value += 100 // Very high penalty for breaking potential pairs
      } else if (matchingTiles.length === 0) {
        value -= 20 // Lower penalty for isolated tiles
      }
    } else {
      // For sequences strategy, penalize breaking potential sequences
      if (['circles', 'bamboos', 'characters'].includes(tile.suit) && tile.value) {
        const sequencePotential = this.evaluateSequencePotential(tile, player.hand.filter(t => t.id !== tile.id))
        value += sequencePotential * 2 // Double the sequence value when close to winning
      }
      
      // Penalize breaking potential triplets
      const matchingTiles = player.hand.filter(t => 
        t.suit === tile.suit && t.value === tile.value && 
        t.wind === tile.wind && t.dragon === tile.dragon && t.id !== tile.id
      )
      
      if (matchingTiles.length >= 2) {
        value += 150 // Extremely high penalty for breaking triplets when close to win
      } else if (matchingTiles.length === 1) {
        value += 75 // High penalty for breaking pairs
      }
    }
    
    return value
  }

  // Get AI difficulty settings
  getDifficultySettings() {
    const settings = {
      easy: { claimThreshold: 5, discardRandomness: 0.3, winPursuitAggression: 0.3 },
      medium: { claimThreshold: 10, discardRandomness: 0.2, winPursuitAggression: 0.6 },
      hard: { claimThreshold: 15, discardRandomness: 0.1, winPursuitAggression: 0.8 },
      expert: { claimThreshold: 20, discardRandomness: 0.05, winPursuitAggression: 1.0 }
    }
    
    return settings[this.difficulty]
  }
}

// Factory function to create AI instances
export function createEnhancedAI(difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'expert'): EnhancedMahjongAI {
  return new EnhancedMahjongAI(difficulty)
}

// Helper function to simulate AI thinking time (for realism)
export function simulateThinkingTime(complexity: number = 1): Promise<void> {
  const baseTime = 500 // 0.5 seconds
  const thinkingTime = baseTime + (Math.random() * 1000 * complexity) // Up to 1 second additional
  return new Promise(resolve => setTimeout(resolve, thinkingTime))
}
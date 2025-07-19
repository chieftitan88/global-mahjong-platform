import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GameTable } from '@/components/mahjong/GameTable'
import WinningHandViewer from '@/components/mahjong/WinningHandViewer'
import { GameState, Player, Tile, ClaimAction } from '@/types/mahjong'
import {
  initializeGame,
  drawTile,
  discardTile,
  processClaim,
  isValidClaim,
  handleClaimWindow,
  validateGameState,
} from '@/utils/filipinoMahjongLogic'
import { createEnhancedAI, simulateThinkingTime } from '@/utils/enhancedMahjongAI'
import { blink } from '@/blink/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Users, Trophy, Clock } from 'lucide-react'
import { playDiscard, playDraw, playWin, playClaim, initializeSounds } from '@/utils/soundEffects'



export function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claimTimeout, setClaimTimeout] = useState<number | null>(null)
  const [showWinningHand, setShowWinningHand] = useState(false)
  const [aiInstances] = useState(() => ({
    'ai-1': createEnhancedAI('expert'),
    'ai-2': createEnhancedAI('expert'), 
    'ai-3': createEnhancedAI('expert')
  }))

  // Dummy notification function (notifications integrated into status display)
  const showGameNotification = useCallback((title: string, description: string) => {
    // Notifications are now integrated into the dynamic status display
  }, [])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setCurrentUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (currentUser && gameId) {
      initializeGameState()
    }
  }, [currentUser, gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle claim resolution phase with centralized logic
  useEffect(() => {
    if (gameState?.phase === 'claimResolution' && currentUser && gameState.claimWindow) {
      console.log('🎯 Entering claim resolution phase for discard:', gameState.lastDiscard)
      console.log('🎯 Claim window start time:', gameState.claimWindow.startTime)
      
      // Only start claim window if we haven't already started one for this discard
      const now = Date.now()
      const timeSinceDiscard = now - gameState.claimWindow.startTime
      
      if (timeSinceDiscard < 1000) { // Only start if discard is fresh (less than 1 second old)
        handleClaimWindow(
          gameState,
          currentUser.id,
          aiInstances,
                  (newState) => {
          console.log('📝 State updated from claim window')
          console.log(`📝 Updated state - Current player: ${newState.players[newState.currentPlayer].name}, Phase: ${newState.phase}`)
          setGameState({ ...newState })
        },
          () => {}, // Dummy notification function (notifications integrated into status display)
                  () => {
          console.log('🤖 Continuing AI simulation after claim resolution')
          
          // Use the latest game state from React state, not the stale closure
          setGameState(currentGameState => {
            if (!currentGameState || !currentUser) {
              console.log('❌ Cannot continue AI - missing game state or user')
              return currentGameState
            }
            
            console.log(`Current player after claim resolution: ${currentGameState.players[currentGameState.currentPlayer].name} (index: ${currentGameState.currentPlayer})`)
            console.log(`Current phase: ${currentGameState.phase}`)
            
            if (currentGameState.players[currentGameState.currentPlayer].id !== currentUser.id) {
              console.log('🚀 Starting AI simulation for current player')
              setTimeout(() => simulateAITurn(currentGameState), 1000)
            } else {
              console.log('👤 Current player is human, waiting for user action')
            }
            
            return currentGameState // Don't change state, just use it
          })
        }
        )
      } else {
        console.log('⏰ Skipping claim window - discard is too old (likely already processed)')
      }
    }
  }, [gameState?.phase, gameState?.claimWindow?.startTime, currentUser?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle game finished state
  useEffect(() => {
    if (gameState?.status === 'finished' && gameState.winner !== undefined) {
      const winner = gameState.players[gameState.winner]
      playWin()
      // Show winning hand viewer
      setShowWinningHand(true)
      console.log(`🏆 Game finished! Winner: ${winner.name}, Win type: ${gameState.winType}`)
    }
  }, [gameState?.status, gameState?.winner]) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeGameState = async () => {
    try {
      // Check if this is a quick match
      if (gameId === 'quick-match') {
        // Immediately start a game with AI opponents
        const quickMatchPlayers: Player[] = [
          {
            id: currentUser.id,
            name: currentUser.displayName || 'You',
            avatar: currentUser.avatar,
            rating: currentUser.rating || 1500,
            hand: [],
            melds: [],
            flowers: [],
            discards: [],
            isDealer: true, // User starts as dealer in quick match
            isConnected: true,
            hasVideo: false // No video in quick match for simplicity
          },
          {
            id: 'ai-1',
            name: 'Chen Wei',
            rating: 2150,
            hand: [],
            melds: [],
            flowers: [],
            discards: [],
            isDealer: false,
            isConnected: true,
            hasVideo: false
          },
          {
            id: 'ai-2',
            name: 'Yuki Tanaka',
            rating: 2380,
            hand: [],
            melds: [],
            flowers: [],
            discards: [],
            isDealer: false,
            isConnected: true,
            hasVideo: false
          },
          {
            id: 'ai-3',
            name: 'Sarah Kim',
            rating: 2050,
            hand: [],
            melds: [],
            flowers: [],
            discards: [],
            isDealer: false,
            isConnected: true,
            hasVideo: false
          }
        ]

        const newGameState = initializeGame(quickMatchPlayers)
        setGameState(newGameState)
        
            // Quick match notification integrated into status display
        
        // Start AI turn simulation if it's not user's turn
        if (newGameState.currentPlayer !== 0) {
          setTimeout(() => simulateAITurn(newGameState), 2000)
        }
        
        return
      }
      
      // For any other gameId, treat as practice game

      // Fallback to AI practice game
      const mockPlayers: Player[] = [
        {
          id: currentUser.id,
          name: currentUser.displayName || 'You',
          avatar: currentUser.avatar,
          rating: 1500,
          hand: [],
          melds: [],
          flowers: [],
          discards: [],
          isDealer: false,
          isConnected: true,
          hasVideo: true
        },
        {
          id: 'ai-1',
          name: 'Chen Wei',
          rating: 2150,
          hand: [],
          melds: [],
          flowers: [],
          discards: [],
          isDealer: false,
          isConnected: true,
          hasVideo: false
        },
        {
          id: 'ai-2',
          name: 'Yuki Tanaka',
          rating: 2380,
          hand: [],
          melds: [],
          flowers: [],
          discards: [],
          isDealer: false,
          isConnected: true,
          hasVideo: true
        },
        {
          id: 'ai-3',
          name: 'Sarah Kim',
          rating: 2050,
          hand: [],
          melds: [],
          flowers: [],
          discards: [],
          isDealer: false,
          isConnected: true,
          hasVideo: false
        }
      ]

      const newGameState = initializeGame(mockPlayers)
      setGameState(newGameState)
      
      // Start AI turn simulation
      if (newGameState.currentPlayer !== 0) {
        setTimeout(() => simulateAITurn(newGameState), 2000)
      }
    } catch (err) {
      setError('Failed to initialize game')
      console.error('Game initialization error:', err)
    }
  }

  const simulateAITurn = async (currentGameState: GameState) => {
    if (!currentGameState || currentGameState.status !== 'playing' || currentGameState.phase === 'finished') {
      console.log('❌ AI turn cancelled: game not playing, finished, or null state')
      return
    }
    
    // Claims are now handled centrally in handleClaimWindow

    const currentPlayerIndex = currentGameState.currentPlayer
    const currentPlayer = currentGameState.players[currentPlayerIndex]
    
    console.log(`🎯 simulateAITurn called for ${currentPlayer.name} (phase: ${currentGameState.phase})`)
    
    if (currentPlayer.id === currentUser?.id) {
      console.log('❌ AI turn cancelled: current player is human')
      return // Don't simulate user turns
    }

    const ai = aiInstances[currentPlayer.id as keyof typeof aiInstances]
    if (!ai) {
      console.log('❌ AI turn cancelled: no AI instance found')
      return
    }

    try {
      // Get AI decision
      const decision = ai.makeDecision(currentGameState, currentPlayer.id)
      
      // Show AI thinking indicator
      showGameNotification(`${currentPlayer.name} is thinking...`, 
        decision.action === 'draw' ? "Drawing a tile" : 
        decision.action === 'discard' ? "Choosing which tile to discard" : "Analyzing hand")

      // Simulate thinking time
      await simulateThinkingTime(1.5)

      // Execute AI decision
      switch (decision.action) {
        case 'draw':
          if (currentGameState.phase === 'draw') {
            const drawnTile = drawTile(currentGameState, currentPlayerIndex)
            console.log(`AI ${currentPlayer.name} drew a tile. Hand size: ${currentPlayer.hand.length}`)
            playDraw()
            setGameState({ ...currentGameState })
            
            showGameNotification(`${currentPlayer.name} drew a tile`, `Hand size: ${currentPlayer.hand.length}`)
            
            // After drawing, continue with discard decision
            setTimeout(() => simulateAITurn(currentGameState), 1000)
          }
          break

        case 'discard':
          if (currentGameState.phase === 'discard' && decision.tile) {
            console.log(`AI ${currentPlayer.name} discarding strategically. Hand size before: ${currentPlayer.hand.length}`)
            
            // Validate state before discard
            const preValidation = validateGameState(currentGameState)
            if (!preValidation.isValid) {
              console.warn('⚠️ Pre-discard validation issues:', preValidation.errors)
            }
            
            discardTile(currentGameState, currentPlayerIndex, decision.tile)
            console.log(`AI ${currentPlayer.name} discarded. Hand size after: ${currentPlayer.hand.length}`)
            playDiscard()
            setGameState({ ...currentGameState })
            
            showGameNotification(`${currentPlayer.name} discarded`, 
              `${decision.tile.suit} ${decision.tile.value || decision.tile.wind || decision.tile.dragon}`)
            
            // The discardTile function now automatically enters claimResolution phase
            // Our useEffect will handle the claim window logic
          }
          break



        case 'win': {
          // AI declares win
          const winClaim: ClaimAction = { type: 'win', playerId: currentPlayer.id }
          const success = processClaim(currentGameState, winClaim)
          if (success) {
            setGameState({ ...currentGameState })
            playWin()
            showGameNotification(`${currentPlayer.name} wins!`, "Congratulations to the winner!")
          }
          break
        }
      }
    } catch (error) {
      console.error('AI decision error:', error)
      // Fallback to simple random decision
      if (currentGameState.phase === 'draw') {
        const drawnTile = drawTile(currentGameState, currentPlayerIndex)
        if (drawnTile) {
          playDraw()
          setGameState({ ...currentGameState })
          setTimeout(() => simulateAITurn(currentGameState), 1000)
        }
      } else if (currentGameState.phase === 'discard' && currentPlayer.hand.length > 0) {
        const randomTile = currentPlayer.hand[Math.floor(Math.random() * currentPlayer.hand.length)]
        discardTile(currentGameState, currentPlayerIndex, randomTile)
        playDiscard()
        setGameState({ ...currentGameState })
      }
    }
  }

   const handleTileClick = (tile: Tile) => {
    if (!gameState || !currentUser) return
    
    const playerIndex = gameState.players.findIndex(p => p.id === currentUser.id)
    if (playerIndex === -1 || gameState.currentPlayer !== playerIndex) return
    
    const player = gameState.players[playerIndex]
    
    // Check if player needs to draw first
    if (gameState.phase === 'draw') {
      console.log(`User needs to draw a tile first. Current phase: ${gameState.phase}`)
      const drawnTile = drawTile(gameState, playerIndex)
      if (drawnTile) {
        console.log(`User drew a tile: ${drawnTile.suit} ${drawnTile.value}. New hand size: ${player.hand.length}`)
        playDraw() // Play draw sound
        setGameState({ ...gameState })
      }
      return // Don't process tile selection until after drawing
    }
    
    console.log('Tile clicked:', tile)
  }

  const handleDiscard = (tile: Tile) => {
    if (!gameState || !currentUser) return

    const playerIndex = gameState.players.findIndex(p => p.id === currentUser.id)
    if (playerIndex === -1 || gameState.currentPlayer !== playerIndex) return

    // Only allow discard when in discard phase
    if (gameState.phase !== 'discard') {
      console.log(`Cannot discard during ${gameState.phase} phase`)
      return
    }

    const player = gameState.players[playerIndex]
    console.log(`User discarding. Hand size before: ${player.hand.length}`)
    
    // Validate state before discard
    const preValidation = validateGameState(gameState)
    if (!preValidation.isValid) {
      console.warn('⚠️ Pre-discard validation issues:', preValidation.errors)
    }
    
    discardTile(gameState, playerIndex, tile)
    console.log(`User discarded. Hand size after: ${player.hand.length}`)
    
    playDiscard() // Play discard sound
    setGameState({ ...gameState })
    
    // The discardTile function now automatically enters claimResolution phase
    // Our useEffect will handle the claim window logic
  }

  const handleClaim = (action: ClaimAction) => {
    if (!gameState) return

    console.log('👤 Human player making claim:', action)
    
    // Clear any ongoing claim window
    if (gameState.claimWindow?.cleanup) {
      gameState.claimWindow.cleanup()
    }

    const success = processClaim(gameState, action)
    
    if (success) {
      setGameState({ ...gameState })
      
      const claimingPlayer = gameState.players.find(p => p.id === action.playerId)
      if (action.type === 'win') {
        playWin()
        showGameNotification(`${claimingPlayer?.name} wins!`, "Game Over!")
      } else {
        playClaim()
        const claimType = action.type.charAt(0).toUpperCase() + action.type.slice(1)
        showGameNotification(`${claimingPlayer?.name} claimed!`, `Used ${claimType} to claim the tile`)
        
        // Continue with AI turn if needed
        const currentPlayerIndex = gameState.currentPlayer
        const currentPlayer = gameState.players[currentPlayerIndex]
        
        if (currentPlayer.id !== currentUser?.id) {
          setTimeout(() => simulateAITurn(gameState), 1500)
        }
      }
    } else {
      showGameNotification("Claim Failed", "Invalid claim. You don't have the required tiles.")
    }
  }

  const handleClaimTimeout = useCallback(() => {
    showGameNotification("Claim Window Expired", "You took too long to make a claim. The game continues.")
  }, [showGameNotification])

  const handleDeclareAmbition = (ambition: string) => {
    console.log('Ambition declared:', ambition)
    
    // If this is a win declaration (todas), process as win claim
    if (ambition === 'todas' && currentUser) {
      const winClaim: ClaimAction = { type: 'win', playerId: currentUser.id }
      handleClaim(winClaim)
    }
    // Other ambition declarations can be handled here in the future
  }

  const handleTileReorder = (newOrder: Tile[]) => {
    if (!gameState || !currentUser) return
    
    const playerIndex = gameState.players.findIndex(p => p.id === currentUser.id)
    if (playerIndex === -1) return
    
    // Update the player's hand with the new order
    const updatedGameState = { ...gameState }
    updatedGameState.players[playerIndex].hand = newOrder
    setGameState(updatedGameState)
  }

  const handleLeaveGame = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 bg-primary-foreground rounded opacity-50" />
          </div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Game Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!gameState || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Game not found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Don't render the finished modal if we're showing the winning hand
  if (gameState.status === 'finished' && !showWinningHand) {
    const winner = gameState.winner !== undefined ? gameState.players[gameState.winner] : null
    const isWinner = winner?.id === currentUser.id

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <Card className="bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2">
                <Trophy className={`w-6 h-6 ${isWinner ? 'text-accent' : 'text-muted-foreground'}`} />
                <span>Game Finished</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {isWinner ? (
                  <div>
                    <h2 className="text-2xl font-bold text-accent mb-2">Congratulations!</h2>
                    <p className="text-muted-foreground">You won the game!</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Game Over</h2>
                    <p className="text-muted-foreground">
                      Winner: <span className="text-accent font-semibold">{winner?.name}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Final Scores</h3>
                {gameState.players.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <span className={player.id === currentUser.id ? 'font-semibold' : ''}>
                      {player.name}
                    </span>
                    <Badge variant={index === gameState.winner ? 'default' : 'secondary'}>
                      {gameState.scores[index]} pts
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button variant="outline" className="w-full">
                  Play Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Game header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeaveGame}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Leave Game
              </Button>
              
              <div className="flex items-center space-x-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Filipino Mahjong</span>
                <span className="text-muted-foreground">•</span>
                <span>{gameId === 'quick-match' ? 'Quick Match' : `Game #${gameId}`}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Round {gameState.round}</span>
              </div>
              <Badge variant="secondary">
                {gameState.wind.charAt(0).toUpperCase() + gameState.wind.slice(1)} Wind
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications are now integrated into the dynamic status display */}

      {/* Game table */}
      <div className="pt-16">
        <GameTable
          gameState={gameState}
          currentUserId={currentUser.id}
          onTileClick={handleTileClick}
          onDiscard={handleDiscard}
          onClaim={handleClaim}
          onDeclareAmbition={handleDeclareAmbition}
          onTileReorder={handleTileReorder}
          onClaimTimeout={handleClaimTimeout}
        />
      </div>

      {/* Winning Hand Viewer */}
      {showWinningHand && gameState?.winner !== undefined && gameState.winningHand && (
        <WinningHandViewer
          winnerName={gameState.players[gameState.winner].name}
          winningTile={gameState.winningTile || null}
          winningHand={gameState.winningHand}
          winType={gameState.winType}
          onClose={() => {
            setShowWinningHand(false)
            // The finished modal will now be shown automatically
          }}
        />
      )}
    </div>
  )
}
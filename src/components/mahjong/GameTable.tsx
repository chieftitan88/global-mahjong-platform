import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MahjongTile } from './MahjongTile'
import { PlayerHand } from './PlayerHand'
import { DiscardPileViewer } from './DiscardPileViewer'
// import { GameStats } from './GameStats' // Removed - statistics integrated into status display
import { GameHints } from './GameHints'
import { GameState, Player, Tile, ClaimAction } from '@/types/mahjong'
import { sortTiles } from '@/utils/mahjongTiles'
import { getAllPossibleSequences } from '@/utils/filipinoMahjongLogic'
import { 
  Clock, 
  Users, 
  Crown,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  MessageCircle,
  History,
  Volume2,
  VolumeX,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { setSoundEnabled, isSoundEnabled } from '@/utils/soundEffects'
import { useIsMobile } from '@/hooks/use-mobile'
import { GameRules } from './GameRules'

interface GameTableProps {
  gameState: GameState
  currentUserId: string
  onTileClick: (tile: Tile) => void
  onDiscard: (tile: Tile) => void
  onClaim: (action: ClaimAction) => void
  onDeclareAmbition: (ambition: string) => void
  onTileReorder?: (newOrder: Tile[]) => void
  onClaimTimeout?: () => void
}

export function GameTable({
  gameState,
  currentUserId,
  onTileClick,
  onDiscard,
  onClaim,
  onDeclareAmbition,
  onTileReorder,
  onClaimTimeout
}: GameTableProps) {
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [showClaimOptions, setShowClaimOptions] = useState(false)
  const [claimTimeLeft, setClaimTimeLeft] = useState(0)
  const [showDiscardViewer, setShowDiscardViewer] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled())
  const [claimWindowTimeLeft, setClaimWindowTimeLeft] = useState(0)
  const isMobile = useIsMobile()

  const currentPlayer = gameState.players.find(p => p.id === currentUserId)
  const currentPlayerIndex = gameState.players.findIndex(p => p.id === currentUserId)
  const isCurrentTurn = gameState.currentPlayer === currentPlayerIndex
  
  // CLAIM button logic: Disable only for current player when they're drawing
  // Other players can always claim if there's a valid discard
  const canClaim = !!gameState.lastDiscard && (
    !isCurrentTurn || // Other players can always claim
    (isCurrentTurn && !gameState.hasDrawnThisTurn) // Current player can claim only if they haven't drawn yet
  )

  // Timer countdown
  useEffect(() => {
    if (isCurrentTurn && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [isCurrentTurn, timeLeft])

  // Reset timer when turn changes
  useEffect(() => {
    setTimeLeft(30)
  }, [gameState.currentPlayer])

  // Claim timer countdown
  useEffect(() => {
    if (showClaimOptions && claimTimeLeft > 0) {
      const timer = setTimeout(() => setClaimTimeLeft(claimTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showClaimOptions && claimTimeLeft === 0) {
      // Auto-close claim options when timer expires
      setShowClaimOptions(false)
      // Show notification that claim window expired
      onClaimTimeout?.()
    }
  }, [showClaimOptions, claimTimeLeft, onClaimTimeout])

  // Start claim timer when claim options are shown
  useEffect(() => {
    if (showClaimOptions) {
      setClaimTimeLeft(8) // 8 seconds to make a claim
    }
  }, [showClaimOptions])

  // Claim window countdown for claimResolution phase
  useEffect(() => {
    if (gameState.phase === 'claimResolution' && gameState.claimWindow) {
      const { startTime, duration } = gameState.claimWindow
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000))
      
      setClaimWindowTimeLeft(remaining)
      
      if (remaining > 0) {
        const timer = setInterval(() => {
          const newElapsed = Date.now() - startTime
          const newRemaining = Math.max(0, Math.ceil((duration - newElapsed) / 1000))
          setClaimWindowTimeLeft(newRemaining)
          
          if (newRemaining <= 0) {
            clearInterval(timer)
          }
        }, 1000)
        
        return () => clearInterval(timer)
      }
    } else {
      setClaimWindowTimeLeft(0)
    }
  }, [gameState.phase, gameState.claimWindow?.startTime])

  const handleTileClick = (tile: Tile) => {
    if (!isCurrentTurn) return
    
    if (selectedTile?.id === tile.id) {
      setSelectedTile(null)
    } else {
      setSelectedTile(tile)
      onTileClick(tile)
    }
  }

  const handleDiscard = () => {
    if (selectedTile && isCurrentTurn) {
      onDiscard(selectedTile)
      setSelectedTile(null)
    }
  }

  const handleTableClick = () => {
    setShowDiscardViewer(true)
  }

  const handleSoundToggle = () => {
    const newSoundEnabled = !soundEnabled
    setSoundEnabledState(newSoundEnabled)
    setSoundEnabled(newSoundEnabled)
  }

  // Prepare data for discard viewer
  const playerDiscards: { [playerId: string]: Tile[] } = {}
  const playerNames: { [playerId: string]: string } = {}
  
  gameState.players.forEach(player => {
    playerDiscards[player.id] = player.discards
    playerNames[player.id] = player.name
  })

  const getPlayerPosition = (playerIndex: number) => {
    // Arrange players around the table relative to current player
    const positions = ['bottom', 'right', 'top', 'left']
    const relativeIndex = (playerIndex - currentPlayerIndex + 4) % 4
    return positions[relativeIndex]
  }

  const renderPlayer = (player: Player, index: number) => {
    const position = getPlayerPosition(index);
    const isCurrentPlayerTurn = gameState.currentPlayer === index;
    const isDealer = player.isDealer;

    // Calculate the number of exposed sets for dynamic positioning
    const exposedMeldCount = player.melds.filter(meld => !meld.isConcealed).length;
    const flowerSetCount = player.flowers.length > 0 ? 1 : 0;
    const exposedSetCount = exposedMeldCount + flowerSetCount;

    // Skip rendering the current user (bottom position) as it's integrated into PlayerHand
    if (position === 'bottom') {
      return null;
    }

    const getDynamicPositionStyles = () => {
      if (position === 'top') {
        return {
          top: isMobile ? '0.5rem' : '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      }

      // The box is now anchored to the vertical center of the table.
      // The `transform: translateY(-50%)` will automatically adjust the position
      // to keep it centered as the height of the component grows.
      const baseTopOffset = isMobile ? 50 : 45;
      const horizontalOffset = isMobile ? '4rem' : '8rem';

      const styles: React.CSSProperties = {
        top: `${baseTopOffset}%`,
        transform: 'translateY(-50%)',
        transition: 'all 0.3s ease-in-out', // Smoothly transition size and other changes
      };

      if (position === 'left') {
        styles.left = horizontalOffset;
      } else if (position === 'right') {
        styles.right = horizontalOffset;
      }
    
      return styles;
    };


    return (
      <div
        key={player.id}
        style={getDynamicPositionStyles()}
        className={cn(
          'absolute flex items-center z-20',
          isMobile ? 'space-x-2' : 'space-x-4',
        )}
      >
        <Card className={cn(
          'bg-card/96 backdrop-blur-md transition-all duration-300 border-2 shadow-lg',
          isCurrentPlayerTurn && 'ring-2 ring-accent/70 shadow-xl shadow-accent/30 border-accent/60 bg-accent/15 scale-105',
          !isCurrentPlayerTurn && 'border-border/40 hover:border-border/60 hover:bg-card/98'
        )}>
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className={cn(
              "flex items-center",
              isMobile ? "space-x-2" : "space-x-3"
            )}>
              <div className="relative">
                <Avatar className={cn(
                  'transition-all duration-300',
                  isMobile ? 'w-8 h-8' : 'w-12 h-12',
                  isCurrentPlayerTurn && 'ring-2 ring-accent/50'
                )}>
                  <AvatarImage src={player.avatar} />
                  <AvatarFallback className={cn(
                    "bg-primary text-primary-foreground font-semibold",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {player.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isDealer && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-background">
                    <Crown className="w-3 h-3 text-accent-foreground" />
                  </div>
                )}
                {!player.isConnected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
                {isCurrentPlayerTurn && (
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-sm truncate">{player.name}</h4>
                  {player.hasVideo && (
                    <Badge variant="secondary" className="text-xs">
                      <Video className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>Rating: {player.rating}</span>
                  <span>•</span>
                  <span>Tiles: {player.hand.length}</span>
                </div>
                {/* Show flowers */}
                {player.flowers.length > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs text-pink-400">Flowers:</span>
                    {player.flowers.map((flower) => (
                      <MahjongTile key={flower.id} tile={flower} size="sm" />
                    ))}
                  </div>
                )}
                
                {/* Show melds */}
                {player.melds.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-green-400 mb-1">Melds:</div>
                    <div className="flex flex-col space-y-2">
                      {player.melds.map((meld) => (
                        <div key={meld.id} className="flex items-center space-x-1 p-1 bg-background/50 rounded-md">
                          {meld.tiles.map((tile) => (
                            <MahjongTile 
                              key={`${meld.id}-${tile.id}`} 
                              tile={tile} 
                              size="sm"
                              className={meld.isConcealed ? 'opacity-60' : ''}
                            />
                          ))}
                          {!meld.isConcealed && (
                            <Badge variant="outline" className="text-xs capitalize px-1 py-0">{meld.type}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {isCurrentPlayerTurn && (
              <div className="mt-2 flex items-center justify-center">
                <div className="flex items-center space-x-2 text-xs">
                  <Clock className="w-3 h-3 text-accent" />
                  <span className={cn(
                    'font-mono',
                    timeLeft <= 10 ? 'text-red-400' : 'text-accent'
                  )}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-background via-background/50 to-card/10 overflow-hidden">
      {/* Game Table - responsive sizing and positioning */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center z-10",
        isMobile 
          ? "pb-52 pt-16" // Reverted to original vertical padding
          : "pb-48 pt-20" 
      )}>
        <div className={cn(
          "relative bg-gradient-to-br from-green-700/80 via-green-800/90 to-green-900/95 rounded-full border-4 border-green-600/70 shadow-2xl z-20 ring-4 ring-green-500/20 bg-opacity-90",
          isMobile 
            ? "w-64 h-64" // Slightly larger table on mobile
            : "w-96 h-96" // Larger table on desktop for better visual balance
        )}>
          {/* Center discard area - clickable */}
          <div 
            className={cn(
              "absolute bg-green-900/50 backdrop-blur-md rounded-full border-2 border-green-500/60 flex items-center justify-center cursor-pointer hover:bg-green-900/70 transition-all duration-300 group shadow-inner z-30",
              isMobile ? "inset-6" : "inset-10"
            )}
            onClick={handleTableClick}
          >
            <div className="text-center">
              <div className={cn(
                "text-muted-foreground mb-1 group-hover:text-foreground transition-colors",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Discards
              </div>
              <div className={cn(
                "grid gap-0.5",
                "grid-cols-4 sm:grid-cols-6 md:grid-cols-8" // Responsive grid columns
              )}>
                {gameState.discardPile.slice(-24).map((tile, index) => { // Show more tiles
                  const isLastDiscard = gameState.lastDiscard && tile.id === gameState.lastDiscard.id && index === gameState.discardPile.slice(-24).length - 1
                  return (
                    <MahjongTile
                      key={`${tile.id}-${index}`}
                      tile={tile}
                      size="sm"
                      isDiscarded
                      isRecentDiscard={isLastDiscard}
                    />
                  )
                })}
              </div>
              {gameState.lastDiscard && (
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Last: {gameState.lastDiscard.suit}
                  </Badge>
                </div>
              )}
              <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                  <History className="w-3 h-3" />
                  <span>{isMobile ? "Tap" : "Click"} to view all</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Players around the table */}
      {gameState.players.map((player, index) => renderPlayer(player, index))}

      {/* Current player's hand (bottom) - positioned to not cover table */}
      {currentPlayer && (
        <div className={cn(
          "absolute left-1/2 transform -translate-x-1/2 w-full z-30",
          // Add extra margin when player has exposed tiles to avoid overlap
          currentPlayer.melds.some(meld => !meld.isConcealed) || currentPlayer.flowers.length > 0
            ? isMobile 
              ? "bottom-2 px-3 max-w-full pl-32" // Extra left padding for exposed tiles on mobile
              : "bottom-4 px-6 max-w-6xl pl-52" // Extra left padding for exposed tiles on desktop
            : isMobile 
              ? "bottom-2 px-3 max-w-full" 
              : "bottom-4 px-6 max-w-6xl"
        )}>
          <PlayerHand
            tiles={currentPlayer.hand}
            selectedTile={selectedTile}
            isCurrentTurn={isCurrentTurn}
            player={currentPlayer}
            gameState={gameState}
            onTileClick={handleTileClick}
            onTileReorder={onTileReorder || (() => {})}
            onDiscard={handleDiscard}
            onClaim={() => setShowClaimOptions(true)}
            onWin={() => onDeclareAmbition('todas')}
            onDraw={() => onTileClick(currentPlayer.hand[0])}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Game controls */}
      <div className={cn(
        "absolute flex items-center z-40",
        isMobile 
          ? "top-4 right-4 space-x-2" 
          : "top-6 right-6 space-x-3"
      )}>
        <div className="flex items-center space-x-2 bg-card/90 backdrop-blur-md rounded-lg px-3 py-2 border border-border/40 shadow-lg">
          <Button
            size={isMobile ? "sm" : "sm"}
            variant="ghost"
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={cn(
              'transition-all duration-200 hover:scale-105',
              videoEnabled 
                ? 'text-green-500 hover:bg-green-500/10 hover:text-green-400' 
                : 'text-red-500 hover:bg-red-500/10 hover:text-red-400',
              isMobile ? "h-8 w-8 p-0" : "h-9 w-9 p-0"
            )}
            title={videoEnabled ? 'Video: ON' : 'Video: OFF'}
          >
            {videoEnabled ? <Video className={isMobile ? "w-4 h-4" : "w-5 h-5"} /> : <VideoOff className={isMobile ? "w-4 h-4" : "w-5 h-5"} />}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={cn(
              'transition-all duration-200 hover:scale-105',
              audioEnabled 
                ? 'text-green-500 hover:bg-green-500/10 hover:text-green-400' 
                : 'text-red-500 hover:bg-red-500/10 hover:text-red-400',
              isMobile ? "h-8 w-8 p-0" : "h-9 w-9 p-0"
            )}
            title={audioEnabled ? 'Audio: ON' : 'Audio: OFF'}
          >
            {audioEnabled ? <Mic className={isMobile ? "w-4 h-4" : "w-5 h-5"} /> : <MicOff className={isMobile ? "w-4 h-4" : "w-5 h-5"} />}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSoundToggle}
            className={cn(
              'transition-all duration-200 hover:scale-105',
              soundEnabled 
                ? 'text-green-500 hover:bg-green-500/10 hover:text-green-400' 
                : 'text-red-500 hover:bg-red-500/10 hover:text-red-400',
              isMobile ? "h-8 w-8 p-0" : "h-9 w-9 p-0"
            )}
            title={soundEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF'}
          >
            {soundEnabled ? <Volume2 className={isMobile ? "w-4 h-4" : "w-5 h-5"} /> : <VolumeX className={isMobile ? "w-4 h-4" : "w-5 h-5"} />}
          </Button>
          
          {!isMobile && (
            <>
              <div className="w-px h-6 bg-border/50 mx-1" />
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:scale-105 transition-all duration-200">
                <MessageCircle className="w-5 h-5" />
              </Button>
              
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:scale-105 transition-all duration-200">
                <Settings className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dynamic Player Status Display */}
      <div className={cn(
        "absolute z-40",
        isMobile ? "top-4 left-4" : "top-6 left-6"
      )}>
        <Card className="bg-card/95 backdrop-blur-md border border-border/40 shadow-lg">
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            {gameState.phase === 'claimResolution' && claimWindowTimeLeft > 0 ? (
              // Claim Window with Timer Display
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="p-1 rounded-md bg-accent/10">
                        <Clock className="w-4 h-4 text-accent animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-accent text-sm">Claim Window</div>
                      <div className="text-xs text-muted-foreground">Players can claim</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "relative inline-flex items-center justify-center w-16 h-16 rounded-full font-mono font-bold text-2xl transition-all duration-300",
                      claimWindowTimeLeft <= 3 
                        ? "text-destructive bg-destructive/10 ring-2 ring-destructive/30 animate-pulse scale-110" 
                        : "text-accent bg-accent/10 ring-2 ring-accent/30"
                    )}>
                      {claimWindowTimeLeft}
                      <div className={cn(
                        "absolute inset-0 rounded-full border-4 border-transparent",
                        claimWindowTimeLeft <= 3 ? "border-t-destructive" : "border-t-accent",
                        "animate-spin"
                      )} style={{ animationDuration: '1s' }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">seconds left</div>
                  </div>
                </div>
              </div>
            ) : (
              // Current Player Status Display
              (() => {
                const currentActivePlayer = gameState.players[gameState.currentPlayer]
                const isCurrentPlayerHuman = gameState.currentPlayer === currentPlayerIndex
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          "relative p-2 rounded-lg transition-all duration-300",
                          isCurrentPlayerHuman 
                            ? "bg-gradient-to-br from-blue-500/10 to-blue-600/5 ring-1 ring-blue-500/20" 
                            : "bg-gradient-to-br from-green-500/10 to-green-600/5 ring-1 ring-green-500/20"
                        )}>
                          {isCurrentPlayerHuman ? (
                            <Users className="w-4 h-4 text-blue-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-green-500 animate-pulse shadow-sm" />
                          )}
                          {!isCurrentPlayerHuman && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 animate-ping" />
                          )}
                        </div>
                        <div>
                          <div className={cn(
                            "font-medium text-sm",
                            isCurrentPlayerHuman ? "text-blue-500" : "text-green-500"
                          )}>
                            {isCurrentPlayerHuman ? "Your Turn" : currentActivePlayer?.name || "AI Player"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {gameState.phase === 'draw' ? 'Drawing tile...' : 
                             gameState.phase === 'discard' ? 'Choosing discard...' : 
                             'Processing...'}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={isCurrentPlayerHuman ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {isCurrentPlayerHuman ? "Human" : "AI"}
                      </Badge>
                    </div>
                    
                    {/* Game State Info Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <Crown className="w-3 h-3 text-accent" />
                          <span className="text-muted-foreground">R{gameState.round}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-muted-foreground">{gameState.wind}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          <span className="text-muted-foreground">{gameState.wall.length} tiles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* Claim options modal */}
      <AnimatePresence>
        {showClaimOptions && gameState.lastDiscard && currentPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowClaimOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card p-6 rounded-lg border border-border shadow-xl max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Claim Options</h3>
                <div className={cn(
                  'flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium',
                  claimTimeLeft <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-accent/20 text-accent'
                )}>
                  <Clock className="w-4 h-4" />
                  <span>{claimTimeLeft}s</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-muted-foreground">Last discard:</span>
                <MahjongTile tile={gameState.lastDiscard} size="sm" />
                <span className="text-sm font-medium">{gameState.lastDiscard.suit} {gameState.lastDiscard.value}</span>
              </div>
              
              <div className="space-y-2">
                {/* Chow options - show ALL possible sequences */}
                {(() => {
                  // Check if player can form a chow with the last discard
                  if (!gameState.lastDiscard || !['circles', 'bamboos', 'characters'].includes(gameState.lastDiscard.suit)) {
                    return null
                  }
                  
                  // CHOW RESTRICTION: Can only be claimed by the player immediately after the discarding player
                  if (gameState.lastDiscardPlayer !== undefined) {
                    const nextPlayerIndex = (gameState.lastDiscardPlayer + 1) % 4
                    if (currentPlayerIndex !== nextPlayerIndex) {
                      console.log(`❌ CHOW not available: player ${currentPlayerIndex} is not next in sequence (expected ${nextPlayerIndex})`)
                      return null
                    }
                  }
                  
                  // Get ALL possible sequences using the existing function from filipinoMahjongLogic.ts
                  const allSequences = getAllPossibleSequences(currentPlayer.hand, gameState.lastDiscard)
                  
                  if (allSequences.length === 0) {
                    return null
                  }
                  
                  // Show each sequence as a separate button option
                  return allSequences.map((sequence, index) => {
                    // Create a descriptive label for the sequence
                    const sequenceValues = sequence.map(tile => tile.value).sort((a, b) => a! - b!)
                    const sequenceLabel = `${sequenceValues[0]}-${sequenceValues[1]}-${sequenceValues[2]}`
                    
                    return (
                      <Button
                        key={`chow-option-${index}`}
                        className="w-full justify-start text-left p-3 mb-2"
                        variant="outline"
                        onClick={() => {
                          onClaim({ 
                            type: 'chow', 
                            playerId: currentUserId,
                            // Pass the specific sequence tiles for the claim
                            tiles: sequence 
                          })
                          setShowClaimOptions(false)
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold">Chow:</span>
                          <div className="flex items-center space-x-1">
                            {sequence.map((tile, tileIndex) => (
                              <MahjongTile 
                                key={`${index}-${tileIndex}-${tile.id}`} 
                                tile={tile} 
                                size="sm" 
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">{sequenceLabel}</span>
                          {allSequences.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Option {index + 1}
                            </Badge>
                          )}
                        </div>
                      </Button>
                    )
                  })
                })()}
                
                {/* Pung option */}
                {(() => {
                  const matchingTiles = currentPlayer.hand.filter(t => t.suit === gameState.lastDiscard!.suit && 
                    t.value === gameState.lastDiscard!.value && 
                    t.wind === gameState.lastDiscard!.wind && 
                    t.dragon === gameState.lastDiscard!.dragon)
                  
                  return matchingTiles.length >= 2 && (
                    <Button
                      className="w-full justify-start p-3"
                      onClick={() => {
                        onClaim({ type: 'pung', playerId: currentUserId })
                        setShowClaimOptions(false)
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold">Pung:</span>
                        <div className="flex items-center space-x-1">
                          <MahjongTile tile={gameState.lastDiscard} size="sm" />
                          {matchingTiles.slice(0, 2).map((tile, i) => (
                            <MahjongTile key={i} tile={tile} size="sm" />
                          ))}
                        </div>
                      </div>
                    </Button>
                  )
                })()}
                
                {/* Kong option */}
                {(() => {
                  const matchingTiles = currentPlayer.hand.filter(t => t.suit === gameState.lastDiscard!.suit && 
                    t.value === gameState.lastDiscard!.value && 
                    t.wind === gameState.lastDiscard!.wind && 
                    t.dragon === gameState.lastDiscard!.dragon)
                  
                  return matchingTiles.length >= 3 && (
                    <Button
                      className="w-full justify-start p-3"
                      onClick={() => {
                        onClaim({ type: 'kong', playerId: currentUserId })
                        setShowClaimOptions(false)
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold">Kong:</span>
                        <div className="flex items-center space-x-1">
                          <MahjongTile tile={gameState.lastDiscard} size="sm" />
                          {matchingTiles.slice(0, 3).map((tile, i) => (
                            <MahjongTile key={i} tile={tile} size="sm" />
                          ))}
                        </div>
                      </div>
                    </Button>
                  )
                })()}
                
                <Button
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    onClaim({ type: 'win', playerId: currentUserId })
                    setShowClaimOptions(false)
                  }}
                >
                  WIN
                </Button>
              </div>
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowClaimOptions(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Statistics integrated into status display */}

      {/* Game Hints */}
      <GameHints gameState={gameState} currentUserId={currentUserId} />

      {/* Discard Pile Viewer */}
      <DiscardPileViewer
        isOpen={showDiscardViewer}
        onClose={() => setShowDiscardViewer(false)}
        discardPile={gameState.discardPile}
        playerDiscards={playerDiscards}
        playerNames={playerNames}
      />
    </div>
  )
}
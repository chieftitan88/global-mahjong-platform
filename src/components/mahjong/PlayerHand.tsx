import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MahjongTile } from './MahjongTile'
import { Tile, Player, GameState } from '@/types/mahjong'
import { sortTiles } from '@/utils/mahjongTiles'
import { RotateCcw, Shuffle, Crown, Video, Move } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlayerHandProps {
  tiles: Tile[]
  selectedTile: Tile | null
  isCurrentTurn: boolean
  player: Player
  gameState: GameState // Add gameState to access game phase and other info
  onTileClick: (tile: Tile) => void
  onTileReorder: (newOrder: Tile[]) => void
  onDiscard: () => void
  onClaim: () => void
  onWin: () => void
  onDraw: () => void
  isMobile?: boolean
}

export function PlayerHand({
  tiles,
  selectedTile,
  isCurrentTurn,
  player,
  gameState,
  onTileClick,
  onTileReorder,
  onDiscard,
  onClaim,
  onWin,
  onDraw,
  isMobile = false
}: PlayerHandProps) {
  const [handTiles, setHandTiles] = useState<Tile[]>(tiles)
  const [isManuallyArranged, setIsManuallyArranged] = useState(false)
  const [draggedTile, setDraggedTile] = useState<Tile | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragMode, setIsDragMode] = useState(true) // Always enable drag mode by default
  const dragCounter = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  // Update hand tiles when props change (but preserve manual arrangement)
  if (!isManuallyArranged && JSON.stringify(handTiles) !== JSON.stringify(tiles)) {
    setHandTiles(tiles)
  }

  const handleReorder = (newOrder: Tile[]) => {
    setHandTiles(newOrder)
    setIsManuallyArranged(true)
    onTileReorder(newOrder)
  }

  const handleAutoSort = useCallback(() => {
    const sortedTiles = sortTiles([...tiles])
    setHandTiles(sortedTiles)
    setIsManuallyArranged(false)
    onTileReorder(sortedTiles)
  }, [tiles, onTileReorder])

  const handleResetToOriginal = useCallback(() => {
    setHandTiles([...tiles])
    setIsManuallyArranged(false)
    onTileReorder([...tiles])
  }, [tiles, onTileReorder])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, tile: Tile, index: number) => {
    setDraggedTile(tile)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tile.id)
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'rotate(5deg)'
    dragImage.style.opacity = '0.8'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 30, 40)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleDragEnd = () => {
    setDraggedTile(null)
    setDragOverIndex(null)
    dragCounter.current = 0
    // Reset dragging state after a short delay to allow click events to be processed
    setTimeout(() => setIsDragging(false), 100)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
  }

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!draggedTile) return
    
    const dragIndex = handTiles.findIndex(tile => tile.id === draggedTile.id)
    if (dragIndex === -1 || dragIndex === dropIndex) return
    
    const newTiles = [...handTiles]
    const [removed] = newTiles.splice(dragIndex, 1)
    newTiles.splice(dropIndex, 0, removed)
    
    handleReorder(newTiles)
    setDragOverIndex(null)
  }

  // Handle tile clicks for selection (only if not dragging)
  const handleTileClick = (tile: Tile) => {
    if (!isDragging) {
      onTileClick(tile)
    }
  }



  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when it's the current player's turn
      if (!isCurrentTurn) return
      
      // Auto-sort with 'S' key
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        handleAutoSort()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isCurrentTurn, handleAutoSort])

  return (
    <Card className="bg-card/96 backdrop-blur-md border border-border/40 shadow-xl">
      <CardContent className={isMobile ? "p-3" : "p-4"}>
        {/* Enhanced Player Profile Section */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className={isMobile ? "w-10 h-10" : "w-12 h-12"}>
                <AvatarImage src={player.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold">
                  {player.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {player.isDealer && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                  <Crown className="w-2.5 h-2.5 text-accent-foreground" />
                </div>
              )}
              {!player.isConnected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background shadow-sm" />
              )}
              {isCurrentTurn && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse shadow-sm" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className={cn("font-semibold truncate", isMobile ? "text-sm" : "text-base")}>{player.name}</h3>
                {player.hasVideo && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border-blue-500/20">
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Badge>
                )}
                {isCurrentTurn && (
                  <Badge variant="default" className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                    Your Turn
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                <span className="font-medium">⭐ {player.rating}</span>
                <span>•</span>
                <span>{handTiles.length} tiles</span>
                {player.flowers.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-pink-400">{player.flowers.length} flowers</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {isManuallyArranged && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Custom
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAutoSort}
              className="text-xs h-6 px-2"
              title="Auto-sort tiles (S)"
            >
              <Shuffle className="w-3 h-3" />
            </Button>
            {isManuallyArranged && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetToOriginal}
                className="text-xs h-6 px-2"
                title="Reset to original order"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Compact flowers and melds section - positioned to avoid table overlap */}
        {(player.flowers.length > 0 || player.melds.length > 0) && (
          <div className={cn(
            "absolute z-20",
            isMobile 
              ? "left-0 top-0 transform -translate-x-full -translate-y-2 pr-2 max-w-[120px]" 
              : "left-0 top-1/2 transform -translate-x-full -translate-y-1/2 pr-4 max-w-[200px]"
          )}>
            {/* Flowers */}
            {player.flowers.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-pink-400 font-medium mb-1">Flowers</div>
                <div className="flex flex-wrap gap-1">
                  {player.flowers.map((flower) => (
                    <MahjongTile key={flower.id} tile={flower} size="sm" />
                  ))}
                </div>
              </div>
            )}
            
            {/* Melds */}
            {player.melds.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-green-400 font-medium">Melds</div>
                {player.melds.map((meld) => (
                  <div key={meld.id} className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs capitalize px-1 py-0">
                        {meld.type}
                      </Badge>
                      {!meld.isConcealed && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          Exposed
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {meld.tiles.map((tile) => (
                        <MahjongTile 
                          key={`${meld.id}-${tile.id}`} 
                          tile={tile} 
                          size="sm"
                          className={meld.isConcealed ? 'opacity-60' : ''}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="relative">
          <div className={cn(
            isMobile 
              ? "grid grid-cols-9 gap-1 justify-items-center min-h-[90px] max-w-full" // 2-row grid on mobile (9 tiles per row max)
              : "flex items-center justify-center space-x-1 min-h-[60px]"
          )}>
            <AnimatePresence mode="popLayout">
              {handTiles.map((tile, index) => (
                <motion.div
                  key={tile.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: draggedTile?.id === tile.id ? 0.3 : 1,
                    scale: draggedTile?.id === tile.id ? 0.95 : 1,
                    y: selectedTile?.id === tile.id ? (isMobile ? -4 : -6) : 0
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: isMobile ? -2 : -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`
                    relative cursor-grab active:cursor-grabbing flex-shrink-0
                    ${dragOverIndex === index ? 'z-10' : ''}
                  `}
                  draggable={!isMobile} // Disable drag on mobile for better touch experience
                  onDragStart={(e) => handleDragStart(e as React.DragEvent, tile, index)}
                  onDragEnd={(e) => handleDragEnd()}
                  onDragOver={(e) => handleDragOver(e as React.DragEvent, index)}
                  onDragEnter={(e) => handleDragEnter(e as React.DragEvent)}
                  onDragLeave={(e) => handleDragLeave(e as React.DragEvent)}
                  onDrop={(e) => handleDrop(e as React.DragEvent, index)}
                >
                  {/* Drop zone indicator */}
                  {dragOverIndex === index && draggedTile?.id !== tile.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-accent/20 border-2 border-accent border-dashed rounded-lg z-0"
                    />
                  )}
                  
                  <MahjongTile
                    tile={tile}
                    size={isMobile ? "sm" : "md"}
                    isSelected={selectedTile?.id === tile.id}
                    isDisabled={!isCurrentTurn}
                    onClick={() => handleTileClick(tile)}
                    className={`
                      transition-all duration-200 relative z-10
                      ${selectedTile?.id === tile.id ? 'ring-2 ring-accent shadow-lg' : ''}
                      ${tile.isRecentlyDrawn ? 'ring-2 ring-blue-400 shadow-blue-400/50' : ''}
                      hover:shadow-xl hover:scale-105
                      ${draggedTile?.id === tile.id ? 'shadow-2xl ring-2 ring-primary' : ''}
                    `}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Enhanced action buttons section */}
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className={cn(
            "flex items-center justify-center",
            isMobile ? "space-x-2" : "space-x-3"
          )}>
            {gameState.phase === 'draw' && isCurrentTurn ? (
              <Button
                size={isMobile ? "sm" : "default"}
                onClick={onDraw}
                className={cn(
                  "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all duration-200 hover:scale-105",
                  isMobile ? "h-9 px-4 text-sm font-medium" : "h-10 px-6 text-sm font-semibold"
                )}
              >
                🎯 Draw Tile
              </Button>
            ) : (
              <Button
                size={isMobile ? "sm" : "default"}
                onClick={onDiscard}
                disabled={!selectedTile || !isCurrentTurn || gameState.phase !== 'discard'}
                className={cn(
                  "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
                  isMobile ? "h-9 px-4 text-sm font-medium" : "h-10 px-6 text-sm font-semibold"
                )}
              >
                🚮 Discard
              </Button>
            )}
            
            <Button
              size={isMobile ? "sm" : "default"}
              variant="outline"
              onClick={onClaim}
              disabled={
                !gameState.lastDiscard || 
                (isCurrentTurn && gameState.hasDrawnThisTurn) ||
                (gameState.lastDiscardPlayer === gameState.players.findIndex(p => p.id === player.id))
              }
              className={cn(
                "transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border-2",
                gameState.lastDiscard && 
                (!isCurrentTurn || !gameState.hasDrawnThisTurn) && 
                (gameState.lastDiscardPlayer !== gameState.players.findIndex(p => p.id === player.id))
                  ? 'border-accent/50 text-accent hover:bg-accent/10 hover:border-accent shadow-md' 
                  : 'border-border/30',
                isMobile ? "h-9 px-4 text-sm font-medium" : "h-10 px-5 text-sm font-semibold"
              )}
              title={
                !gameState.lastDiscard
                  ? "No tile to claim"
                  : gameState.lastDiscardPlayer === gameState.players.findIndex(p => p.id === player.id)
                    ? "Cannot claim your own discard"
                    : isCurrentTurn && gameState.hasDrawnThisTurn
                      ? "Cannot claim after drawing a tile"
                      : "Claim the last discarded tile"
              }
            >
              ⚡ Claim
            </Button>
            
            <Button
              size={isMobile ? "sm" : "default"}
              variant="outline"
              onClick={onWin}
              disabled={!isCurrentTurn}
              className={cn(
                "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-green-600 shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
                isMobile ? "h-9 px-4 text-sm font-medium" : "h-10 px-5 text-sm font-semibold"
              )}
              title="Declare victory if you have a winning hand"
            >
              🏆 WIN
            </Button>
          </div>
          
          {/* Compact status indicator */}
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground">
              {gameState.phase === 'draw' && isCurrentTurn && 'Draw a tile'}
              {gameState.phase === 'discard' && isCurrentTurn && 'Discard a tile'}
              {!isCurrentTurn && `Waiting for ${gameState.players[gameState.currentPlayer]?.name || 'player'}`}
              {gameState.hasDrawnThisTurn && isCurrentTurn && ' • Claims disabled'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
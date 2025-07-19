import React from 'react'
import { Tile, Meld } from '../../types/mahjong'
import { MahjongTile } from './MahjongTile'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

interface WinningHandViewerProps {
  winnerName: string
  winningTile: Tile | null
  winningHand: {
    tiles: Tile[]
    melds: Meld[]
    flowers: Tile[]
  } | null
  winType?: string
  onClose: () => void
}

const WinningHandViewer: React.FC<WinningHandViewerProps> = ({
  winnerName,
  winningTile,
  winningHand,
  winType,
  onClose
}) => {
  if (!winningHand) return null

  const { tiles, melds, flowers } = winningHand

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">
            🎉 {winnerName} Wins! 🎉
          </CardTitle>
          {winType && (
            <Badge variant="secondary" className="text-lg px-4 py-2 mx-auto">
              {winType}
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Winning Tile */}
          {winningTile && (
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-amber-600">
                Winning Tile
              </h3>
              <div className="flex justify-center">
                <div className="relative">
                  <MahjongTile 
                    tile={winningTile} 
                    size="lg"
                    className="ring-4 ring-amber-400 ring-offset-2 shadow-lg"
                  />
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Exposed Melds */}
          {melds.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Exposed Melds</h3>
              <div className="space-y-3">
                {melds.map((meld, index) => (
                  <div key={meld.id} className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize min-w-[60px]">
                      {meld.type}
                    </Badge>
                    <div className="flex gap-1">
                      {meld.tiles.map((tile, tileIndex) => (
                        <MahjongTile 
                          key={`${meld.id}-${tileIndex}`} 
                          tile={tile} 
                          size="sm"
                        />
                      ))}
                    </div>
                    {meld.claimedFrom !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        (claimed from Player {meld.claimedFrom + 1})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Hand Tiles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Hand Tiles</h3>
            <div className="flex flex-wrap gap-1 justify-center">
              {tiles.map((tile, index) => (
                <MahjongTile 
                  key={`hand-${index}`} 
                  tile={tile} 
                  size="md"
                  className={tile.id === winningTile?.id ? 'ring-2 ring-amber-400' : ''}
                />
              ))}
            </div>
          </div>

          {/* Flowers & Seasons */}
          {flowers.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Bonus Tiles (Flowers & Seasons)</h3>
                <div className="flex flex-wrap gap-1 justify-center">
                  {flowers.map((flower, index) => (
                    <MahjongTile 
                      key={`flower-${index}`} 
                      tile={flower} 
                      size="md"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Close Button */}
          <div className="text-center pt-4">
            <button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-semibold transition-colors"
            >
              Continue Game
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WinningHandViewer 
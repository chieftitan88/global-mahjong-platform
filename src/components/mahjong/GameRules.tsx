import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface GameRulesProps {
  isOpen: boolean
  onClose: () => void
}

const friendlyRules = (
  <div className="space-y-8 text-base leading-7">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">🀄️ Filipino Mahjong: The Ultimate Guide 🀄️</h1>
      <p className="text-lg italic mb-6">Welcome to the definitive guide for Filipino Mahjong! This rulebook is designed to be clear, concise, and visually appealing to help you master the game.</p>
    </div>

    <section>
      <h2 className="text-2xl font-semibold mb-4">🎯 The Objective: Your Path to Victory</h2>
      <p>Your primary goal is to be the first of four players to achieve "Mahjong" by forming a complete, 17-tile winning hand.</p>
      <div className="mt-4">
        <p className="font-medium">A standard winning hand is composed of:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>Five (5) Sets</strong>
            <p className="italic ml-4">Can be a <strong>Pung</strong> (three identical tiles), <strong>Kong</strong> (four identical tiles), or <strong>Chow</strong> (a sequence of three).</p>
          </li>
          <li>
            <strong>One (1) Pair</strong>
            <p className="italic ml-4">Two identical tiles, which serve as the "eyes" of your hand.</p>
          </li>
        </ul>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-4">🎲 The Mahjong Tiles: Know Your Tools</h2>
      <p>The game is played with a 144-tile set, divided into the following categories:</p>
      
      <div className="mt-4">
        <h3 className="text-xl font-medium mb-2">Suits: The Foundation of Your Hand</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Circles (Dots):</strong> Numbered 1 through 9</li>
          <li><strong>Bamboos (Sticks):</strong> Numbered 1 through 9</li>
          <li><strong>Characters (Wan):</strong> Numbered 1 through 9</li>
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-medium mb-2">Honor Tiles: The Power Players</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Winds:</strong> East, South, West, North</li>
          <li><strong>Dragons:</strong> Red, Green, and White</li>
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-medium mb-2">Bonus Tiles: Your Lucky Charms</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Flowers:</strong> Plum, Orchid, Chrysanthemum, Bamboo</li>
          <li><strong>Seasons:</strong> Spring, Summer, Autumn, Winter</li>
        </ul>
      </div>

      <div className="mt-4 bg-muted/50 p-4 rounded-lg">
        <p className="font-medium">💡 Pro Tip: Bonus Tiles</p>
        <p className="mt-2">When you draw a Flower or Season, you must immediately reveal it, place it to the side, and draw a replacement tile. This gives you a bonus and gets you closer to victory!</p>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-4">🎮 Game Flow: The Rhythm of Play</h2>
      
      <div className="mt-4">
        <h3 className="text-xl font-medium mb-2">Setup and Dealing</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Dealing:</strong> All players start with 16 tiles. The Dealer (East Wind) begins with an extra tile, for a total of 17.</li>
          <li><strong>Turn Order:</strong> Play proceeds in a clockwise direction, beginning with the Dealer.</li>
        </ol>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-medium mb-2">A Player's Turn: Draw and Discard</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Draw:</strong> Begin your turn by drawing one tile from the wall.</li>
          <li><strong>Discard:</strong> After drawing, you must discard one tile from your hand, placing it face-up in the center for all to see.</li>
        </ol>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-4">⚡ Claiming Discards: Seizing Opportunities</h2>
      <p>When a player discards a tile, you may have a chance to claim it. Claims are resolved in a specific order of priority:</p>

      <div className="space-y-6 mt-4">
        <div>
          <h3 className="text-xl font-medium">1. WIN (Mahjong!) 🏆</h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>What it is:</strong> The discarded tile is the final piece needed to complete your 17-tile winning hand.</li>
            <li><strong>Who can claim:</strong> Any player can claim a discard to win.</li>
            <li><strong>Action:</strong> Declare "Mahjong!" to win the round.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-medium">2. KONG (A Set of Four)</h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>What it is:</strong> You hold three identical tiles, and the discard is the fourth.</li>
            <li><strong>Who can claim:</strong> Any player.</li>
            <li><strong>Action:</strong> Declare "Kong," reveal the set, and draw a replacement tile.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-medium">3. PUNG (A Set of Three)</h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>What it is:</strong> You hold two identical tiles, and the discard is the third.</li>
            <li><strong>Who can claim:</strong> Any player.</li>
            <li><strong>Action:</strong> Declare "Pung" and reveal the set.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-medium">4. CHOW (A Sequence of Three)</h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>What it is:</strong> The discard completes a three-tile sequence in the same suit (e.g., 4-5-6 of Bamboos).</li>
            <li><strong>Who can claim:</strong> <strong>Strictly limited to the player whose turn is <em>immediately after</em> the discarder.</strong></li>
            <li><strong>Action:</strong> Declare "Chow" and reveal the sequence.</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-muted/50 p-4 rounded-lg">
        <p className="font-medium">⏰ Important Reminder:</p>
        <p className="mt-2">The claim window is brief. If multiple players make a claim, the highest priority action (Win {`>`} Kong {`>`} Pung {`>`} Chow) takes precedence.</p>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-4">🏆 Winning Hands: Two Paths to Glory</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-medium">Standard Hand (The Classic)</h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Composition:</strong> 5 Sets + 1 Pair</li>
            <li><strong>Strategy:</strong> A flexible and common way to win, allowing for a mix of Pungs, Kongs, and Chows.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-medium">Siete Pares (The Seven Pairs)</h3>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Composition:</strong> 7 distinct Pairs + 1 Trio (either a Pung or a Chow).</li>
            <li><strong>Strategy:</strong> A special and high-scoring hand that is more challenging to assemble but offers a greater reward.</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-4">✨ Ambitions: Declaring for Bonus Points</h2>
      <p>During the game, you can declare special hands, known as "ambitions," for bonus points:</p>
      <ul className="list-disc pl-6 mt-4 space-y-2">
        <li><strong>Kang:</strong> Forming a Kong.</li>
        <li><strong>Escalera:</strong> Creating a 1-9 sequence of the same suit using three Chow sets.</li>
        <li><strong>All Up:</strong> A hand composed entirely of Pungs and/or Kongs.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-4">🎓 Key Strategies for Success</h2>
      <ol className="list-decimal pl-6 space-y-2">
        <li><strong>Be Decisive:</strong> The clock is ticking on claims. Act quickly.</li>
        <li><strong>Discard Wisely:</strong> Pay attention to what other players are discarding to avoid giving them a winning tile.</li>
        <li><strong>Remember the Chow Rule:</strong> Don't miss your chance to claim a Chow, and don't try to claim one out of turn.</li>
      </ol>
    </section>

    <section className="text-center">
      <h2 className="text-2xl font-semibold mb-4">🍀 Good Luck and Have Fun!</h2>
      <p className="italic">The best way to learn is to play. Embrace the process, and may the tiles be in your favor!</p>
    </section>
  </div>
)

export function GameRules({ isOpen, onClose }: GameRulesProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl text-center">Filipino Mahjong Rules</DialogTitle>
          <DialogDescription className="text-center text-base">
            Complete guide to playing Filipino Mahjong
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full rounded-md border p-6">
          <div className="prose dark:prose-invert max-w-none">
            {friendlyRules}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 
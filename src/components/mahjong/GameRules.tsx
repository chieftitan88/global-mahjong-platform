import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface GameRulesProps {
  isOpen: boolean
  onClose: () => void
}

const friendlyRules = `
# 🀄️ Welcome to Filipino Mahjong! 🀄️

This guide will walk you through the exciting world of Filipino Mahjong, a unique and fast-paced version of the classic game. Get ready to learn the ropes and master the art of forming winning hands!

---

### **🌟 The Goal of the Game**

Your main objective is to be the first of four players to form a **complete winning hand** of 17 tiles. A standard winning hand is made up of:
- **Five (5) Sets** (either a Pung, Kong, or Chow)
- **One (1) Pair** of identical tiles (known as the "eyes")

Think of it like collecting special groups of cards, but with beautifully crafted Mahjong tiles!

---

### **🀄 Tiles of the Trade: What's in the Set?**

The game uses a 144-tile set, divided into three main categories:

#### **Suits (The Core Tiles)**
These are like the numbered cards in a deck, and you'll use them to form most of your sets.
- **Circles (Dots):** Numbered 1 to 9
- **Bamboos (Sticks):** Numbered 1 to 9
- **Characters (Wan):** Numbered 1 to 9

#### **Honor Tiles (The Power Tiles)**
These special tiles don't have numbers but can be used to form powerful sets.
- **Winds:** East, South, West, North
- **Dragons:** Red, Green, White (often represented by a blank tile)

#### **Bonus Tiles (The Lucky Tiles)**
These are special tiles that give you immediate bonus points!
- **Flowers:** Plum, Orchid, Chrysanthemum, Bamboo
- **Seasons:** Spring, Summer, Autumn, Winter

When you draw a Bonus Tile, it's immediately placed aside, and you get to draw a replacement tile from the wall. It's like a free-turn coupon!

---

### **🚀 Getting Started: The Setup**

1.  **Dealing:** Each player starts with 16 tiles. The dealer (marked with an East wind) gets an extra 17th tile to begin the game.
2.  **Player Turns:** The game moves in a clockwise direction, starting from the Dealer.

---

### **🔄 How to Play: The Flow of the Game**

Each player's turn consists of two simple steps:

#### **Step 1: Draw**
- Start your turn by drawing one tile from the main wall. You will now have 17 tiles in your hand temporarily.
- If you draw a Bonus Tile (Flower or Season), show it to everyone, place it in your bonus area, and draw another tile. Lucky you!

#### **Step 2: Discard**
- After drawing, you must choose one tile from your hand to discard, placing it face-up in the center of the table. This brings your hand back to 16 tiles.
- **This is the most important part of your turn!** Your discard can be claimed by other players to complete their own sets.

---

### **🙌 Making a Move: Claiming a Discard**

When another player discards a tile, you might have the opportunity to claim it to complete a set in your own hand. This is where the real strategy begins!

Here are the claims you can make, from highest to lowest priority:

#### **1. WIN (Mahjong!)**
- **What it is:** The discarded tile is the final piece you need to complete your 17-tile winning hand.
- **Who can claim:** Any player.
- **Result:** You declare "Mahjong!", show your winning hand, and win the round!

#### **2. KONG (A Set of Four)**
- **What it is:** A set of four identical tiles. You must already have three identical tiles concealed in your hand.
- **Who can claim:** Any player.
- **Result:** You take the discard, reveal your set of four, and place it face-up. Because a Kong is a 4-tile set, you must draw a replacement tile from the wall before discarding. Your turn continues.

#### **3. PUNG (A Set of Three)**
- **What it is:** A set of three identical tiles. You must already have two identical tiles (a pair) in your hand.
- **Who can claim:** Any player.
- **Result:** You take the discard, reveal your set of three, and place it face-up. You then discard a tile, and your turn continues.

#### **4. CHOW (A Sequence of Three)**
- **What it is:** A sequence of three consecutive numbers in the same suit (e.g., 4-5-6 of Bamboos).
- **Who can claim:** **ONLY the player whose turn is immediately after the discarder.** This is a key rule in Filipino Mahjong! You cannot claim a Chow from a player across the table.
- **Result:** You take the discard, reveal your sequence, and place it face-up. You then discard a tile, and your turn continues.

**Claiming Window:** You only have a few seconds to decide if you want to claim a tile. If multiple players want the same tile, the player with the higher priority claim (e.g., Pung beats Chow) gets the tile.

---

### **🏆 How to Win: Building Your Hand**

There are two main ways to construct a winning hand:

#### **Standard Hand (The Classic Win)**
- **Formula:** 5 Sets + 1 Pair (17 tiles total)
- **Example:**
  - A Pung of 2s
  - A Chow of 4-5-6 of Circles
  - A Pung of Red Dragons
  - A Kong of West Winds
  - A Chow of 7-8-9 of Bamboos
  - A Pair of 1s (your "eyes")

#### **Siete Pares (Seven Pairs)**
- **Formula:** 7 Pairs + 1 Trio (either a Pung or a Chow)
- This is a special, harder-to-get hand that comes with a big bonus!
- **Example:**
  - 7 different pairs (e.g., two 1s, two 3s, two East Winds, etc.)
  - One 3-tile set (e.g., 8-8-8 or 4-5-6 of Circles)

---

### **✨ Ambitions: Declaring Special Hands for Bonuses**

Filipino Mahjong has an exciting "ambition" system where you can earn bonus points for achieving special feats during the game. Some common ambitions include:
- **Kang:** Forming a Kong.
- **Escalera:** Forming a complete 1-9 sequence in the same suit across three Chow sets.
- **All Up:** Having a hand made entirely of Pungs/Kongs (no Chows).

These add an extra layer of strategy and excitement to the game!

---

Good luck, and may the tiles be ever in your favor! 🍀
`

export function GameRules({ isOpen, onClose }: GameRulesProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Filipino Mahjong Rules</DialogTitle>
          <DialogDescription>
            The complete guide to playing Filipino Mahjong.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full rounded-md border p-4">
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {friendlyRules}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 
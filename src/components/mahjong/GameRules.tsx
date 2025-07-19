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
# 🀄️ **Filipino Mahjong: The Ultimate Guide** 🀄️

_Welcome to the definitive guide for Filipino Mahjong! This rulebook is designed to be clear, concise, and visually appealing to help you master the game._

---

## 🎯 **The Objective: Your Path to Victory**

Your primary goal is to be the first of four players to achieve **"Mahjong"** by forming a complete, 17-tile winning hand.

A standard winning hand is composed of:

- **Five (5) Sets**
  - _Can be a **Pung** (three identical tiles), **Kong** (four identical tiles), or **Chow** (a sequence of three)._

- **One (1) Pair**
  - _Two identical tiles, which serve as the "eyes" of your hand._

---

## 🎲 **The Mahjong Tiles: Know Your Tools**

The game is played with a 144-tile set, divided into the following categories:

### **Suits: The Foundation of Your Hand**

*   **Circles (Dots):** Numbered 1 through 9
*   **Bamboos (Sticks):** Numbered 1 through 9
*   **Characters (Wan):** Numbered 1 through 9

### **Honor Tiles: The Power Players**

*   **Winds:** East, South, West, North
*   **Dragons:** Red, Green, and White

### **Bonus Tiles: Your Lucky Charms**

*   **Flowers:** Plum, Orchid, Chrysanthemum, Bamboo
*   **Seasons:** Spring, Summer, Autumn, Winter

> **💡 Pro Tip: Bonus Tiles**
>
> When you draw a Flower or Season, you must immediately reveal it, place it to the side, and draw a replacement tile. This gives you a bonus and gets you closer to victory!

---

## 🎮 **Game Flow: The Rhythm of Play**

### **Setup and Dealing**

1.  **Dealing:** All players start with 16 tiles. The Dealer (East Wind) begins with an extra tile, for a total of 17.
2.  **Turn Order:** Play proceeds in a clockwise direction, beginning with the Dealer.

### **A Player's Turn: Draw and Discard**

1.  **Draw:** Begin your turn by drawing one tile from the wall.
2.  **Discard:** After drawing, you must discard one tile from your hand, placing it face-up in the center for all to see.

---

## ⚡ **Claiming Discards: Seizing Opportunities**

When a player discards a tile, you may have a chance to claim it. Claims are resolved in a specific order of priority:

### **1. WIN (Mahjong!)** 🏆

- **What it is:** The discarded tile is the final piece needed to complete your 17-tile winning hand.
- **Who can claim:** Any player can claim a discard to win.
- **Action:** Declare "Mahjong!" to win the round.

### **2. KONG (A Set of Four)**

- **What it is:** You hold three identical tiles, and the discard is the fourth.
- **Who can claim:** Any player.
- **Action:** Declare "Kong," reveal the set, and draw a replacement tile.

### **3. PUNG (A Set of Three)**

- **What it is:** You hold two identical tiles, and the discard is the third.
- **Who can claim:** Any player.
- **Action:** Declare "Pung" and reveal the set.

### **4. CHOW (A Sequence of Three)**

- **What it is:** The discard completes a three-tile sequence in the same suit (e.g., 4-5-6 of Bamboos).
- **Who can claim:** **Strictly limited to the player whose turn is *immediately after* the discarder.**
- **Action:** Declare "Chow" and reveal the sequence.

> **⏰ Important Reminder:**
>
> The claim window is brief. If multiple players make a claim, the highest priority action (Win > Kong > Pung > Chow) takes precedence.

---

## 🏆 **Winning Hands: Two Paths to Glory**

### **Standard Hand (The Classic)**

- **Composition:** 5 Sets + 1 Pair
- **Strategy:** A flexible and common way to win, allowing for a mix of Pungs, Kongs, and Chows.

### **Siete Pares (The Seven Pairs)**

- **Composition:** 7 distinct Pairs + 1 Trio (either a Pung or a Chow).
- **Strategy:** A special and high-scoring hand that is more challenging to assemble but offers a greater reward.

---

## ✨ **Ambitions: Declaring for Bonus Points**

During the game, you can declare special hands, known as "ambitions," for bonus points:

- **Kang:** Forming a Kong.
- **Escalera:** Creating a 1-9 sequence of the same suit using three Chow sets.
- **All Up:** A hand composed entirely of Pungs and/or Kongs.

---

## 🎓 **Key Strategies for Success**

1.  **Be Decisive:** The clock is ticking on claims. Act quickly.
2.  **Discard Wisely:** Pay attention to what other players are discarding to avoid giving them a winning tile.
3.  **Remember the Chow Rule:** Don't miss your chance to claim a Chow, and don't try to claim one out of turn.

---

## 🍀 **Good Luck and Have Fun!**

_The best way to learn is to play. Embrace the process, and may the tiles be in your favor!_
`

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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {friendlyRules}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 
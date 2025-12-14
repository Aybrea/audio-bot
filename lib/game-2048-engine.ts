// 2048 Game Engine
// Based on the original 2048 game by Gabriele Cirulli

export type Tile = {
  x: number;
  y: number;
  value: number;
  id: number;
  previousPosition?: { x: number; y: number };
  mergedFrom?: Tile[];
  isNew?: boolean;
};

export type GameStatus = "menu" | "playing" | "won" | "gameOver";

export type GameState = {
  grid: (Tile | null)[][];
  tiles: Tile[];
  score: number;
  bestScore: number;
  gameStatus: GameStatus;
  won: boolean;
  keepPlaying: boolean;
  size: number;
  nextTileId: number;
};

export type GameAction =
  | { type: "START_GAME" }
  | { type: "RESTART_GAME" }
  | { type: "MOVE"; direction: 0 | 1 | 2 | 3 } // 0: up, 1: right, 2: down, 3: left
  | { type: "KEEP_PLAYING" };

const GRID_SIZE = 4;
const START_TILES = 2;

// Create empty grid
function createEmptyGrid(size: number): (Tile | null)[][] {
  const grid: (Tile | null)[][] = [];

  for (let x = 0; x < size; x++) {
    grid[x] = [];
    for (let y = 0; y < size; y++) {
      grid[x][y] = null;
    }
  }

  return grid;
}

// Get available cells
function getAvailableCells(
  grid: (Tile | null)[][],
  size: number,
): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (!grid[x][y]) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

// Get random available cell
function getRandomAvailableCell(
  grid: (Tile | null)[][],
  size: number,
): { x: number; y: number } | null {
  const cells = getAvailableCells(grid, size);

  if (cells.length > 0) {
    return cells[Math.floor(Math.random() * cells.length)];
  }

  return null;
}

// Add random tile
function addRandomTile(state: GameState): GameState {
  const cell = getRandomAvailableCell(state.grid, state.size);

  if (!cell) return state;

  const value = Math.random() < 0.9 ? 2 : 4;
  const tile: Tile = {
    x: cell.x,
    y: cell.y,
    value,
    id: state.nextTileId,
    isNew: true,
  };

  const newGrid = state.grid.map((row) => [...row]);

  newGrid[cell.x][cell.y] = tile;

  return {
    ...state,
    grid: newGrid,
    tiles: [...state.tiles, tile],
    nextTileId: state.nextTileId + 1,
  };
}

// Initialize game with starting tiles
function initializeGame(bestScore: number): GameState {
  let state: GameState = {
    grid: createEmptyGrid(GRID_SIZE),
    tiles: [],
    score: 0,
    bestScore,
    gameStatus: "playing",
    won: false,
    keepPlaying: false,
    size: GRID_SIZE,
    nextTileId: 0,
  };

  // Add starting tiles
  for (let i = 0; i < START_TILES; i++) {
    state = addRandomTile(state);
  }

  return state;
}

// Get vector for direction
function getVector(direction: 0 | 1 | 2 | 3): { x: number; y: number } {
  const map = {
    0: { x: 0, y: -1 }, // Up
    1: { x: 1, y: 0 }, // Right
    2: { x: 0, y: 1 }, // Down
    3: { x: -1, y: 0 }, // Left
  };

  return map[direction];
}

// Build traversal order
function buildTraversals(vector: { x: number; y: number }, size: number) {
  const traversals = { x: [] as number[], y: [] as number[] };

  for (let pos = 0; pos < size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
}

// Check if position is within bounds
function withinBounds(
  position: { x: number; y: number },
  size: number,
): boolean {
  return (
    position.x >= 0 && position.x < size && position.y >= 0 && position.y < size
  );
}

// Find farthest position
function findFarthestPosition(
  cell: { x: number; y: number },
  vector: { x: number; y: number },
  grid: (Tile | null)[][],
  size: number,
) {
  let previous = cell;
  let current = { x: previous.x + vector.x, y: previous.y + vector.y };

  while (withinBounds(current, size) && !grid[current.x][current.y]) {
    previous = current;
    current = { x: previous.x + vector.x, y: previous.y + vector.y };
  }

  return {
    farthest: previous,
    next: current,
  };
}

// Check if moves are available
function movesAvailable(grid: (Tile | null)[][], size: number): boolean {
  // Check for empty cells
  if (getAvailableCells(grid, size).length > 0) {
    return true;
  }

  // Check for possible merges
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const tile = grid[x][y];

      if (tile) {
        for (let direction = 0; direction < 4; direction++) {
          const vector = getVector(direction as 0 | 1 | 2 | 3);
          const cell = { x: x + vector.x, y: y + vector.y };

          if (withinBounds(cell, size)) {
            const other = grid[cell.x][cell.y];

            if (other && other.value === tile.value) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

// Move tiles
function move(state: GameState, direction: 0 | 1 | 2 | 3): GameState {
  if (state.gameStatus === "gameOver") return state;
  if (state.gameStatus === "won" && !state.keepPlaying) return state;

  const vector = getVector(direction);
  const traversals = buildTraversals(vector, state.size);
  let moved = false;
  let score = state.score;
  let won = state.won;

  // Create new grid
  const newGrid = createEmptyGrid(state.size);
  const newTiles: Tile[] = [];
  const processedTiles = new Map<number, Tile>();

  // Prepare tiles (save positions)
  state.tiles.forEach((tile) => {
    const newTile = {
      ...tile,
      previousPosition: { x: tile.x, y: tile.y },
      mergedFrom: undefined,
      isNew: false,
    };

    processedTiles.set(tile.id, newTile);
  });

  // Traverse grid in the right direction
  traversals.x.forEach((x) => {
    traversals.y.forEach((y) => {
      const tile = state.grid[x][y];

      if (tile) {
        const positions = findFarthestPosition(
          { x, y },
          vector,
          newGrid,
          state.size,
        );
        const next = withinBounds(positions.next, state.size)
          ? newGrid[positions.next.x][positions.next.y]
          : null;

        // Check if we can merge
        if (next && next.value === tile.value && !next.mergedFrom) {
          const mergedValue = tile.value * 2;
          const mergedTile: Tile = {
            x: positions.next.x,
            y: positions.next.y,
            value: mergedValue,
            id: state.nextTileId + newTiles.length,
            mergedFrom: [tile, next],
          };

          newGrid[positions.next.x][positions.next.y] = mergedTile;
          newTiles.push(mergedTile);

          score += mergedValue;

          if (mergedValue === 2048) {
            won = true;
          }

          moved = true;
        } else {
          // Move tile to farthest position
          const movedTile = processedTiles.get(tile.id)!;

          movedTile.x = positions.farthest.x;
          movedTile.y = positions.farthest.y;

          newGrid[positions.farthest.x][positions.farthest.y] = movedTile;
          newTiles.push(movedTile);

          if (positions.farthest.x !== x || positions.farthest.y !== y) {
            moved = true;
          }
        }
      }
    });
  });

  if (!moved) {
    return state;
  }

  // Add new random tile
  let newState: GameState = {
    ...state,
    grid: newGrid,
    tiles: newTiles,
    score,
    bestScore: Math.max(score, state.bestScore),
    won,
    nextTileId: state.nextTileId + newTiles.length,
  };

  newState = addRandomTile(newState);

  // Check for game over
  if (!movesAvailable(newState.grid, newState.size)) {
    newState.gameStatus = "gameOver";
  } else if (won && !state.won) {
    newState.gameStatus = "won";
  }

  return newState;
}

// Load best score from localStorage
function loadBestScore(): number {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("game2048BestScore");

    return saved ? parseInt(saved, 10) : 0;
  }

  return 0;
}

// Save best score to localStorage
function saveBestScore(score: number): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("game2048BestScore", score.toString());
  }
}

export const initialGameState: GameState = {
  grid: createEmptyGrid(GRID_SIZE),
  tiles: [],
  score: 0,
  bestScore: 0,
  gameStatus: "menu",
  won: false,
  keepPlaying: false,
  size: GRID_SIZE,
  nextTileId: 0,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
    case "RESTART_GAME": {
      const bestScore = Math.max(state.bestScore, loadBestScore());

      saveBestScore(bestScore);

      return initializeGame(bestScore);
    }

    case "MOVE": {
      return move(state, action.direction);
    }

    case "KEEP_PLAYING": {
      return {
        ...state,
        gameStatus: "playing",
        keepPlaying: true,
      };
    }

    default:
      return state;
  }
}

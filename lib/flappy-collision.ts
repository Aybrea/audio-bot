import type { Bird, Pipe } from "@/types/flappy";

// Check if bird collides with ground
export function checkGroundCollision(bird: Bird, groundY: number): boolean {
  return bird.y + bird.radius >= groundY;
}

// Check if bird collides with ceiling
export function checkCeilingCollision(bird: Bird): boolean {
  return bird.y - bird.radius <= 0;
}

// Check if bird collides with a pipe
export function checkPipeCollision(bird: Bird, pipe: Pipe): boolean {
  // Check if bird is horizontally aligned with pipe
  const birdRight = bird.x + bird.radius;
  const birdLeft = bird.x - bird.radius;
  const pipeRight = pipe.x + pipe.width;
  const pipeLeft = pipe.x;

  if (birdRight < pipeLeft || birdLeft > pipeRight) {
    return false; // Not horizontally aligned
  }

  // Check if bird is in the gap
  const gapTop = pipe.gapY - pipe.gapHeight / 2;
  const gapBottom = pipe.gapY + pipe.gapHeight / 2;
  const birdTop = bird.y - bird.radius;
  const birdBottom = bird.y + bird.radius;

  // Collision if bird is NOT in the gap
  return birdTop < gapTop || birdBottom > gapBottom;
}

// Check all collisions
export function checkCollisions(
  bird: Bird,
  pipes: Pipe[],
  canvasHeight: number,
  groundHeight: number,
): boolean {
  // Check ground and ceiling
  if (checkGroundCollision(bird, canvasHeight - groundHeight)) return true;
  if (checkCeilingCollision(bird)) return true;

  // Check pipes
  for (const pipe of pipes) {
    if (checkPipeCollision(bird, pipe)) return true;
  }

  return false;
}

import type { Bird } from "@/types/flappy";

// Physics constants
const GRAVITY = 0.5;
const FLAP_VELOCITY = -8;
const MAX_VELOCITY = 10;

// Apply gravity to bird velocity
export function applyGravity(
  velocity: number,
  gravity: number = GRAVITY,
  deltaTime: number = 1,
): number {
  return Math.min(velocity + gravity * deltaTime, MAX_VELOCITY);
}

// Apply flap (instant velocity change)
export function applyFlap(): number {
  return FLAP_VELOCITY;
}

// Update bird position based on velocity
export function updateBirdPosition(
  bird: Bird,
  deltaTime: number = 1,
): Bird {
  const newVelocity = applyGravity(bird.velocity, GRAVITY, deltaTime);
  const newY = bird.y + newVelocity * deltaTime;

  return {
    ...bird,
    y: newY,
    velocity: newVelocity,
  };
}

// Calculate bird rotation based on velocity (for visual effect)
export function getBirdRotation(velocity: number): number {
  // Rotate bird based on velocity (-45° to +90°)
  return Math.max(-45, Math.min(90, velocity * 3));
}

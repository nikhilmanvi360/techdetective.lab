export class StatefulSpriteAnimator {
  constructor({
    image,
    frameWidth = DEFAULT_FRAME_SIZE,
    frameHeight = DEFAULT_FRAME_SIZE,
    states = {
      idle: { row: 0, frames: 4, fps: 4 },
      walk: { row: 1, frames: 6, fps: 8 },
      run: { row: 2, frames: 6, fps: 12 },
    },
    scale = 1,
    direction = "down",
    initialState = "idle",
  }) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.states = states;
    this.scale = scale;
    this.direction = direction;
    this.state = initialState;
    this.frame = 0;
    this.accumulator = 0;
  }

  setDirection(direction) {
    this.direction = direction;
  }

  setState(nextState) {
    if (!this.states[nextState]) {
      throw new Error(`Unknown sprite state: ${nextState}`);
    }
    if (this.state !== nextState) {
      this.state = nextState;
      this.frame = 0;
      this.accumulator = 0;
    }
  }

  updateFromSpeed(speed, thresholds = { walk: 0.1, run: 0.75 }) {
    if (speed <= thresholds.walk) {
      this.setState("idle");
    } else if (speed <= thresholds.run) {
      this.setState("walk");
    } else {
      this.setState("run");
    }
  }

  update(dt, moving = true) {
    const current = this.states[this.state];
    if (!current) {
      return;
    }

    if (!moving) {
      this.accumulator = 0;
      this.frame = 0;
      return;
    }

    this.accumulator += dt;
    const step = 1 / (current.fps || 1);
    const frames = current.frames || 1;

    while (this.accumulator >= step) {
      this.accumulator -= step;
      this.frame = (this.frame + 1) % frames;
    }
  }

  draw(ctx, x, y, {
    flip = false,
    row,
    scale = this.scale,
    width = this.frameWidth,
    height = this.frameHeight,
  } = {}) {
    const current = this.states[this.state];
    if (!current) {
      return;
    }

    const sx = this.frame * this.frameWidth;
    const sy = (row ?? current.row ?? directionRow(this.direction)) * this.frameHeight;
    const dw = width * scale;
    const dh = height * scale;

    ctx.save();
    ctx.translate(x, y);
    if (flip) {
      ctx.translate(dw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, 0, 0, dw, dh);
    ctx.restore();
  }
}

export function makeStatefulAnimator(image, options = {}) {
  return new StatefulSpriteAnimator({ image, ...options });
}

/*
Example usage:

import { loadImage, makeAnimator, directionRow } from "./sprite-animation.js";

const sheet = await loadImage("people and map/Tiled_files/Citizen1_Walk_without_shadow.png");
const player = makeAnimator(sheet, {
  frameWidth: 32,
  frameHeight: 32,
  frames: 6,
  fps: 10,
  scale: 1,
});

const actor = makeStatefulAnimator(sheet, {
  states: {
    idle: { row: 0, frames: 4, fps: 4 },
    walk: { row: 1, frames: 6, fps: 8 },
    run: { row: 2, frames: 6, fps: 12 },
  },
});

function tick(dt) {
  actor.setDirection("right");
  actor.updateFromSpeed(currentSpeed);
  actor.update(dt, moving);
  actor.draw(ctx, 100, 100, { flip: false });
}
*/
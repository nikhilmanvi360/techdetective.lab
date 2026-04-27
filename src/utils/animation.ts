export const DEFAULT_FRAME_SIZE = 32;

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
    img.crossOrigin = "anonymous";
  });
}

export function directionRow(direction: string): number {
  return (
    {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    }[direction as any] ?? 0
  );
}

export interface SpriteAnimatorOptions {
  image: HTMLImageElement;
  frameWidth?: number;
  frameHeight?: number;
  frames?: number;
  rows?: number;
  fps?: number;
  scale?: number;
}

export class SpriteAnimator {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  rows: number;
  fps: number;
  scale: number;

  frame: number;
  accumulator: number;
  direction: string;

  constructor({
    image,
    frameWidth = DEFAULT_FRAME_SIZE,
    frameHeight = DEFAULT_FRAME_SIZE,
    frames = 6,
    rows = 4,
    fps = 10,
    scale = 1,
  }: SpriteAnimatorOptions) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.rows = rows;
    this.fps = fps;
    this.scale = scale;

    this.frame = 0;
    this.accumulator = 0;
    this.direction = "down";
  }

  setDirection(direction: string) {
    this.direction = direction;
  }

  setFrame(frame: number) {
    this.frame = ((frame % this.frames) + this.frames) % this.frames;
  }

  reset() {
    this.frame = 0;
    this.accumulator = 0;
  }

  update(dt: number, moving = true) {
    if (!moving) {
      this.accumulator = 0;
      this.frame = 0;
      return;
    }

    this.accumulator += dt;
    const step = 1 / this.fps;

    while (this.accumulator >= step) {
      this.accumulator -= step;
      this.frame = (this.frame + 1) % this.frames;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    {
      flip = false,
      row = directionRow(this.direction),
      scale = this.scale,
      width = this.frameWidth,
      height = this.frameHeight,
    }: {
      flip?: boolean;
      row?: number;
      scale?: number;
      width?: number;
      height?: number;
    } = {}
  ) {
    const sx = this.frame * this.frameWidth;
    const sy = row * this.frameHeight;
    const dw = width * scale;
    const dh = height * scale;

    ctx.save();
    ctx.translate(x, y);
    if (flip) {
      ctx.translate(dw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.frameWidth,
      this.frameHeight,
      0,
      0,
      dw,
      dh
    );
    ctx.restore();
  }
}

export function makeAnimator(image: HTMLImageElement, options: Partial<SpriteAnimatorOptions> = {}) {
  return new SpriteAnimator({ image, ...options } as SpriteAnimatorOptions);
}

export interface AnimationState {
  row: number;
  frames: number;
  fps: number;
}

export interface StatefulSpriteAnimatorOptions {
  image: HTMLImageElement;
  frameWidth?: number;
  frameHeight?: number;
  states?: Record<string, AnimationState>;
  scale?: number;
  direction?: string;
  initialState?: string;
}

export class StatefulSpriteAnimator {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  states: Record<string, AnimationState>;
  scale: number;
  direction: string;
  state: string;
  frame: number;
  accumulator: number;

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
  }: StatefulSpriteAnimatorOptions) {
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

  setDirection(direction: string) {
    this.direction = direction;
  }

  setState(nextState: string) {
    if (!this.states[nextState]) {
      console.warn(`Unknown sprite state: ${nextState}`);
      return;
    }
    if (this.state !== nextState) {
      this.state = nextState;
      this.frame = 0;
      this.accumulator = 0;
    }
  }

  updateFromSpeed(speed: number, thresholds = { walk: 0.1, run: 0.75 }) {
    if (speed <= thresholds.walk) {
      this.setState("idle");
    } else if (speed <= thresholds.run) {
      this.setState("walk");
    } else {
      this.setState("run");
    }
  }

  update(dt: number, moving = true) {
    const current = this.states[this.state];
    if (!current) return;

    if (!moving && this.state === "idle") {
      // Keep idling animation playing even if not moving
    } else if (!moving) {
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

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    {
      flip = false,
      row,
      scale = this.scale,
      width = this.frameWidth,
      height = this.frameHeight,
    }: {
      flip?: boolean;
      row?: number;
      scale?: number;
      width?: number;
      height?: number;
    } = {}
  ) {
    const current = this.states[this.state];
    if (!current) return;

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
    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.frameWidth,
      this.frameHeight,
      0,
      0,
      dw,
      dh
    );
    ctx.restore();
  }
}

export function makeStatefulAnimator(image: HTMLImageElement, options: Partial<StatefulSpriteAnimatorOptions> = {}) {
  return new StatefulSpriteAnimator({ image, ...options } as StatefulSpriteAnimatorOptions);
}

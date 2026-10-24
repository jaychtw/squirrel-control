/** Authoritative, monotonic active-time state. Presentation never decides an outcome. */
export const ROUND_MS = 60_000;
export const TARGET_COUNT = 10;
export type Phase = 'idle' | 'running' | 'paused' | 'won' | 'lost';
export class Game {
  phase: Phase = 'idle';
  readonly caught = new Set<string>();
  readonly ids: ReadonlySet<string>;
  private accumulated = 0;
  private since = 0;
  constructor(ids: readonly string[]) {
    if (ids.length !== TARGET_COUNT || new Set(ids).size !== TARGET_COUNT) throw new Error('A round needs ten distinct targets');
    this.ids = new Set(ids);
  }
  elapsed(now: number): number {
    return Math.min(ROUND_MS, this.accumulated + (this.phase === 'running' ? Math.max(0, now - this.since) : 0));
  }
  remaining(now: number): number { return Math.max(0, ROUND_MS - this.elapsed(now)); }
  stage(now: number): number { return Math.min(4, Math.floor(this.elapsed(now) / 15_000)); }
  start(now: number): boolean {
    if (this.phase !== 'idle') return false;
    this.since = now; this.phase = 'running'; return true;
  }
  sync(now: number): void {
    if (this.phase === 'running' && this.elapsed(now) >= ROUND_MS) {
      this.accumulated = ROUND_MS; this.phase = 'lost';
    }
  }
  pause(now: number): boolean {
    this.sync(now);
    if (this.phase !== 'running') return false;
    this.accumulated = this.elapsed(now); this.phase = 'paused'; return true;
  }
  resume(now: number): boolean {
    if (this.phase !== 'paused') return false;
    this.since = now; this.phase = 'running'; return true;
  }
  catch(id: string, now: number): boolean {
    // At exactly 60,000 active ms, loss always wins, regardless of event order.
    this.sync(now);
    if (this.phase !== 'running' || !this.ids.has(id) || this.caught.has(id)) return false;
    this.caught.add(id);
    if (this.caught.size === TARGET_COUNT) {
      this.accumulated = this.elapsed(now); this.phase = 'won';
    }
    return true;
  }
}

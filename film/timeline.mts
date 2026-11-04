// 映像の台本を書き出す（音はこれを読む）。npx jiti film/timeline.mts > film/timeline.json
import { TOUR, TOUR_LENGTH, TOUR_SPEED, TOUR_START_TURN } from '../src/model/timeline';
import { state } from '../src/model/state';

const FPS = 60;
const arrivals: { t: number; kind: string }[] = [];
const decisions: number[] = [];
let prevArr = new Set<string>();
let prevDec = 0;
for (let f = 0; f < TOUR_LENGTH * FPS; f++) {
  const t = f / FPS;
  const st = state(TOUR_START_TURN + t * TOUR_SPEED);
  const now = new Set(st.arrivals.map((a) => `${a.route}:${Math.floor(st.turn - a.age)}`));
  for (const a of st.arrivals) if (!prevArr.has(`${a.route}:${Math.floor(st.turn - a.age)}`)) arrivals.push({ t, kind: a.kind });
  prevArr = now;
  if (f > 0 && st.readout.aiDecisions > prevDec) decisions.push(t);
  prevDec = st.readout.aiDecisions;
}
console.log(JSON.stringify({ duration: TOUR_LENGTH, fps: FPS, beats: TOUR, arrivals, decisions }, null, 1));

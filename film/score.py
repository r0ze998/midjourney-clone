"""雪風サイトの模型ツアー（32 秒）の音。teardown の sfx で、台本 film/timeline.json の時刻だけから鳴らす。

    python ~/.claude/skills/teardown/run_sfx.py film/score.py

- 下地：暗い短調の和音（Dm9 → B♭maj7 → Gm9 → A7sus4）、76 bpm、ドラムは弱く。
- 拍（層や視点が切り替わる時刻）：カーソルが押す小さなクリックと、カメラが動く分だけの空気。
- 荷の到着：ごく小さな低い音。AIの判断：AIの層が出ている拍だけ、紫の小さな音（高めの blip）。
- 検証の拍：一度だけ鐘。続けて動くもの（荷車）は鳴らさない。
"""

import os

from sfx.score_kit import airy, bed, chords, hz, thud
from sfx.synth import blip, chime, click

TIMELINE = "timeline.json"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "score.wav")
TARGET_LUFS = -14.0
SEED = 1117

CHORDS = chords("Dm9:D3 F3 A3 C4 E4/D2", "Bbmaj7:Bb2 D3 F3 A3/Bb1", "Gm9:G2 Bb2 D3 F3 A3/G1", "A7sus4:A2 D3 E3 G3/A1")
MOTIF = [(0.5, hz("A4")), (1.5, hz("F4")), (2.5, hz("E4"))]


def ai_on(beats, t):
    cur = [b for b in beats if b["t"] <= t][-1]
    return cur["layer"] == "ai"


def score(mix, tl):
    dur = tl["duration"]
    beats = tl["beats"]
    left, right, low, drums = bed(dur, 76, CHORDS, MOTIF, motif_voice="epiano", kicks=(0,), snares=(), hats=4, swing=0.0, keys_vel=0.62, keys_lp=3000)
    mix.put_stereo(0, left, right, 0.12)
    mix.put(0, low, 0.11)
    mix.put(0, drums, 0.025)

    for b in beats[1:]:
        # カーソルが押す（tourAt の press は拍の 0.12 秒前に最も沈む）
        mix.put(b["t"] - 0.12, click(2200, 0.025), 0.05)
        # 視点が変わる拍だけ、カメラの移り（1.1 秒）に空気を添える
        prev = [p for p in beats if p["t"] < b["t"]][-1]
        if prev["view"] != b["view"]:
            mix.put(b["t"], airy(1.2, 600, 1500, 0.6), 0.02)

    for a in tl["arrivals"]:
        if a["t"] > 0.05:
            mix.put(a["t"], thud(70 if a["kind"] == "human" else 82, 0.05, 0.3), 0.022)

    for t in tl["decisions"]:
        if ai_on(beats, t):
            mix.put(t, blip(hz("A5"), 0.28, 0.09), 0.02)

    verify = [b for b in beats if b["caption"] == "verify"][0]
    mix.put(verify["t"] + 0.35, chime([hz("D5"), hz("A5"), hz("E6")], 2.2, 0.8), 0.05)

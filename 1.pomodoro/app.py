"""Pomodoro Timer with rich visual feedback."""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

FOCUS_SECONDS_DEFAULT = 25 * 60
BREAK_SECONDS_DEFAULT = 5 * 60

_BLUE = (59, 130, 246)
_YELLOW = (250, 204, 21)
_RED = (239, 68, 68)


def _mix(start: tuple[int, int, int], end: tuple[int, int, int], ratio: float) -> tuple[int, int, int]:
    ratio = max(0.0, min(1.0, ratio))
    return (
        int(start[0] + (end[0] - start[0]) * ratio),
        int(start[1] + (end[1] - start[1]) * ratio),
        int(start[2] + (end[2] - start[2]) * ratio),
    )


def interpolate_color(progress: float) -> str:
    """Return a hex color that transitions blue -> yellow -> red."""
    progress = max(0.0, min(1.0, progress))
    if progress <= 0.5:
        rgb = _mix(_BLUE, _YELLOW, progress / 0.5)
    else:
        rgb = _mix(_YELLOW, _RED, (progress - 0.5) / 0.5)
    return "#" + "".join(f"{v:02x}" for v in rgb)


def _parse_seconds(raw: str | None, default_value: int) -> int:
    if raw is None:
        return default_value
    try:
        seconds = int(raw)
    except ValueError:
        return default_value
    return max(60, min(3 * 60 * 60, seconds))


def render_html(focus_seconds: int = FOCUS_SECONDS_DEFAULT, break_seconds: int = BREAK_SECONDS_DEFAULT) -> str:
    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pomodoro Visual Feedback</title>
  <style>
    :root {{
      --ring-color: {interpolate_color(0.0)};
      --bg-dark: #0f172a;
      --bg-light: #1e293b;
      --text: #e2e8f0;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, #1f2937 0%, #020617 65%);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: grid;
      place-items: center;
      overflow: hidden;
    }}
    canvas#bg {{
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }}
    .card {{
      position: relative;
      z-index: 1;
      width: min(92vw, 420px);
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 18px;
      backdrop-filter: blur(10px);
      padding: 24px;
      text-align: center;
    }}
    h1 {{ margin: 0 0 8px; font-size: 1.25rem; }}
    .mode {{ font-size: 0.9rem; opacity: 0.85; margin-bottom: 16px; }}
    .ring-wrap {{ width: 250px; margin: 0 auto 16px; position: relative; }}
    .time {{
      position: absolute; inset: 0;
      display: grid; place-items: center;
      font-size: 2rem; font-weight: 700;
      text-shadow: 0 0 12px rgba(148, 163, 184, 0.35);
    }}
    .controls {{ display: flex; gap: 8px; justify-content: center; margin-bottom: 14px; }}
    button {{
      border: 0; border-radius: 10px; cursor: pointer;
      padding: 8px 12px; font-weight: 600;
      color: #0f172a; background: #f8fafc;
    }}
    button.secondary {{ background: #cbd5e1; }}
    .survey {{
      text-align: left;
      background: rgba(30, 41, 59, 0.7);
      border-radius: 12px;
      padding: 12px;
      font-size: 0.9rem;
    }}
    .survey-row {{ display: flex; align-items: center; justify-content: space-between; gap: 8px; }}
    .survey button {{ padding: 6px 10px; font-size: 0.85rem; }}
    .history {{ margin-top: 8px; font-size: 0.8rem; opacity: 0.9; min-height: 1.2em; }}
  </style>
</head>
<body>
  <canvas id="bg"></canvas>
  <section class="card">
    <h1>Pomodoro Timer</h1>
    <div class="mode" id="modeLabel">集中時間</div>
    <div class="ring-wrap">
      <svg viewBox="0 0 220 220" aria-label="円形プログレスバー">
        <circle cx="110" cy="110" r="90" stroke="rgba(148,163,184,0.25)" stroke-width="16" fill="none"></circle>
        <circle id="progressRing" cx="110" cy="110" r="90" stroke="var(--ring-color)" stroke-width="16"
          stroke-linecap="round" fill="none"
          transform="rotate(-90 110 110)"
          stroke-dasharray="565.49" stroke-dashoffset="0"
          style="transition: stroke 0.35s linear, stroke-dashoffset 0.35s linear;"></circle>
      </svg>
      <div class="time" id="timeText">25:00</div>
    </div>
    <div class="controls">
      <button id="startBtn">開始</button>
      <button id="pauseBtn" class="secondary">一時停止</button>
      <button id="resetBtn" class="secondary">リセット</button>
    </div>
    <div class="survey">
      <div style="font-weight:700; margin-bottom:8px;">視覚効果の体感ログ（測定用）</div>
      <div class="survey-row">
        <span>集中力:</span>
        <div>
          <button data-type="focus" data-score="1">1</button>
          <button data-type="focus" data-score="3">3</button>
          <button data-type="focus" data-score="5">5</button>
        </div>
      </div>
      <div class="survey-row" style="margin-top:8px;">
        <span>没入感:</span>
        <div>
          <button data-type="immersion" data-score="1">1</button>
          <button data-type="immersion" data-score="3">3</button>
          <button data-type="immersion" data-score="5">5</button>
        </div>
      </div>
      <div class="history" id="history"></div>
    </div>
  </section>
  <script>
    const FULL_FOCUS = {focus_seconds};
    const FULL_BREAK = {break_seconds};
    const ring = document.getElementById('progressRing');
    const timeText = document.getElementById('timeText');
    const modeLabel = document.getElementById('modeLabel');
    const root = document.documentElement;
    const circumference = 2 * Math.PI * 90;
    const START_BLUE = [59, 130, 246];
    const MID_YELLOW = [250, 204, 21];
    const END_RED = [239, 68, 68];

    let mode = 'focus';
    let total = FULL_FOCUS;
    let remaining = FULL_FOCUS;
    let timerId = null;

    function mix(a, b, t) {{
      return a.map((v, i) => Math.round(v + (b[i] - v) * t));
    }}
    function toHex(rgb) {{
      return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
    }}
    function ringColor(progress) {{
      const p = Math.max(0, Math.min(1, progress));
      if (p <= 0.5) return toHex(mix(START_BLUE, MID_YELLOW, p / 0.5));
      return toHex(mix(MID_YELLOW, END_RED, (p - 0.5) / 0.5));
    }}
    function fmt(s) {{
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = Math.floor(s % 60).toString().padStart(2, '0');
      return `${{m}}:${{sec}}`;
    }}
    function draw() {{
      const elapsedRatio = 1 - (remaining / total);
      ring.style.strokeDasharray = `${{circumference}}`;
      ring.style.strokeDashoffset = `${{circumference * elapsedRatio}}`;
      const color = ringColor(elapsedRatio);
      root.style.setProperty('--ring-color', color);
      timeText.textContent = fmt(remaining);
      modeLabel.textContent = mode === 'focus' ? '集中時間' : '休憩時間';
    }}
    function switchMode() {{
      mode = mode === 'focus' ? 'break' : 'focus';
      total = mode === 'focus' ? FULL_FOCUS : FULL_BREAK;
      remaining = total;
      draw();
    }}
    function tick() {{
      if (remaining > 0) {{
        remaining -= 1;
        draw();
      }} else {{
        switchMode();
      }}
    }}
    document.getElementById('startBtn').addEventListener('click', () => {{
      if (timerId) return;
      timerId = setInterval(tick, 1000);
    }});
    document.getElementById('pauseBtn').addEventListener('click', () => {{
      clearInterval(timerId);
      timerId = null;
    }});
    document.getElementById('resetBtn').addEventListener('click', () => {{
      clearInterval(timerId);
      timerId = null;
      mode = 'focus';
      total = FULL_FOCUS;
      remaining = FULL_FOCUS;
      draw();
    }});

    const history = document.getElementById('history');
    function renderLogs() {{
      const logs = JSON.parse(localStorage.getItem('visualFeedbackLogs') || '[]');
      if (!logs.length) {{
        history.textContent = '未記録';
        return;
      }}
      const latest = logs.slice(-3).map(l => `${{l.type}}:${{l.score}}`).join(' / ');
      history.textContent = `最新ログ: ${{latest}}`;
    }}
    document.querySelectorAll('.survey button').forEach(btn => {{
      btn.addEventListener('click', () => {{
        const logs = JSON.parse(localStorage.getItem('visualFeedbackLogs') || '[]');
        logs.push({{
          at: new Date().toISOString(),
          type: btn.dataset.type,
          score: Number(btn.dataset.score),
          mode
        }});
        localStorage.setItem('visualFeedbackLogs', JSON.stringify(logs));
        renderLogs();
      }});
    }});

    // Background animation: particles + ripple when focused.
    const canvas = document.getElementById('bg');
    const ctx = canvas.getContext('2d');
    const PARTICLE_COUNT = 60;
    const RIPPLE_SPAWN_PROBABILITY = 0.03;
    const particles = Array.from({{ length: PARTICLE_COUNT }}, () => ({{ x: 0, y: 0, vx: 0, vy: 0, r: 0 }}));
    let ripples = [];

    function resize() {{
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles.forEach(p => {{
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
        p.vx = (Math.random() - 0.5) * 0.7;
        p.vy = (Math.random() - 0.5) * 0.7;
        p.r = Math.random() * 2.2 + 0.8;
      }});
    }}
    window.addEventListener('resize', resize);
    resize();

    function drawBg() {{
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (mode === 'focus') {{
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        particles.forEach(p => {{
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }});
        if (Math.random() < RIPPLE_SPAWN_PROBABILITY) {{
          ripples.push({{ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: 10, alpha: 0.35 }});
        }}
      }}
      ripples = ripples.filter(r => r.alpha > 0);
      ripples.forEach(r => {{
        r.radius += 1.8;
        r.alpha -= 0.004;
        ctx.strokeStyle = `rgba(125, 211, 252, ${{r.alpha}})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
      }});
      requestAnimationFrame(drawBg);
    }}

    draw();
    renderLogs();
    drawBg();
  </script>
</body>
</html>"""


class PomodoroRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        focus = _parse_seconds(query.get("focus", [None])[0], FOCUS_SECONDS_DEFAULT)
        brk = _parse_seconds(query.get("break", [None])[0], BREAK_SECONDS_DEFAULT)
        html = render_html(focus, brk).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        self.wfile.write(html)

    def log_message(self, fmt: str, *args: object) -> None:  # noqa: A003
        """Silence default request logs to keep timer output clean."""
        return


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    httpd = ThreadingHTTPServer((host, port), PomodoroRequestHandler)
    print(f"Pomodoro app running: http://{host}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    run_server()

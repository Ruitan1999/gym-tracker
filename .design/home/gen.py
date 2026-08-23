import pathlib
from shell import HEAD, TAIL, header, nav, scroll, cta

CARD = 'background:#ffffff;border:1px solid #ececec;border-radius:16px;'
FAINT = '#9a9a9a'; MUTED = '#595959'; ACCENT = '#047857'

def daydots(done=(0,2,4), today=5):
    out = []
    for i, d in enumerate(['M','T','W','T','F','S','S']):
        on = i in done
        ring = f'border:1.5px solid {ACCENT};' if i == today else 'border:1.5px solid transparent;'
        bg = ACCENT if on else '#ececec'
        fg = '#ffffff' if on else FAINT
        out.append(f'<div style="flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:5px;">'
                   f'<div style="width:100%;height:34px;border-radius:12px;background:{bg};{ring}box-sizing:border-box;"></div>'
                   f'<span class="caps" style="font-size:8px;color:{FAINT};">{d}</span></div>')
    return '<div style="display:flex;gap:5px;">' + ''.join(out) + '</div>'

def exrow(name, detail, tone='#0a0a0a'):
    return (f'<div style="display:flex;align-items:center;gap:10px;">'
            f'<div style="width:38px;height:38px;border-radius:16px;background:#ececec;flex:0 0 auto;"></div>'
            f'<div style="flex:1 1 auto;min-width:0;">'
            f'<div style="font-size:14px;font-weight:600;color:{tone};">{name}</div>'
            f'<div class="mono" style="font-size:11px;color:{MUTED};margin-top:1px;">{detail}</div></div></div>')

# ─────────────────────────── CURRENT ───────────────────────────
current = scroll(f'''
    <div>
      <div class="caps" style="font-size:10px;color:{FAINT};">WELCOME, RUI</div>
      <div style="font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1.15;margin-top:2px;">Let&#39;s get training today.</div>
    </div>

    <div style="{CARD}padding:16px;display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;justify-content:space-between;">
        <span class="caps" style="font-size:9px;color:{FAINT};">MOMENTUM</span>
        <span class="caps" style="font-size:9px;color:{FAINT};">2 SESSIONS THIS WEEK</span>
      </div>
      <div style="display:flex;align-items:center;gap:16px;">
        <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" stroke="#d4d4d4" stroke-width="4" fill="none"/><circle cx="32" cy="32" r="30" stroke="{ACCENT}" stroke-width="4" fill="none" stroke-dasharray="188" stroke-dashoffset="141" transform="rotate(-90 32 32)"/><text x="32" y="38" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="20" font-weight="500" fill="#0a0a0a">3</text></svg>
        <div style="flex:1 1 auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
          <div><div class="mono" style="font-size:22px;font-weight:500;color:{ACCENT};">3</div><div class="caps" style="font-size:8px;color:{FAINT};">STREAK &middot; WEEKS</div></div>
          <div><div class="mono" style="font-size:22px;font-weight:500;">47</div><div class="caps" style="font-size:8px;color:{FAINT};">SESSIONS &middot; TOTAL</div></div>
        </div>
      </div>
      {daydots()}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:20px;font-weight:700;letter-spacing:-0.02em;">Workout Template</span>
      <span class="caps" style="font-size:10px;">MANAGE &rarr;</span>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="{CARD}padding:12px 12px 10px;position:relative;">
        <div style="font-size:16px;font-weight:700;letter-spacing:-0.02em;">Push Day A</div>
        <div class="caps" style="font-size:9px;color:{FAINT};margin-top:2px;">06 EXERCISES</div>
      </div>
      <div style="{CARD}padding:12px 12px 10px;">
        <div style="font-size:16px;font-weight:700;letter-spacing:-0.02em;">Leg Day</div>
        <div class="caps" style="font-size:9px;color:{FAINT};margin-top:2px;">05 EXERCISES</div>
      </div>
    </div>
''')

# ─────────────────────────── MAIN — pick up where you left off ───────────────────────────
main = scroll(f'''
    <div style="display:flex;align-items:baseline;justify-content:space-between;">
      <span class="caps" style="font-size:10px;color:{FAINT};">TUESDAY &middot; PUSH DAY</span>
      <span class="caps" style="font-size:10px;color:{ACCENT};font-weight:700;">WEEK 3 &middot; KEEP IT</span>
    </div>

    <div style="{CARD}padding:0;overflow:hidden;">
      <div style="padding:16px 16px 14px;background:rgba(4,120,87,0.08);border-bottom:1px solid #ececec;">
        <div class="caps" style="font-size:9px;color:{ACCENT};font-weight:700;">NEXT UP &middot; LAST DONE 4 DAYS AGO</div>
        <div style="font-size:28px;font-weight:700;letter-spacing:-0.03em;line-height:1.1;margin-top:4px;">Push Day A</div>
      </div>
      <div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px;">
        {exrow('Bench Press','3 &times; 8 &nbsp;&middot;&nbsp; 80 kg last time')}
        {exrow('Overhead Press','3 &times; 8 &nbsp;&middot;&nbsp; 45 kg last time')}
        {exrow('Cable Fly','3 &times; 12 &nbsp;&middot;&nbsp; 20 kg last time')}
        <div class="caps" style="font-size:9px;color:{FAINT};">+ 3 MORE</div>
      </div>
    </div>

    <div style="display:flex;gap:8px;">
      <div style="flex:1 1 0;{CARD}padding:11px 12px;">
        <div style="font-size:14px;font-weight:700;letter-spacing:-0.02em;">Leg Day</div>
        <div class="caps" style="font-size:8px;color:{FAINT};margin-top:2px;">05 EXERCISES</div>
      </div>
      <div style="flex:1 1 0;{CARD}padding:11px 12px;">
        <div style="font-size:14px;font-weight:700;letter-spacing:-0.02em;">Pull Day</div>
        <div class="caps" style="font-size:8px;color:{FAINT};margin-top:2px;">06 EXERCISES</div>
      </div>
      <div style="flex:0 0 auto;{CARD}padding:11px 12px;display:flex;align-items:center;">
        <span class="caps" style="font-size:10px;color:{MUTED};">ALL</span>
      </div>
    </div>

    <div style="{CARD}padding:12px 14px;display:flex;align-items:center;gap:12px;">
      <div style="flex:1 1 auto;">{daydots()}</div>
    </div>
''')

# ─────────────────────────── OPTION B — streak first ───────────────────────────
optionb = scroll(f'''
    <div style="{CARD}padding:18px 16px;background:#0a0a0a;border-color:#0a0a0a;display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;align-items:flex-end;gap:12px;">
        <div class="mono" style="font-size:64px;line-height:0.85;font-weight:500;color:#ffffff;">3</div>
        <div style="padding-bottom:6px;">
          <div class="caps" style="font-size:10px;color:#ffffff;font-weight:700;">WEEK STREAK</div>
          <div class="caps" style="font-size:9px;color:#9a9a9a;margin-top:3px;">BEST EVER &middot; 7</div>
        </div>
      </div>
      <div style="height:6px;border-radius:16px;background:#3a3a3a;overflow:hidden;">
        <div style="width:25%;height:100%;background:{ACCENT};"></div>
      </div>
      <div class="caps" style="font-size:9px;color:#9a9a9a;">4 MORE WEEKS TO BEAT YOUR BEST</div>
    </div>

    <div style="{CARD}padding:14px 16px;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span class="caps" style="font-size:9px;color:{FAINT};">THIS WEEK</span>
        <span class="caps" style="font-size:9px;color:{ACCENT};font-weight:700;">TRAIN TODAY TO KEEP IT</span>
      </div>
      {daydots()}
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;">
      <span class="caps" style="font-size:9px;color:{FAINT};">START FROM</span>
      <div style="display:flex;gap:8px;">
        <div style="flex:1 1 0;{CARD}padding:12px;">
          <div style="font-size:15px;font-weight:700;letter-spacing:-0.02em;">Push Day A</div>
          <div class="caps" style="font-size:8px;color:{FAINT};margin-top:2px;">06 EXERCISES</div>
        </div>
        <div style="flex:1 1 0;{CARD}padding:12px;">
          <div style="font-size:15px;font-weight:700;letter-spacing:-0.02em;">Leg Day</div>
          <div class="caps" style="font-size:8px;color:{FAINT};margin-top:2px;">05 EXERCISES</div>
        </div>
      </div>
    </div>
''')

# ─────────────────────────── OPTION C — beat last time ───────────────────────────
optionc = scroll(f'''
    <div>
      <div class="caps" style="font-size:10px;color:{FAINT};">TODAY&#39;S TARGET</div>
      <div style="font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1.15;margin-top:2px;">Beat 80 kg on bench.</div>
    </div>

    <div style="{CARD}padding:16px;display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:48px;height:48px;border-radius:16px;background:#ececec;flex:0 0 auto;"></div>
        <div style="flex:1 1 auto;">
          <div style="font-size:17px;font-weight:700;letter-spacing:-0.02em;">Bench Press</div>
          <div class="caps" style="font-size:9px;color:{FAINT};margin-top:2px;">CHEST &middot; LAST DONE 4 DAYS AGO</div>
        </div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:14px;">
        <div><div class="mono" style="font-size:15px;color:{MUTED};">80.0</div><div class="caps" style="font-size:8px;color:{FAINT};margin-top:2px;">LAST &middot; KG</div></div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{ACCENT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:6px;"><path d="M5 12h13M13 6l6 6-6 6"/></svg>
        <div><div class="mono" style="font-size:30px;line-height:1;font-weight:500;color:{ACCENT};">82.5</div><div class="caps" style="font-size:8px;color:{FAINT};margin-top:3px;">TRY TODAY &middot; KG</div></div>
        <svg width="86" height="34" viewBox="0 0 86 34" fill="none" style="margin-left:auto;margin-bottom:2px;"><path d="M2 30 L18 26 L34 27 L50 19 L66 14 L84 6" stroke="{ACCENT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>

    <div style="{CARD}padding:14px 16px;display:flex;flex-direction:column;gap:10px;">
      <span class="caps" style="font-size:9px;color:{FAINT};">ALSO DUE THIS WEEK</span>
      <div style="display:flex;flex-direction:column;gap:11px;">
        {exrow('Barbell Row','last 3 &times; 8 &nbsp;&middot;&nbsp; 70 kg')}
        {exrow('Back Squat','last 4 &times; 6 &nbsp;&middot;&nbsp; 110 kg')}
      </div>
    </div>

    <div style="{CARD}padding:12px 14px;">{daydots()}</div>
''')

FILES = {
  'Current.dc.html': (header('Log Session'), current, cta('START WORKOUT &rarr;'), nav(0)),
  'Main.dc.html':    (header('Today'),       main,    cta('START PUSH DAY A &rarr;'), nav(0)),
  'OptionB.dc.html': (header('Today'),       optionb, cta('START WORKOUT &rarr;'), nav(0)),
  'OptionC.dc.html': (header('Today'),       optionc, cta('START BENCH PRESS &rarr;'), nav(0)),
}
for fname, (h, body, c, n) in FILES.items():
    pathlib.Path(fname).write_text(HEAD + h + body + c + n + TAIL)
    print('wrote', fname)

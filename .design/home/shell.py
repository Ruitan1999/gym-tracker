HEAD = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=JetBrains+Mono:wght@400;500;700&display=swap">
  <style>
    body { margin: 0; background: #f5f5f4; color: #0a0a0a;
           font-family: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;
           -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }
    a { color: #036349; } a:hover { color: #024e3a; }
    .mono { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-variant-numeric: tabular-nums; }
    .caps { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace;
            text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
  </style>
</helmet>
<div style="width: 390px; height: 844px; background: #f5f5f4; display: flex; flex-direction: column; overflow: hidden;">
'''

def header(title):
    return f'''  <div style="background: #ffffff; border-bottom: 1px solid #ececec; padding: 14px 16px 12px; display: flex; align-items: center; justify-content: space-between; flex: 0 0 auto;">
    <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.03em;">{title}</span>
    <span style="width: 32px; height: 32px; border-radius: 16px; background: #f4f4f4; display: flex; align-items: center; justify-content: center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#595959" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    </span>
  </div>
'''

def nav(active=0):
    items = [("Log","M6 8h2v8H6zM16 8h2v8h-2zM8 11h8v2H8z"),("Book","M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"),("Stats","M4 19V10M10 19V5M16 19v-6"),("Set","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 12h2M18 12h2M12 4v2M12 18v2")]
    cells = []
    for i,(label, d) in enumerate(items):
        col = "#047857" if i == active else "#9a9a9a"
        cells.append(f'''<div style="flex: 1 1 0; display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="{d}"/></svg>
        <span class="caps" style="font-size: 8px; color: {col};">{label}</span>
      </div>''')
    return f'''  <div style="background: #ffffff; border-top: 1px solid #ececec; padding: 10px 8px 14px; display: flex; flex: 0 0 auto;">
      {"".join(cells)}
  </div>
'''

TAIL = '''</div>
</x-dc>
</body>
</html>
'''

def scroll(inner, pad_bottom=16):
    return f'''  <div style="flex: 0 1 auto; min-height: 0; overflow: hidden; padding: 16px 16px {pad_bottom}px; display: flex; flex-direction: column; gap: 14px;">
{inner}
  </div>
'''

def cta(label):
    return f'''  <div style="padding: 0 16px 12px; flex: 0 0 auto; margin-top: auto;">
    <button style="width: 100%; height: 52px; border: none; border-radius: 16px; background: #047857; color: #ffffff;
                   font-family: inherit; font-weight: 700; font-size: 12px; letter-spacing: 0.08em;
                   text-transform: uppercase;">{label}</button>
  </div>
'''

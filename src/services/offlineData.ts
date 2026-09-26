// A small CSV parser: quoted commas, escaped quotes, and multiline cells are supported.
export function parseCSV(source: string): string[][] | null {
  const lines = source.trim().split(/\r?\n/);
  const start = lines.findIndex(line => line.includes(','));
  if (start < 0) return null;
  const input = lines.slice(start).join('\n');
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || !cell.trim()) quoted = !quoted;
      else return null;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(cell.trim()); cell = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else cell += c;
  }
  if (quoted) return null;
  row.push(cell.trim()); rows.push(row);
  if (rows.length < 2 || rows[0].length < 2 || rows.some(r => r.length !== rows[0].length)) return null;
  return rows;
}

export function offlineDataResponse(prompt: string): string | null {
  if (!/\b(csv|table|data)\b/i.test(prompt)) return null;
  const rows = parseCSV(prompt);
  if (!rows) return null;
  const [headers, ...data] = rows;
  const columns = headers.map((header, i) => `Col(${JSON.stringify(header)}, ${JSON.stringify(data.map(row => row[i]))})`);
  return `root = Stack([title, notice, table])\ntitle = TextContent("Your data", "large-heavy")\nnotice = Callout("info", "Offline data view", "${data.length} rows. Values preserved as supplied. Connect OpenAI for analysis or follow-up edits.")\ntable = Table([${columns.join(', ')}])`;
}

/**
 * Unit Tests: CSV Parser Logic
 * Tests the CSV parsing function used in import actions
 */

// Extract the parseCSV function logic (it's private in the module, so we reimplement for testing)
function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });

  return { headers, rows };
}

describe('parseCSV', () => {
  it('parses basic CSV with headers and rows', () => {
    const csv = `full_name,email,grade
Alex Smith,alex@example.com,9
Jane Doe,jane@example.com,10`;

    const result = parseCSV(csv);
    expect(result.headers).toEqual(['full_name', 'email', 'grade']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      full_name: 'Alex Smith',
      email: 'alex@example.com',
      grade: '9',
    });
  });

  it('handles quoted values', () => {
    const csv = `"Full Name","Email"
"Alex Smith","alex@example.com"`;

    const result = parseCSV(csv);
    expect(result.headers).toEqual(['full_name', 'email']);
    expect(result.rows[0].full_name).toBe('Alex Smith');
  });

  it('normalizes header names (lowercase, underscores)', () => {
    const csv = `Full Name,Parent Email,Student Grade
a,b,c`;

    const result = parseCSV(csv);
    expect(result.headers).toEqual(['full_name', 'parent_email', 'student_grade']);
  });

  it('returns empty for header-only CSV', () => {
    const csv = `full_name,email`;
    const result = parseCSV(csv);
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('returns empty for empty string', () => {
    const result = parseCSV('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('handles missing values (fills with empty string)', () => {
    const csv = `name,email,grade
Alex,,9`;

    const result = parseCSV(csv);
    expect(result.rows[0].email).toBe('');
  });

  it('trims whitespace from values', () => {
    const csv = `name , email
 Alex , alex@example.com `;

    const result = parseCSV(csv);
    expect(result.rows[0].name).toBe('Alex');
    expect(result.rows[0].email).toBe('alex@example.com');
  });
});

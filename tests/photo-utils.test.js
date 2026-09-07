const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScript } = require('./helpers');

const win = loadBrowserScript('assets/js/util.js');
loadBrowserScript('assets/js/photo-utils.js', win);
const { escapeHtml, debounce, photos } = win.TreePage;

describe('escapeHtml', () => {
  test('neutralizes every HTML-significant character', () => {
    assert.equal(escapeHtml(`<img src=x onerror="alert('1')">&`),
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;');
  });

  test('coerces non-strings', () => {
    assert.equal(escapeHtml(42), '42');
    assert.equal(escapeHtml(null), 'null');
  });
});

describe('debounce', () => {
  test('collapses a burst into the final call', async () => {
    const calls = [];
    const fn = debounce((v) => calls.push(v), 10);
    fn(1); fn(2); fn(3);
    await new Promise((r) => setTimeout(r, 30));
    assert.deepEqual(calls, [3]);
  });
});

describe('parsePhotoFilename', () => {
  const parse = photos.parsePhotoFilename;

  test('date_location_parts_title', () => {
    const r = parse('2023-08-18_Cape_Town_Table.jpg');
    assert.equal(r.date.toISOString().slice(0, 10), '2023-08-18');
    assert.equal(r.location, 'Cape, Town');
    assert.equal(r.title, 'Table');
  });

  test('date and a single word: title only, no location', () => {
    const r = parse('2024-01-01_Sunset.jpg');
    assert.equal(r.title, 'Sunset');
    assert.equal(r.location, undefined);
  });

  test('no date: undefined date, parts still parsed', () => {
    const r = parse('Paris_Eiffel.png');
    assert.equal(r.date, undefined);
    assert.equal(r.location, 'Paris');
    assert.equal(r.title, 'Eiffel');
  });

  test('single token: nothing parsed', () => {
    assert.deepEqual(parse('photo.jpg'), {});
  });

  test('hyphen after date attaches to the first part (existing behavior preserved)', () => {
    const r = parse('2024-10-15-New_York_Columbia.jpg');
    assert.equal(r.location, 'York');
    assert.equal(r.title, 'Columbia');
  });

  test('output is data, not markup: a hostile filename parses to inert strings', () => {
    const r = parse('2024-01-01_<b>Bold</b>_<script>x</script>.jpg');
    assert.equal(r.location, '<b>Bold</b>');
    assert.equal(escapeHtml(r.title), '&lt;script&gt;x&lt;/script&gt;');
  });
});

describe('createDemoPhotos', () => {
  test('returns three well-formed placeholders', () => {
    const demo = photos.createDemoPhotos();
    assert.equal(demo.length, 3);
    for (const p of demo) {
      assert.ok(p.id && p.url && p.title && p.location && p.date instanceof Date);
    }
  });
});

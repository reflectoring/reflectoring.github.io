// The search page: loads the search index (index.json) and shows the posts that match ?s=… with Fuse.js.
import Fuse from './vendor/fuse.min.mjs';

const input = document.getElementById('search-query');
const results = document.getElementById('search-results');
const count = document.getElementById('search-count');
const query = new URLSearchParams(location.search).get('s')?.trim() ?? '';
input.value = query;

const escape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const highlight = (text) => escape(text).replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');

// A short piece of the text around the first match, or its start.
function snippet(text) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  const start = Math.max(0, i - 80);
  return (start > 0 ? '… ' : '') + text.slice(start, start + 240).trim() + ' …';
}

async function search() {
  if (!query) return;
  const pages = await (await fetch(results.dataset.index)).json();
  const fuse = new Fuse(pages, {
    ignoreLocation: true, threshold: 0.3, minMatchCharLength: 3,
    keys: [{ name: 'title', weight: 0.8 }, { name: 'categories', weight: 0.5 }, { name: 'contents', weight: 0.3 }],
  });
  const found = fuse.search(query).slice(0, 30);
  count.textContent = found.length
    ? `${found.length === 30 ? 'The first 30' : found.length} articles match "${query}"`
    : `No articles match "${query}". Try another word, or browse a topic.`;
  results.innerHTML = found.map(({ item }) => `<li class="post-item">
    ${item.categories?.length ? `<span class="post-cat">${escape(item.categories[0])}</span>` : ''}
    <h3><a href="${item.permalink}">${highlight(item.title)}</a></h3>
    <p>${highlight(snippet(item.contents))}</p>
    <div class="meta"><span>${escape(item.date)}</span></div></li>`).join('');
}
search();

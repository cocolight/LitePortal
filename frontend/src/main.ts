import './style.css'
import { autoSelect } from './auto-route'
import { showContextMenu } from './contextMenu'
import { openEditModal } from './editModal'  

interface Link {
  name: string
  icon: string
  int: string
  ext: string
}

let cfg: { links: Link[] } = { links: [] }


const grid = document.getElementById('grid') as HTMLDivElement
const themeBtn = document.getElementById('themeToggle') as HTMLButtonElement

async function load() {
  cfg = await fetch('/api/config').then(r => r.json())
  render()
}

/* ========== 搜索引擎配置 ========== */
const engines = [
  { name: 'Google',  url: 'https://www.google.com/search?q=' },
  { name: '百度',    url: 'https://www.baidu.com/s?wd=' },
  { name: '必应',    url: 'https://cn.bing.com/search?q=' },
  { name: 'Duck',    url: 'https://duckduckgo.com/?q=' }
];
let currentEngine = engines[0];

/* ========== 渲染搜索框 ========== */
function buildSearchBox() {
  const searchBox = document.createElement('section');
  searchBox.className = 'search-box';
  searchBox.innerHTML = `
    <select id="engineSelect">
      ${engines.map(e => `<option value="${e.url}">${e.name}</option>`).join('')}
    </select>
    <input id="searchInput" type="text" placeholder="输入关键词回车搜索…" />
  `;
  document.body.insertBefore(searchBox, document.getElementById('grid'));

  // 事件绑定
  const select = searchBox.querySelector('#engineSelect') as HTMLSelectElement;
  const input  = searchBox.querySelector('#searchInput')  as HTMLInputElement;
  select.addEventListener('change', () => currentEngine = engines.find(e => e.url === select.value)!);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.open(currentEngine.url + encodeURIComponent(input.value.trim()), '_blank');
      input.value = '';
    }
  });
}




function render() {
  grid.innerHTML = ''
  // 确保 cfg.links 是数组，避免 forEach 报错
  if (!cfg.links || !Array.isArray(cfg.links)) {
    cfg.links = [];
  }
  cfg.links.forEach(l => {
    const card = document.createElement('a')
    card.className = 'card'
    card.innerHTML = `<img src="${l.icon}" onerror="this.src='https://api.iconify.design/mdi:web.svg'"/><div>${l.name}</div>`
    card.addEventListener('contextmenu', e => showContextMenu(e, l, load))
    card.addEventListener('click', async e => {
      e.preventDefault()
      const url = await autoSelect(l.int, l.ext)
      if (url) window.open(url, '_blank')
    })
    grid.appendChild(card)
  })

  // 新增按钮
  const addBtn = document.createElement('a')
  addBtn.className = 'card'
  addBtn.innerHTML = `<img src="https://api.iconify.design/mdi:plus.svg"/><div>添加</div>`
  addBtn.addEventListener('click', () =>
    openEditModal({ name: '', icon: '', int: '', ext: '', desc: '' }, load)
  )
  grid.appendChild(addBtn)
}

render()
buildSearchBox();
load()

/* 暗黑模式 */
themeBtn.onclick = () => {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark'
  document.documentElement.setAttribute('data-theme', dark ? '' : 'dark')
  localStorage.setItem('theme', dark ? '' : 'dark')
}
(() => {
  const t = localStorage.getItem('theme')
  if (t) document.documentElement.setAttribute('data-theme', t)
})()
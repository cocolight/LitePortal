import './style.css'
import { autoSelect } from './auto-route'
import { showContextMenu } from './contextMenu'
import { openEditModal } from './editModal'  

interface Link {
  name: string
  icon: string
  int: string
  ext: string
  desc?: string
  uploadIcon?: string
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
    <div class="search-container">
      <div class="search-engines">
        ${engines.map((e, index) => `
          <button class="engine-btn ${index === 0 ? 'active' : ''}" data-url="${e.url}">
            ${e.name}
          </button>
        `).join('')}
      </div>
      <div class="search-input-container">
        <input id="searchInput" type="text" placeholder="搜索..." />
        <button class="search-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.insertBefore(searchBox, document.getElementById('grid'));

  // 事件绑定
  const engineBtns = searchBox.querySelectorAll('.engine-btn');
  const input = searchBox.querySelector('#searchInput') as HTMLInputElement;
  const searchBtn = searchBox.querySelector('.search-btn') as HTMLButtonElement;
  
  engineBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 移除所有按钮的active类
      engineBtns.forEach(b => b.classList.remove('active'));
      // 为当前按钮添加active类
      btn.classList.add('active');
      // 更新当前搜索引擎
      currentEngine = engines.find(e => e.url === btn.getAttribute('data-url'))!;
    });
  });
  
  // 搜索按钮点击事件
  searchBtn.addEventListener('click', () => {
    if (input.value.trim()) {
      window.open(currentEngine.url + encodeURIComponent(input.value.trim()), '_blank');
      input.value = '';
    }
  });
  
  // 输入框回车事件
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
    // 优先显示上传的图标，其次是在线图标
    const iconSrc = l.uploadIcon || l.icon
    card.innerHTML = `<img src="${iconSrc}" onerror="this.src='https://api.iconify.design/mdi:web.svg'"/><div>${l.name}</div>`
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
  
  // 更新按钮图标
  themeBtn.innerHTML = dark ? '🌙' : '☀️'
}
(() => {
  const t = localStorage.getItem('theme')
  if (t) {
    document.documentElement.setAttribute('data-theme', t)
    // 设置初始图标
    themeBtn.innerHTML = t === 'dark' ? '🌙' : '☀️'
  } else {
    // 默认显示太阳图标
    themeBtn.innerHTML = '☀️'
  }
})()
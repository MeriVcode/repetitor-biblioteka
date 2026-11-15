(() => {
  'use strict';
  const SECTIONS = [
    {id:'math',name:'Математика',image:'assets/cat-math.webp'},
    {id:'russian',name:'Русский язык',image:'assets/cat-russian.webp'},
    {id:'reading',name:'Чтение',image:'assets/cat-reading.webp'},
    {id:'boards',name:'Онлайн-доски',image:'assets/cat-boards.webp'},
    {id:'constructors',name:'Конструкторы',image:'assets/cat-constructors.webp'},
    {id:'diagnostics',name:'Диагностика',image:'assets/cat-diagnostics.webp'},
    {id:'world',name:'Окружающий мир',image:'assets/cat-reading.webp'}
  ];
  const byId = id => document.getElementById(id);
  const allowedLink = url => typeof url === 'string' && (/^https?:\/\/[^\s]+/i.test(url) || /^(?!\/|\.|#)[\w\-\u0400-\u04ff/%.]+\.(html?|pdf)(\?[^\s]*)?$/i.test(url)) && !/example\.(org|com|net)/i.test(url);
  const IN_DRAFT = new URLSearchParams(location.search).get('draft') === '1';
  const CACHE_KEY = 'repetitor-autocards-v3';
  let cachedCards = {};
  if (!IN_DRAFT) {
    try { cachedCards = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch {}
  }
  let items = Array.isArray(window.LIBRARY_ITEMS) ? window.LIBRARY_ITEMS.slice() : [];
  function normalizedPath(url) {
    try { return decodeURIComponent(new URL(url,location.href).pathname).toLowerCase(); }
    catch { return String(url || '').toLowerCase(); }
  }
  if (!IN_DRAFT) {
    const staticUrls = new Set(items.map(i => normalizedPath(i.url)));
    for (const cached of Object.values(cachedCards)) {
      if (cached && cached.item && !staticUrls.has(normalizedPath(cached.item.url))) items.push(cached.item);
    }
  }
  if(IN_DRAFT){
    try {const d=JSON.parse(localStorage.getItem('library-admin-draft')||'null');if(Array.isArray(d))items=d;}catch{}
  }
  items = items.filter(i=>i && i.title && allowedLink(i.url));
  const filters={section:'all',grade:'all',subject:'all',type:'all',search:''};
  const els={categories:byId('category-grid'),cards:byId('cards'),count:byId('results-count'),empty:byId('empty-state'),section:byId('section-filter'),grade:byId('grade-filter'),subject:byId('subject-filter'),type:byId('type-filter'),search:byId('search'),sort:byId('sort')};
  function node(tag, cls, value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;}
  function opt(value,text){const e=node('option','',text);e.value=value;return e;}
  function gradeText(grades){const x=(grades||[]).map(Number).sort();return x.length?`${x.join(', ')} кл.`:'1–4 кл.';}
  function distinct(field){return [...new Set(items.map(i=>i[field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));}
  function initFilters(){els.section.append(opt('all','Все разделы'));SECTIONS.forEach(s=>els.section.append(opt(s.id,s.name)));els.subject.append(opt('all','Все предметы')); distinct('subject').forEach(s=>els.subject.append(opt(s,s)));els.type.append(opt('all','Все типы')); distinct('type').forEach(t=>els.type.append(opt(t,t)));}
  function renderCategories(){els.categories.replaceChildren();for(const s of SECTIONS){const n=items.filter(i=>i.section===s.id).length;const a=node('a','category-tile'+(filters.section===s.id?' is-active':''));a.href='#catalog';a.dataset.section=s.id;const visual=node('div','category-picture');const im=document.createElement('img');im.src=s.image;im.alt='';im.loading='lazy';visual.append(im);a.append(visual,node('div','category-title',s.name),node('div','category-count',n?`${n} ${plural(n,'материал','материала','материалов')}`:'Полка пополняется'));a.addEventListener('click',()=>{filters.section=s.id;els.section.value=s.id;render();});els.categories.append(a);}}
  function plural(n,a,b,c){return n%10===1 && n%100!==11?a:([2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?b:c);}
  function matches(i){const hay=[i.title,i.subject,i.description,i.type,gradeText(i.grades)].join(' ').toLowerCase();return (filters.section==='all'||i.section===filters.section)&&(filters.grade==='all'||(i.grades||[]).map(String).includes(filters.grade))&&(filters.subject==='all'||i.subject===filters.subject)&&(filters.type==='all'||i.type===filters.type)&&(!filters.search||hay.includes(filters.search));}
  function render(){renderCategories();const selected=items.filter(matches);if(els.sort.value==='az')selected.sort((a,b)=>a.title.localeCompare(b.title,'ru'));else if(els.sort.value==='grade')selected.sort((a,b)=>(Math.min(...(a.grades||[5]))-Math.min(...(b.grades||[5])))||a.title.localeCompare(b.title,'ru'));else selected.sort((a,b)=>(b.published||'').localeCompare(a.published||'')||a.title.localeCompare(b.title,'ru'));els.cards.replaceChildren();selected.forEach((i,index)=>els.cards.append(createCard(i,index)));els.count.textContent=`Найдено: ${selected.length} ${plural(selected.length,'материал','материала','материалов')}`;els.empty.hidden=selected.length>0;}
  function createCard(i,index=0){const card=node('article','material-card');const visual=node('div','material-picture');const pic=document.createElement('img');pic.src=i.image||SECTIONS.find(s=>s.id===i.section)?.image||'assets/cat-reading.webp';pic.alt=`Обложка материала «${i.title}»`;pic.loading=index<4?'eager':'lazy';pic.onerror=()=>{pic.onerror=null;pic.src=SECTIONS.find(s=>s.id===i.section)?.image||'assets/cat-reading.webp';};visual.append(pic,node('span','material-type',i.type||'Материал'));const body=node('div','material-body');body.append(node('div','material-overline',SECTIONS.find(s=>s.id===i.section)?.name||'Материал'));body.append(node('h3','',i.title));const tags=node('div','material-tags');tags.append(node('span','',gradeText(i.grades)),node('span','',i.subject||'Для урока'));body.append(tags,node('p','material-description',i.description||''));const row=node('div','card-bottom');row.append(node('small','',i.time||'Для онлайн-занятия'));const a=node('a','open-material','Открыть ↗');a.href=i.url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`Открыть материал ${i.title} в новой вкладке`);row.append(a);body.append(row);card.append(visual,body);return card;}
  // Read real metadata from every uploaded HTML; do not infer the subject from its filename alone.
  function metadata(doc, key) { return doc.querySelector('meta[name="' + key + '"]')?.getAttribute('content')?.trim() || ''; }
  function subjectFrom(text) {
    text = String(text || '').toLowerCase();
    if (/математик|арифметик|таблиц[ауы] умножения|сч[её]т/.test(text)) return 'Математика';
    if (/русск|орфограф|грамматик|части речи/.test(text)) return 'Русский язык';
    if (/окружающ|природ|растени|животн/.test(text)) return 'Окружающий мир';
    if (/чтени|литератур|пересказ|текст/.test(text)) return 'Чтение';
    if (/межпредмет|разные предметы|несколько предметов/.test(text)) return 'Межпредметное';
    return 'Разные предметы';
  }
  function sectionFrom(kind, subject) {
    if (/конструктор/i.test(kind)) return 'constructors';
    if (/доск/i.test(kind)) return 'boards';
    if (/диагност|экспресс|проверк|тест/i.test(kind)) return 'diagnostics';
    return ({'Математика':'math','Русский язык':'russian','Чтение':'reading',
             'Окружающий мир':'world','Смысловое чтение':'reading'})[subject] || 'other';
  }
  function typeFrom(kind) {
    if (/конструктор/i.test(kind)) return 'Конструктор';
    if (/доск/i.test(kind)) return 'Онлайн-доска';
    if (/лист/i.test(kind)) return 'Интерактивный лист';
    if (/тренаж[её]р/i.test(kind)) return 'Тренажёр';
    if (/диагност|экспресс|проверк|тест/i.test(kind)) return 'Диагностика';
    return 'HTML-игра';
  }
  function materialGrades(text) {
    const m=String(text||'').match(/\b([1-4])\s*[–—-]\s*([1-4])\s*(?:класс|кл)/i);
    if(m) return Array.from({length:Math.abs(+m[2]-(+m[1]))+1},(_,i)=>+m[1]+i);
    const n=String(text||'').match(/\b([1-4])\s*(?:класс|кл)/i);
    return n?[+n[1]]:[1,2,3,4];
  }
  function sectionFallback() {
    if(items.some(i=>i.section==='other') && !SECTIONS.some(s=>s.id==='other'))
      SECTIONS.push({id:'other',name:'Другие материалы',image:'assets/cat-reading.webp'});
  }
  function refreshFiltersAndRender() {
    sectionFallback();
    const oldSection=els.section.value;
    els.section.replaceChildren(opt('all','Все разделы'));
    SECTIONS.forEach(s=>els.section.append(opt(s.id,s.name)));
    els.section.value=SECTIONS.some(s=>s.id===oldSection)?oldSection:'all';
    filters.section=els.section.value;
    for (const [select,key] of [[els.subject,'subject'],[els.type,'type']]) {
      const old=select.value;
      select.replaceChildren(opt('all',key==='subject'?'Все предметы':'Все типы'));
      distinct(key).forEach(v=>select.append(opt(v,v)));
      select.value=distinct(key).includes(old)?old:'all';
      filters[key]=select.value;
    }
    render();
  }
  function normalizeImage(source,fileUrl) {
    if (!source) return '';
    if (/^data:image\/(png|webp|jpeg|gif);base64,/i.test(source)) return source;
    try {
      const u=new URL(source,new URL(fileUrl,location.href));
      if(u.origin===location.origin && /^https?:/.test(u.protocol)) return u.href;
    } catch {}
    return '';
  }
  async function fromFile(file) {
    // GitHub raw is matched to its *current* blob SHA. This avoids a common
    // GitHub Pages deployment race: new SHA plus the older Pages HTML.
    const url='materials/'+encodeURIComponent(file.name);
    const sha=encodeURIComponent(file.sha || Date.now());
    const raw=file.download_url && /^https:\/\/raw\.githubusercontent\.com\//.test(file.download_url)
      ?file.download_url+(file.download_url.includes('?')?'&':'?')+'v='+sha : '';
    let html='';
    for(const address of [raw,url+'?library_version='+sha]) {
      if(!address) continue;
      try {
        const response=await fetch(address,{cache:'no-store'});
        if(response.ok) {html=await response.text();break;}
      } catch(err) { console.warn('Материал ещё не прочитан:',file.name,err); }
    }
    if (!html) throw new Error('Не удалось прочитать '+file.name);
    const doc=new DOMParser().parseFromString(html,'text/html');
    const title=metadata(doc,'library-title') || doc.querySelector('.hero h1,header h1,main h1,h1')?.textContent?.trim()
      || doc.querySelector('title')?.textContent?.split(/[—|]/)[0]?.trim()
      || file.name.replace(/\.html?$/i,'').replaceAll('_',' ');
    const kind=metadata(doc,'library-kind') || doc.querySelector('.topline')?.textContent?.trim() || '';
    const subject=metadata(doc,'library-subject') || subjectFrom(kind+' '+title);
    const section=metadata(doc,'library-section') || sectionFrom(kind,subject);
    const grades=metadata(doc,'library-grades').split(/[,;\s]+/).map(Number).filter(x=>x>=1 && x<=4);
    const image=normalizeImage(metadata(doc,'library-image') || doc.querySelector('.hero img,header img,img')?.getAttribute('src'),url);
    return {id:'auto-'+file.name.replace(/[^a-zа-яё0-9]+/gi,'-').toLowerCase(),title,
      grades:grades.length?grades:materialGrades(kind+' '+title),subject,section,
      type:metadata(doc,'library-type') || typeFrom(kind),
      description:metadata(doc,'library-description') || metadata(doc,'description') || 'Интерактивное упражнение для онлайн-занятия.',
      image,url,time:metadata(doc,'library-time')||'5–10 минут',
      published:metadata(doc,'library-date')||new Date().toISOString().slice(0,10),featured:false};
  }
  async function discover() {
    // API lists all games. It is used for discovery, not for storing old card data.
    const api='https://api.github.com/repos/MeriVcode/repetitor-biblioteka/contents/materials?ref=main';
    try {
      const response=await fetch(api,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
      if (!response.ok) throw new Error('GitHub API: '+response.status);
      const files=(await response.json()).filter(f=>f.type==='file' && /\.html?$/i.test(f.name));
      const staticPaths=new Set((window.LIBRARY_ITEMS||[]).map(i=>normalizedPath(i.url)));
      const cards=[];const freshCache={};
      for(let i=0;i<files.length;i+=4) {
        const batch=await Promise.all(files.slice(i,i+4).map(async f=>{
          const existing=cachedCards[f.name];
          if(staticPaths.has(normalizedPath('materials/'+encodeURIComponent(f.name)))) return null;
          // Revalidate on each page load; don't keep old data forever based on SHA alone.
          try {
            const item=await fromFile(f);
            freshCache[f.name]={sha:f.sha,item};
            return item;
          }catch(err){
            console.warn('Не удалось обновить карточку '+f.name,err);
            if(existing && existing.item){freshCache[f.name]=existing;return existing.item;}
            return null;
          }
        }));
        cards.push(...batch.filter(Boolean));
      }
      cachedCards=freshCache;
      try{localStorage.setItem(CACHE_KEY,JSON.stringify(cachedCards));}catch{}
      const used=new Set();items=[];
      for(const item of [...(window.LIBRARY_ITEMS||[]),...cards]){
        if(item?.title && allowedLink(item.url) && !used.has(normalizedPath(item.url))) {
          used.add(normalizedPath(item.url));items.push(item);
        }
      }
      refreshFiltersAndRender();
    }catch(err){
      console.warn('Автоматическое обновление материалов пока недоступно:',err);
    }
  }
  function reset(){Object.assign(filters,{section:'all',grade:'all',subject:'all',type:'all',search:''});els.section.value='all';els.grade.value='all';els.subject.value='all';els.type.value='all';els.search.value='';render();}
  sectionFallback();initFilters();render();
  if(!IN_DRAFT && location.protocol !== 'file:') discover();
  [['section',els.section],['grade',els.grade],['subject',els.subject],['type',els.type]].forEach(([key,el])=>el.addEventListener('change',()=>{filters[key]=el.value;render();}));
  els.search.addEventListener('input',()=>{filters.search=els.search.value.toLowerCase().trim();render();});els.sort.addEventListener('change',render);byId('reset-filters').addEventListener('click',reset);byId('empty-reset').addEventListener('click',reset);
  const hashSection=decodeURIComponent(location.hash.slice(1)).match(/^section=(math|russian|reading|boards|constructors|diagnostics|world)$/);
  if(hashSection){filters.section=hashSection[1];els.section.value=filters.section;render();byId('catalog').scrollIntoView();}
})();
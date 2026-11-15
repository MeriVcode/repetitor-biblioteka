(() => {
  'use strict';
  const SECTIONS = [
    {id:'math',name:'Математика',image:'assets/cat-math.webp'},
    {id:'russian',name:'Русский язык',image:'assets/cat-russian.webp'},
    {id:'reading',name:'Чтение',image:'assets/cat-reading.webp'},
    {id:'boards',name:'Онлайн-доски',image:'assets/cat-boards.webp'},
    {id:'constructors',name:'Конструкторы',image:'assets/cat-constructors.webp'},
    {id:'diagnostics',name:'Диагностика',image:'assets/cat-diagnostics.webp'}
  ];
  const byId = id => document.getElementById(id);
  const allowedLink = url => typeof url === 'string' && (/^https?:\/\/[^\s]+/i.test(url) || /^(?!\/|\.|#)[\w\-\u0400-\u04ff/%.]+\.(html?|pdf)(\?[^\s]*)?$/i.test(url)) && !/example\.(org|com|net)/i.test(url);
  function normalisePath(url){try {const u=new URL(String(url||''),location.href);return decodeURIComponent(u.pathname).toLowerCase();}catch{return String(url||'').toLowerCase();}}
  let items = Array.isArray(window.LIBRARY_ITEMS) ? window.LIBRARY_ITEMS.slice() : [];
  // Previously discovered cards are cached in the current browser to avoid
  // re-downloading artwork-heavy HTML games on every visit.
  const CACHE_KEY='repetitor-autocards-v1';
  let autoCache={};
  try {
    const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}');
    if(cached && typeof cached==='object' && !Array.isArray(cached))autoCache=cached;
  } catch {}
  const inDraft=new URLSearchParams(location.search).get('draft')==='1';
  if(!inDraft){
    const staticUrls=new Set(items.map(i=>normalisePath(i.url)));
    for(const e of Object.values(autoCache)){
      if(e?.item && !staticUrls.has(normalisePath(e.item.url)))items.push(e.item);
    }
  }
  if(inDraft){
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
  function tagValue(doc,name){
    return doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim()||'';
  }
  function titleFromFilename(name){
    const t=name.replace(/\.html?$/i,'').replace(/^\d+[_-]*/, '').replace(/[_-]+/g,' ').trim();
    return t? t.charAt(0).toUpperCase()+t.slice(1):'Новый материал';
  }
  function getGrades(text){
    const m=text.match(/\b([1-4])\s*[–—-]\s*([1-4])\s*(?:класс|кл\.)/i);
    if(m){const a=+m[1],b=+m[2];if(a<=b)return Array.from({length:b-a+1},(_,i)=>a+i);}
    const single=text.match(/\b([1-4])\s*(?:класс|кл\.)/i);
    return single?[+single[1]]:[1,2,3,4];
  }
  function deriveSubject(info){
    const s=info.toLowerCase();
    if(/несколько предметов|межпредметн|разные предметы/.test(s))return 'Межпредметное';
    if(/окружающ|природоведен|естествознан/.test(s))return 'Окружающий мир';
    if(/математик|арифметик|счёт|счет/.test(s))return 'Математика';
    if(/русск|орфограф|грамматик/.test(s))return 'Русский язык';
    if(/чтени|литератур|текст|пересказ/.test(s))return 'Чтение';
    return 'Разные предметы';
  }
  function deriveSection(kind,subject){
    if(/конструктор/i.test(kind))return 'constructors';
    if(/доск/i.test(kind))return 'boards';
    if(/диагност|экспресс|проверк|тест/i.test(kind))return 'diagnostics';
    if(subject==='Математика')return 'math';
    if(subject==='Русский язык')return 'russian';
    if(subject==='Чтение')return 'reading';
    if(subject==='Окружающий мир')return 'diagnostics'; // Shelf for this subject not created yet.
    return 'other';
  }
  function deriveType(kind){
    if(/конструктор/i.test(kind))return 'Конструктор';
    if(/доск/i.test(kind))return 'Онлайн-доска';
    if(/рабочий лист/i.test(kind))return 'Интерактивный лист';
    if(/тренаж[её]р/i.test(kind))return 'Тренажёр';
    if(/диагност|экспресс|проверк|тест/i.test(kind))return 'Диагностика';
    return 'HTML-игра';
  }
  function normaliseImage(img,materialUrl){
    if(!img)return '';
    if(/^data:image\/(?:png|webp|jpeg|gif);base64,/i.test(img))return img;
    try {
      const url=new URL(img,new URL(materialUrl,location.href));
      if((url.protocol==='https:'||url.protocol==='http:') && url.origin===location.origin)return url.href;
    } catch {}
    return '';
  }
  async function materialCardFromHTML(file){
    const path='materials/'+encodeURIComponent(file.name);
    const r=await fetch(path,{cache:'no-cache'});
    if(!r.ok)throw new Error(`Не удалось прочитать ${file.name}: ${r.status}`);
    const doc=new DOMParser().parseFromString(await r.text(),'text/html');
    const heading=doc.querySelector('.hero h1,header h1,main h1,h1');
    const kind=tagValue(doc,'library-kind')||doc.querySelector('.topline')?.textContent?.trim()||'';
    const title=tagValue(doc,'library-title')||heading?.textContent?.trim()||
      doc.querySelector('title')?.textContent?.split(/[—|]/)[0]?.trim()||titleFromFilename(file.name);
    const desc=tagValue(doc,'library-description')||
      doc.querySelector('.hero-copy small,.hero small,header p')?.textContent?.trim()||
      tagValue(doc,'description')||'Интерактивный материал для онлайн-занятия.';
    const subject=tagValue(doc,'library-subject')||deriveSubject(kind+' '+title);
    const section=tagValue(doc,'library-section')||deriveSection(kind,subject);
    const type=tagValue(doc,'library-type')||deriveType(kind);
    const grades=tagValue(doc,'library-grades')
      .split(/[,;\s]+/).map(Number).filter(x=>x>=1&&x<=4);
    const gradeResult=grades.length?grades:getGrades(kind+' '+title);
    const image=normaliseImage(doc.querySelector('.hero img, header img, img')?.getAttribute('src')||'',path);
    const time=tagValue(doc,'library-time')||(/диагност|экспресс/i.test(kind)?'3–5 минут':'5–10 минут');
    return {id:'auto-'+file.name.replace(/[^a-zа-яё0-9]+/gi,'-').toLowerCase(),title,
      grades:gradeResult,subject,section,type,description:desc,image,url:path,time,
      published:tagValue(doc,'library-date')||new Date().toISOString().slice(0,10),featured:false};
  }
  function saveAutoCache(){
    try {localStorage.setItem(CACHE_KEY,JSON.stringify(autoCache));} catch {} // No effect on public website.
  }
  function refreshSelect(select,values){
    const previous=select.value;
    while(select.options.length>1)select.remove(1);
    values.forEach(v=>select.append(opt(v,v)));
    select.value=values.includes(previous)?previous:'all';
  }
  function refreshAfterDiscovery(){
    if(items.some(i=>i.section==='other')&&!SECTIONS.some(s=>s.id==='other'))
      SECTIONS.push({id:'other',name:'Другие материалы',image:'assets/cat-reading.webp'});
    const prev=els.section.value;
    els.section.replaceChildren(opt('all','Все разделы'));
    SECTIONS.forEach(s=>els.section.append(opt(s.id,s.name)));
    els.section.value=SECTIONS.some(s=>s.id===prev)?prev:'all';
    refreshSelect(els.subject,distinct('subject'));
    refreshSelect(els.type,distinct('type'));
    render();
  }
  async function discoverNewMaterials(){
    const api='https://api.github.com/repos/MeriVcode/repetitor-biblioteka/contents/materials?ref=main';
    try {
      const response=await fetch(api,{headers:{'Accept':'application/vnd.github+json'},cache:'no-store'});
      if(!response.ok)throw new Error('GitHub API returned '+response.status);
      const files=(await response.json()).filter(f=>f.type==='file'&&/\.html?$/i.test(f.name));
      const present=new Set(files.map(f=>f.name));
      for(const name of Object.keys(autoCache))if(!present.has(name))delete autoCache[name];
      const staticPaths=new Set((window.LIBRARY_ITEMS||[]).map(i=>normalisePath(i.url)));
      let added=0;
      // Only download newly uploaded or changed HTML, up to four files concurrently.
      const newFiles=files.filter(f=>!staticPaths.has(normalisePath('materials/'+encodeURIComponent(f.name))));
      const cards=[];
      for(let start=0;start<newFiles.length;start+=4){
        const batch=await Promise.all(newFiles.slice(start,start+4).map(async file=>{
          const cached=autoCache[file.name];
          if(cached?.sha===file.sha && cached.item)return cached.item;
          try {
            const item=await materialCardFromHTML(file);
            autoCache[file.name]={sha:file.sha,item};
            return item;
          } catch(err){
            console.warn('Не удалось прочитать материал',file.name,err);
            return cached?.item||null;
          }
        }));
        cards.push(...batch.filter(Boolean));
      }
      const allPaths=new Set();
      const result=[];
      for(const item of [...(window.LIBRARY_ITEMS||[]),...cards]){
        const path=normalisePath(item.url);
        if(item.title&&allowedLink(item.url)&&!allPaths.has(path)){
          result.push(item);allPaths.add(path);
        }
      }
      // Preserve editor preview: this method isn't used in draft mode.
      added=result.length-items.length;
      items=result;
      saveAutoCache();
      refreshAfterDiscovery();
      if(added>0)console.info(`Библиотека: автоматически добавлено ${added} материалов.`);
    } catch(err){
      // Never break the existing public library when GitHub API is unavailable.
      console.warn('Автоматическое обновление новых материалов временно недоступно:',err);
    }
  }
  function reset(){Object.assign(filters,{section:'all',grade:'all',subject:'all',type:'all',search:''});els.section.value='all';els.grade.value='all';els.subject.value='all';els.type.value='all';els.search.value='';render();}
  initFilters();render();
  // Automatically discover publicly uploaded HTML files under /materials/.
  // Existing catalog cards take precedence, so they are never duplicated.
  if(!inDraft)discoverNewMaterials();
  [['section',els.section],['grade',els.grade],['subject',els.subject],['type',els.type]].forEach(([key,el])=>el.addEventListener('change',()=>{filters[key]=el.value;render();}));
  els.search.addEventListener('input',()=>{filters.search=els.search.value.toLowerCase().trim();render();});els.sort.addEventListener('change',render);byId('reset-filters').addEventListener('click',reset);byId('empty-reset').addEventListener('click',reset);
  const hashSection=decodeURIComponent(location.hash.slice(1)).match(/^section=(math|russian|reading|boards|constructors|diagnostics)$/);
  if(hashSection){filters.section=hashSection[1];els.section.value=filters.section;render();byId('catalog').scrollIntoView();}
})();

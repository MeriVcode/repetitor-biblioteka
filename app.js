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
  let items = Array.isArray(window.LIBRARY_ITEMS) ? window.LIBRARY_ITEMS.slice() : [];
  if(new URLSearchParams(location.search).get('draft') === '1'){
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
  function reset(){Object.assign(filters,{section:'all',grade:'all',subject:'all',type:'all',search:''});els.section.value='all';els.grade.value='all';els.subject.value='all';els.type.value='all';els.search.value='';render();}
  initFilters();render();
  [['section',els.section],['grade',els.grade],['subject',els.subject],['type',els.type]].forEach(([key,el])=>el.addEventListener('change',()=>{filters[key]=el.value;render();}));
  els.search.addEventListener('input',()=>{filters.search=els.search.value.toLowerCase().trim();render();});els.sort.addEventListener('change',render);byId('reset-filters').addEventListener('click',reset);byId('empty-reset').addEventListener('click',reset);
  const hashSection=decodeURIComponent(location.hash.slice(1)).match(/^section=(math|russian|reading|boards|constructors|diagnostics)$/);
  if(hashSection){filters.section=hashSection[1];els.section.value=filters.section;render();byId('catalog').scrollIntoView();}
})();

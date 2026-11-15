(() => {
  'use strict';
  const STORAGE='library-admin-draft';
  const original=JSON.parse(JSON.stringify(window.LIBRARY_ITEMS||[]));
  const $=id=>document.getElementById(id);
  let items;
  try {items=JSON.parse(localStorage.getItem(STORAGE));if(!Array.isArray(items))items=original;}catch{items=original;}
  let current=items[0]?.id||null;
  let selectedImage='';
  const ids=['title','section','subject','type','time','description','url','image'];
  const notify=msg=>{let t=$('toast');if(t)t.remove();t=document.createElement('div');t.id='toast';t.className='toast';t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),3500);};
  const saveDraft=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(items));$('saved-label').textContent='Черновик сохранён на этом устройстве';}catch{$('saved-label').textContent='Не удалось сохранить черновик: возможно, изображение слишком большое';}};
  function setImage(src){selectedImage=src||'';$('image').value=selectedImage;$('image-preview').src=selectedImage||'assets/cat-reading.webp';$('image-preview').onerror=()=>{$('image-preview').onerror=null;$('image-preview').src='assets/cat-reading.webp';};}
  function fill(item){for(const id of ids)if(id!=='image')$(id).value=item?.[id]||({'section':'boards','subject':'Русский язык','type':'Онлайн-доска'}[id]||'');setImage(item?.image||'');document.querySelectorAll('input[name=grade]').forEach(c=>c.checked=!!item?.grades?.map(Number).includes(Number(c.value)));$('delete').disabled=!item;$('form-heading').textContent=item?'Редактировать карточку':'Новая карточка';}
  function list(){const box=$('item-list');box.replaceChildren();$('item-count').textContent=`(${items.length})`;items.forEach(i=>{const b=document.createElement('button');b.type='button';b.className='editor-row'+(current===i.id?' is-selected':'');const sp=document.createElement('span');sp.textContent=i.title;const g=document.createElement('small');g.textContent=(i.grades||[]).join(', ')+' кл.';b.append(sp,g);b.addEventListener('click',()=>{current=i.id;fill(i);list();});box.append(b);});}
  function resetForm(){current=null;fill(null);document.querySelectorAll('input[name=grade]').forEach(c=>c.checked=false);list();$('title').focus();}
  function validateUrl(url){return /^(https?:\/\/[^\s]+|(?:\.?\/?[\w\-\u0400-\u04ff/%\.]+\.(?:html?|pdf)))(?:\?[^\s]*)?$/i.test(url) && !/example\.(com|org|net)/i.test(url) && !/javascript:/i.test(url) && !url.startsWith('//');}
  const escapeBlob=(name,content,type)=>{const link=document.createElement('a');const blob=new Blob([content],{type});const u=URL.createObjectURL(blob);link.href=u;link.download=name;document.body.append(link);link.click();setTimeout(()=>{URL.revokeObjectURL(u);link.remove();},3000);};
  $('create').addEventListener('click',resetForm);
  $('material-form').addEventListener('submit',e=>{
    e.preventDefault();
    const record={};for(const id of ids)record[id]=$(id).value.trim();
    record.grades=[...document.querySelectorAll('input[name=grade]:checked')].map(i=>Number(i.value));
    if(!record.title||!record.description||!record.subject||!record.type||record.grades.length===0){notify('Заполните название, описание, предмет, тип и класс.');return;}
    if(!validateUrl(record.url)){notify('Укажите действительную ссылку https://... или путь к опубликованному HTML/PDF-файлу.');return;}
    record.image=selectedImage;
    const old=items.find(i=>i.id===current);
    record.id=old?.id||'material-'+Date.now();record.published=old?.published||new Date().toISOString().slice(0,10);record.featured=old?.featured||false;
    const idx=items.findIndex(i=>i.id===record.id);if(idx>=0)items[idx]=record;else items.unshift(record);
    current=record.id;saveDraft();fill(record);list();notify('Карточка сохранена в черновике. Для публикации скачайте каталог.');
  });
  $('delete').addEventListener('click',()=>{if(!current)return;const i=items.find(v=>v.id===current);if(!confirm(`Удалить карточку «${i.title}» из черновика?`))return;items=items.filter(v=>v.id!==current);saveDraft();current=items[0]?.id||null;fill(items[0]||null);list();notify('Карточка удалена из черновика.');});
  $('reset').addEventListener('click',()=>{if(!confirm('Отменить ВСЕ изменения и вернуться к опубликованному каталогу?'))return;items=JSON.parse(JSON.stringify(original));localStorage.removeItem(STORAGE);current=items[0]?.id||null;fill(items[0]||null);list();notify('Загружен опубликованный каталог.');});
  $('download').addEventListener('click',()=>{const valid=items.filter(i=>i.title&&validateUrl(i.url));const code='/* Каталог библиотеки М. Братухиной. Отредактировано в редакторе. */\nwindow.LIBRARY_ITEMS = '+JSON.stringify(valid,null,2)+';\n';escapeBlob('catalog-data.js',code,'text/javascript;charset=utf-8');notify(`Файл каталога скачан (${valid.length} карточек). Загрузите его в GitHub.`);});
  $('image').addEventListener('change',()=>{selectedImage=$('image').value.trim();$('image-preview').src=selectedImage||'assets/cat-reading.webp';});
  $('image-upload').addEventListener('change',async e=>{
    const f=e.target.files[0];if(!f)return;
    if(!f.type.startsWith('image/')){notify('Нужен файл изображения JPG, PNG или WebP.');return;}
    if(f.size>12*1024*1024){notify('Выберите изображение меньше 12 МБ.');return;}
    try {
      const objectUrl=URL.createObjectURL(f);const im=new Image();
      await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=objectUrl;});
      const scale=Math.min(1,850/im.width);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.width*scale));canvas.height=Math.max(1,Math.round(im.height*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(im,0,0,canvas.width,canvas.height);URL.revokeObjectURL(objectUrl);
      setImage(canvas.toDataURL('image/webp',.78));notify('Обложка встроена в карточку.');
    } catch(error) {notify('Не удалось обработать изображение. Попробуйте JPG или PNG.');}
  });
  fill(items[0]||null);list();
})();

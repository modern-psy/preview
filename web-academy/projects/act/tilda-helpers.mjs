// Вспомогательные функции сборки. Готовые файлы tilda/ руками не править.
export const scope='.act-page[data-act-part]';

export function cssBlocks(css) {
  const blocks=[];
  let start=0,depth=0,quote='',escaped=false;
  for(let i=0;i<css.length;i++){
    const c=css[i];
    if(escaped){escaped=false;continue;}
    if(c==='\\'){escaped=true;continue;}
    if(quote){if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0){blocks.push(css.slice(start,i+1).trim());start=i+1;}
  }
  if(depth||css.slice(start).trim())throw new Error('Незавершённый CSS-блок');
  return blocks;
}

function selectors(value) {
  const result=[];
  let start=0,depth=0,quote='';
  for(let i=0;i<value.length;i++){
    const c=value[i];
    if(quote){if(c===quote&&value[i-1]!=='\\')quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='('||c==='[')depth++;
    if(c===')'||c===']')depth--;
    if(c===','&&!depth){result.push(value.slice(start,i));start=i+1;}
  }
  result.push(value.slice(start));
  return result.map(s=>s.trim());
}

export function scopedCss(css) {
  return cssBlocks(css).map(block=>{
    const pos=block.indexOf('{'),selector=block.slice(0,pos).trim(),body=block.slice(pos+1,-1);
    if(/^@(media|supports|container|layer)\b/.test(selector))return `${selector}{${scopedCss(body)}}`;
    if(selector.startsWith('@'))return block;
    return selectors(selector).map(s=>{
      if(s===':root'||s==='body'||s.startsWith('body:has('))return scope;
      // Rem ниже 375px зависит именно от html. Исключение ограничено присутствием ACT.
      if(s==='html')return `html:has(${scope})`;
      // Меню страны монтируется библиотекой непосредственно в body, вне секционного wrapper.
      if(s.startsWith('body > .iti--detached-country-selector'))return s.replace('body >',`body:has(${scope}) >`);
      if(s==='[data-academy-native-form-record]')return 'body:has('+scope+') [data-act-native-form-record]';
      if(s.startsWith('.act-page'))return s.replace('.act-page',scope);
      return `${scope} ${s}`;
    }).join(',')+'{'+body.trim()+'}';
  }).join('\n');
}

export function prettyHtml(html) {
  let depth=0;
  const lines=[];
  for(const token of html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g)||[]){
    const value=token.trim();
    if(!value)continue;
    if(/^<\//.test(value))depth=Math.max(0,depth-1);
    lines.push('  '.repeat(depth)+value);
    if(/^<[a-z]/i.test(value)&&!/^<(img|input|link|meta|br|hr|source|wbr)\b/i.test(value)&&!value.endsWith('/>'))depth++;
  }
  return lines.join('\n');
}

export function replaceOnce(source,from,to,label) {
  if(source.split(from).length!==2)throw new Error(`Изменился контракт ${label}`);
  return source.replace(from,to);
}

export function productionFormScript(source,contract) {
  // UI и lifecycle остаются общей библиотекой. Адаптер ACT знает новый штатный MAX.
  // Поиск MAX в общей форме бывает в двух видах: старый ищет только "max",
  // новый — "max" или "max_messenger". Значение из контракта ACT ставим первым в обоих случаях.
  const maxLookups=[
    'radios.find((radio) => radio.value === "max" || radio.value === "max_messenger") ||',
    'radios.find((radio) => radio.value === "max") ||',
  ];
  const maxLookup=maxLookups.find(line=>source.includes(line))||maxLookups[0];
  let code=replaceOnce(source,
    maxLookup,
    `radios.find((radio) => radio.value === ${JSON.stringify(contract.nativeForm.maxValue)}) ||\n      ${maxLookup}`,
    'MAX нативной формы');
  code=replaceOnce(code,'record.setAttribute("data-academy-native-form-record", "");','record.setAttribute("data-academy-native-form-record", "");\n    record.setAttribute("data-act-native-form-record", "");','скрытия нативного блока');
  const start=code.indexOf('  const findTildaForm = (formName) =>');
  const end=code.indexOf('  const hideTildaFormRecord',start);
  if(start<0||end<0)throw new Error('Изменился контракт поиска нативной формы');
  code=code.slice(0,start)+`  const findTildaForm = formName => {
    if(!formName)return null;
    const matches=[...document.querySelectorAll('form.t-form')].filter(form=>form.querySelector('input[name="tildaspec-formname"]')?.value===formName);
    return matches.length===1?matches[0]:null;
  };
\n`+code.slice(end);
  code=replaceOnce(code,
    '!(messengerGroup instanceof HTMLElement)\n    )',
    `!(messengerGroup instanceof HTMLElement) ||\n      !nativeForm.querySelector('[type="submit"]') ||\n      !messengerGroup?.querySelector('input[name="messenger-type"][value="${contract.nativeForm.maxValue}"]') ||\n      !messengerGroup?.querySelector('input[name="messenger-type"][value="${contract.nativeForm.telegramValue}"]')\n    )`,
    'проверки обязательных полей перед отправкой');
  return code;
}

export function productionCourseScript(source) {
  const local=source.indexOf('  // Общая форма проверяет поля;');
  if(local<0)throw new Error('Изменился контракт локального адаптера ACT');
  // В production нет локального диалога и обработчика, который имитирует отправку.
  return (source.slice(0,local)+'  }\n})();\n')
    .replace("  const dialog=document.querySelector('#act-trial-dialog');\n  let opener;\n",'')
    .replace("    const open=event.target.closest('[data-open-trial]');\n    if(open){opener=open;dialog.showModal();return;}\n",'')
    .replace('// Поведение секций ACT. Обычный локальный просмотр не отправляет заявки.','// Преподаватели, видео и отзывы ACT во всех отдельных T123.');
}

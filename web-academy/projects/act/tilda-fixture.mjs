// Только локальный стенд. Этот HTML и имитатор событий не входят в production-фрагменты.
export function nativeFixture(contract) {
  const phone=(name,disabled=false)=>`<div class="t-phonemask-input-group"><input class="js-phonemask-result-iso" name="tildaspec-phone-part[]-iso" type="hidden" value="ru" ${disabled?'disabled':''}><input class="t-input-phonemask" name="tildaspec-phone-part[]" type="tel" data-phonemask-code="+7" data-phonemask-iso="ru" ${disabled?'disabled':''}><input class="js-phonemask-result" name="${name}" type="hidden" ${disabled?'disabled':''}></div>`;
  return `<style>.act-fixture_bar{padding:1rem;background:#fff;font:1rem Arial,sans-serif}.act-fixture_bar button{min-height:2.75rem;margin:0.25rem;cursor:pointer}.act-fixture_free-dialog{max-width:30rem;padding:2rem;font:1rem Arial,sans-serif}.act-fixture_notice{font:0.875rem Arial,sans-serif;margin:0.5rem 1rem}</style>
  <aside class="act-fixture_bar" aria-label="Локальный стенд">Только локальная проверка. Заявки не отправляются.
    <button type="button" data-fixture-event="success">Подтвердить успех на стенде</button>
    <button type="button" data-fixture-event="error">Вернуть ошибку на стенде</button>
    <button type="button" data-fixture-event="unrelated">Чужой успех на стенде</button>
    <p role="status" data-fixture-status>Ожидание проверки</p>
  </aside>
  <div class="t-rec" id="act-fixture-native"><form class="t-form" id="act-fixture-native-form" novalidate>
    <input type="hidden" name="tildaspec-formname" value="${contract.nativeMarker}">
    <div class="t-input-group t-input-group_nm"><input name="Name" data-tilda-rule="name" type="text"></div>
    <div class="t-input-group t-input-group_em"><input name="Email" data-tilda-rule="email" type="email"></div>
    <div class="t-input-group t-input-group_ph">${phone('Phone')}</div>
    <div class="t-input-group t-input-group_contact_method">
      <input type="radio" name="messenger-type" value="telegram" checked>
      <input type="radio" name="messenger-type" value="max_messenger">
      <div data-fixture-branch="telegram"><input name="messenger-id" type="text"></div>
      <div data-fixture-branch="max_messenger">${phone('messenger-id',true)}</div>
    </div><button type="submit">Нативная отправка стенда</button>
  </form></div>
  <div class="t-rec" id="act-fixture-unrelated-record"><p class="act-fixture_notice">Контрольный чужой блок: bridge не должен его скрывать.</p><form class="t-form" id="act-fixture-unrelated-form" hidden><input name="tildaspec-formname" type="hidden" value="act-fixture-unrelated"></form></div>
  <dialog class="act-fixture_free-dialog" id="act-fixture-free-dialog"><h2>Попап бесплатных лекций</h2><p>В Тильде здесь откроется существующий #free-lessons-act. Стенд не выдаёт доступ и не отправляет заявку.</p><button type="button" data-fixture-close-popup>Закрыть</button></dialog>`;
}

export const fixtureRuntimeSource=String.raw`(() => {
  const form=document.querySelector('#act-fixture-native-form');
  const status=document.querySelector('[data-fixture-status]');
  const mode=new URL(location.href).searchParams.get('event')||'hold';
  let count=0;
  const nativeEvent=(kind,target=form)=>target.dispatchEvent(new CustomEvent('tildaform:after'+kind,{bubbles:true,detail:{form:target}}));
  window.t_form_phonemask__setValue=(group,value)=>{
    const digits=String(value).replace(/\D/g,'').slice(-10);
    const masked='('+digits.slice(0,3)+') '+digits.slice(3,6)+'-'+digits.slice(6,8)+'-'+digits.slice(8);
    group.querySelectorAll('input.t-input-phonemask').forEach(input=>{input.value=masked;input.dataset.phonemaskCurrent=masked;input.dataset.phonemaskCode='+7';input.dataset.phonemaskIso='ru';});
  };
  form.addEventListener('change',event=>{
    if(event.target.name!=='messenger-type')return;
    form.querySelectorAll('[data-fixture-branch]').forEach(branch=>branch.querySelectorAll('input').forEach(input=>input.disabled=branch.dataset.fixtureBranch!==event.target.value));
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();count++;form.dataset.submitCount=String(count);
    const custom=document.querySelector('[data-academy-lead-form]');
    const digits=value=>String(value).replace(/\D/g,'').slice(-10);
    const messenger=custom.querySelector('[name="messenger"]:checked').value;
    const active=messenger==='max'?'max_messenger':'telegram';
    const selected=form.querySelector('[name="messenger-type"]:checked').value;
    const contact=form.querySelector('[data-fixture-branch="'+active+'"] [name="messenger-id"]').value;
    const customContact=custom.querySelector('[name="'+(messenger==='max'?'maxContact':'telegramContact')+'"]').value;
    const checks={name:form.elements.Name.value===custom.elements.name.value.trim(),email:form.elements.Email.value===custom.elements.email.value.trim(),phone:digits(form.elements.Phone.value)===digits(custom.elements.phone.value),messenger:selected===active,contact:messenger==='max'?digits(contact)===digits(customContact):contact===customContact.trim(),inactiveEmpty:[...form.querySelectorAll('[data-fixture-branch]:not([data-fixture-branch="'+active+'"]) input')].every(input=>!input.value),unrelatedVisible:!document.querySelector('#act-fixture-unrelated-record').hidden};
    status.dataset.mapping=JSON.stringify(checks);
    status.textContent='Локальный native submit: '+count+'. Данные никуда не отправлены.';
    if(mode==='validation'){
      const error=document.createElement('div');error.className='js-error-control-box';form.append(error);return;
    }
    requestAnimationFrame(()=>{
      if(mode==='success')nativeEvent('success');
      if(mode==='error')nativeEvent('error');
      if(mode==='unrelated')nativeEvent('success',document.querySelector('#act-fixture-unrelated-form'));
      if(mode==='unscoped')document.dispatchEvent(new CustomEvent('tildaform:aftersuccess'));
    });
  });
  document.querySelectorAll('[data-fixture-event]').forEach(button=>button.addEventListener('click',()=>{
    const kind=button.dataset.fixtureEvent;
    nativeEvent(kind==='error'?'error':'success',kind==='unrelated'?document.querySelector('#act-fixture-unrelated-form'):form);
  }));
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-tilda-popup-link]')){event.preventDefault();document.querySelector('#act-fixture-free-dialog').showModal();}
    if(event.target.closest('[data-fixture-close-popup]'))document.querySelector('#act-fixture-free-dialog').close();
  });
  if(new URL(location.href).searchParams.has('missing-email'))form.querySelector('[name="Email"]').remove();
})();`;

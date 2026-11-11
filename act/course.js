// Поведение секций ACT. Обычный локальный просмотр не отправляет заявки.
(() => {
  const dialog=document.querySelector('#act-trial-dialog');
  let opener;
  for(const page of document.querySelectorAll('.act-course-page')){
  if(page.dataset.courseInitialized)continue;
  page.dataset.courseInitialized='true';
  page.addEventListener('click',event=>{
    const open=event.target.closest('[data-open-trial]');
    if(open){opener=open;dialog.showModal();return;}
    const tab=event.target.closest('[data-teacher-tab]');
    if(tab){
      const component=tab.closest('[data-teacher-tabs]');
      component.querySelectorAll('[data-teacher-tab]').forEach(button=>{const active=button===tab;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
      component.querySelectorAll('[role="tabpanel"]').forEach(panel=>panel.hidden=panel.id!==tab.getAttribute('aria-controls'));
      return;
    }
    const video=event.target.closest('[data-video-play]');
    if(video){
      const container=video.closest('[data-video]');
      const iframe=document.createElement('iframe');iframe.className='act-video_frame';
      iframe.src=`https://kinescope.io/embed/${container.dataset.video}?autoplay=1`;
      iframe.title=video.getAttribute('aria-label');iframe.allow='autoplay; fullscreen; picture-in-picture; encrypted-media';iframe.allowFullscreen=true;
      container.replaceChildren(iframe);return;
    }
    const control=event.target.closest('[data-reviews-prev],[data-reviews-next]');
    if(control){const track=page.querySelector('[data-review-track]');const card=track.querySelector('.act-reviews_card');track.scrollBy({left:(card.getBoundingClientRect().width+16)*(control.hasAttribute('data-reviews-next')?1:-1),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
  });
  page.addEventListener('keydown',event=>{
    const current=event.target.closest('[data-teacher-tab]');
    if(!current||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
    event.preventDefault();
    const buttons=[...current.closest('[data-teacher-tabs]').querySelectorAll('[data-teacher-tab]')];
    let index=buttons.indexOf(current);
    index=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+buttons.length)%buttons.length;
    buttons[index].click();buttons[index].focus();
  });
  // Общая форма проверяет поля; локально заменяем сообщение об отсутствии Тильды, не показывая успех.
  page.addEventListener('academy-lead-form:validated',event=>{
    const form=event.target.closest('[data-act-local-lead]');
    if(!form)return;
    queueMicrotask(()=>{
      const status=form.querySelector('[data-lead-status]');
      status.dataset.state='preview';
      status.textContent='Локальный предпросмотр: заявка не отправлена.';
    });
  });
  }
  dialog?.querySelector('[data-close-trial]').addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('close',()=>opener?.focus());
  dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.querySelectorAll('[data-local-form]').forEach(form=>{
    const phone=form.querySelector('[name="phone"]');
    if(typeof window.intlTelInput==='function')window.intlTelInput(phone,{initialCountry:'ru',countryNameLocale:'ru',countrySelectorMode:'AUTO',numberDisplayFormat:'INTERNATIONAL',placeholderNumberPolicy:'AGGRESSIVE',separateDialCode:true,formatAsYouType:true,strictMode:true,countryOrder:['ru','kz','by','uz'],loadUtils:()=>import('https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/utils.js')});
    phone.addEventListener('input',()=>phone.setCustomValidity(phone.value.replace(/\D/g,'').length>=10?'':'Введите телефон с кодом страны'));
    form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const status=form.querySelector('[data-form-status]');status.hidden=false;status.textContent='Локальный предпросмотр: заявка не отправлена.';});
  });
})();

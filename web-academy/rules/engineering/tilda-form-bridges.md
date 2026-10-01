# Мост кастомной формы к Tilda

Обязательный стандарт для лендингов, где видимая кастомная форма передаёт
данные в скрытую нативную форму Tilda. Нативная форма остаётся источником
истины для получателей, CRM, CAPTCHA и штатного success workflow; кастомная
форма отвечает за интерфейс, валидацию и точное зеркалирование данных.
Общие запреты на пересечение идентификаторов, секционную упаковку и выпускной
контроль определяет [tilda-delivery.md](tilda-delivery.md).

## Связь уровней

| Уровень | Владеет | Не владеет |
| --- | --- | --- |
| Видимый form component | labels, active fields, field errors, focus, disabled/busy/error/success UI | transport, CAPTCHA, receivers |
| Project `data/form-contract.json` | точные custom/native field names, mapping, consent, lifecycle и критерии проверки | DOM styling и generated fragments |
| Bridge JavaScript | discovery, validation handoff, mirroring, native submit и event correlation | прямой network request и CRM API |
| Нативная Tilda-форма | штатная validation, CAPTCHA, receivers, transport и CRM delivery | внешний UI кастомной формы |
| Tilda package builder | порядок HEAD/BODY/native form/footer и self-contained delivery | runtime-истина об успешной заявке |

Component catalog проекта ссылается на этот стандарт и на project JSON
contract. README и `STATE.md` не копируют перечень полей: они только маршрутизируют
к каноническому реестру.

## Порядок имплементации в Tilda

1. Создать или сохранить на целевой странице обычный form block Tilda и
   подключить к нему authoritative receivers/CRM.
2. Добавить marker `tildaspec-formname=<project-form-name>` и все native fields
   с точными `name`, type, required rules и masks из project contract.
3. Опубликовать черновую страницу и инспекцией DOM подтвердить реальный marker,
   input groups, result fields и native submit. Редакторские labels не являются
   доказательством runtime-структуры.
4. Вставить self-contained HEAD, затем BODY с видимой формой, оставить нативную
   форму ниже BODY и поместить footer JavaScript после неё. Если builder связывает
   HEAD и BODY через SVG/masks, переносить их только парой.
5. Скрыть только `.t-rec`, содержащий совпавшую нативную форму. Если Tilda
   добавляет block асинхронно, повторять discovery через ограниченный
   `MutationObserver` и освобождать observer при cleanup.
6. До submit выполнить полный contract preflight; затем синхронизировать controls,
   отправить `input`/`change`, вызвать `requestSubmit()` и ждать только matching
   native success/error lifecycle.
7. После публикации выполнить отдельные сценарии для всех conditional branches и
   подтвердить записи у конечного получателя.

Для нового проекта marker создаётся заново и принадлежит только этому проекту.
Project renderer получает его из `data/form-contract.json`; копирование marker
из примера, shared default и fallback на первую найденную `.t-form` запрещены.
Build test обязан сравнить generated `data-tilda-form-name` с JSON contract, а
опубликованный inspection — с фактическим hidden input `tildaspec-formname`.

## Нативный контракт

- Нативная форма должна находиться в DOM той же опубликованной страницы.
  Скрывать можно только содержащую её `.t-rec`; удалять форму или скрывать
  совпавшую кастомную форму запрещено.
- Находить служебную форму по документированному значению
  `tildaspec-formname`, а не по record ID или form ID: Tilda меняет ID при
  копировании и пересоздании блоков.
- Каждый проект документирует точные, чувствительные к регистру имена полей и
  допустимые значения вариантов. Настроенные получатели являются частью того
  же production-контракта.
- До отправки мост обязан проверить наличие самой формы, каждого обязательного
  input/group и нативного submit control. Отсутствующее поле — ошибка
  конфигурации Tilda; нельзя продолжать с неполным payload.
- Проверять опубликованный DOM, а не только подписи в редакторе. Визуально
  добавленное поле не считается частью контракта, пока в нативной форме нет
  input с ожидаемым `name` и правилом валидации.

## Синхронизация и отправка

- Заполнять нативные controls способом, совместимым с их input/change
  listeners. После синхронизации запускать `requestSubmit()` через нативный
  submit control, чтобы сохранить Tilda validation, CAPTCHA, receivers и
  success/error lifecycle.
- Перед записью активного контакта очищать все неактивные messenger/contact
  inputs. Скрытое старое значение не должно попадать в CRM вместе с новым.
- Для нативной телефонной маски синхронизировать и видимую часть, и result
  field. В result field сохранять полный формат, который ожидают Tilda rules и
  `data-tilda-rule-minlength`, например `+7 (999) 000-00-01`; короткий E.164
  нельзя считать эквивалентной заменой без опубликованной проверки.
- Любое project-specific преобразование — например использование штатного
  messenger slot для другого канала — явно фиксировать рядом с точным field
  contract и проверять в опубликованном DOM после каждого изменения блока.

## Состояния и события

- До отправки success view скрыт. После валидного submit кастомная форма
  переходит в busy/loading и остаётся там до события от той же нативной формы.
- Показывать «Заявка отправлена» разрешено только после matching
  `tildaform:aftersuccess`. Коррелировать событие с сохранённым экземпляром
  формы через event target/detail или подтверждённый jQuery argument; success
  другой формы на странице необходимо игнорировать.
- Таймер, окончание анимации, исчезновение spinner или сам факт вызова
  `requestSubmit()` не являются доказательством успеха.
- `tildaform:aftererror`, нативная validation error, отсутствующий контракт или
  исключение синхронизации возвращают форму из busy, сохраняют введённые
  значения и показывают понятную ошибку. Ошибку конфигурации до `requestSubmit()`
  отличать от отказа Tilda после отправки.
- Tilda CAPTCHA является нейтральным промежуточным состоянием. Пока открыты
  `tildaformcaptchabox`/`captchaIframeBox`, не показывать ни success, ни ложную
  сетевую ошибку; продолжать ждать штатное success/error event после прохождения
  CAPTCHA. Нерешённая CAPTCHA не считается завершённым тестом.
- На разных шаблонах Tilda событие может прийти как DOM/CustomEvent либо через
  jQuery с form argument. Handler нормализует обе сигнатуры, сравнивает экземпляр
  формы с сохранённым submitted form и освобождает оба listener при cleanup.

## Диагностика опубликованной формы

- Ошибка сразу после submit при пустых нативных values обычно означает, что
  мост не нашёл форму или обязательное поле. Сначала сравнить фактические
  `name`, input groups и hidden marker с documented contract.
- Busy без success/error при уже заполненных нативных values требует проверить
  CAPTCHA overlay до вывода о сетевом сбое.
- Нативная validation error после зеркалирования требует проверить полный
  формат phone result fields, minlength и пустоту неактивных contact inputs.
- Кастомный success без matching native success считается дефектом lifecycle,
  даже если визуально экран выглядит правильно.

## Зафиксированные failure modes

| Симптом | Причина | Обязательный guard |
| --- | --- | --- |
| Служебная форма не найдена после копирования страницы | Поиск по изменяемому record/form ID | Искать по точному `tildaspec-formname`; ID не входит в contract |
| Поле видно в редакторе, но bridge сообщает missing contract | Label не совпадает с runtime `name`, либо Tilda создала другой input group | Проверять опубликованный DOM и все required field names до submit |
| Кнопка зависла в loading | CAPTCHA открыта либо Tilda ещё не отдала success/error event | Считать CAPTCHA in-flight и не заменять event таймером |
| Success появился, но заявки нет в CRM | UI был переключён по таймеру, animation end или факту `requestSubmit()` | Success только по matching event; завершение — только после receiver confirmation |
| Tilda отклоняет корректный телефон | В result field записан короткий E.164, не соответствующий mask/minlength | Заполнять visible mask, result и ISO fields полным Tilda-форматом |
| В CRM пришли два messenger contact | Скрытое поле предыдущего варианта сохранило значение | Перед mapping очищать все contact/result/ISO fields неактивных веток |
| MAX отправляется как WhatsApp | Native contact-method block не имеет отдельного MAX slot | Документировать project mapping; выбрать штатный slot, активировать его штатным событием и только затем передать согласованное значение `max` |
| Success другой формы закрывает кастомную форму | Handler слушает document без корреляции | Сохранять submitted native form и игнорировать события другого экземпляра |
| Нативная validation показала `.js-error-control-box`, но custom UI остался busy | Bridge ждёт только network event | После `requestSubmit()` проверить synchronous native validation и вернуть управляемую ошибку |
| В production две видимые формы | Marker кастомной формы не совпал с опубликованным `tildaspec-formname`, либо discovery завершился до появления блока | Сверять точный marker в опубликованном DOM; искать повторно через ограниченный `MutationObserver`; выпускать страницу только после проверки скрытой записи |
| В production скрыта кастомная или чужая форма | Слишком широкий selector либо скрытие по позиции/record ID | Сначала найти точную `form.t-form` по marker, затем скрыть только `nativeForm.closest('.t-rec')`; не использовать глобальный CSS для `.t-form` или `.t-rec` |
| После Tilda editor reload появляются двойные отправки | Повторная инициализация накопила listeners/observers/plugins | Инициализация идемпотентна; перед запуском выполняется cleanup всех ресурсов |

## Release gate видимости формы

Перед публикацией недостаточно проверить локальный preview: в нём нет настоящего
нативного блока. На опубликованной странице необходимо подтвердить, что:

1. ровно одна `form.t-form` содержит marker из project contract;
2. ближайшая `.t-rec` этой формы имеет `hidden`, `aria-hidden="true"` и
   project marker скрытой записи, но сама форма остаётся в DOM;
3. кастомная форма находится вне скрытой записи и является единственной видимой
   формой этого сценария;
4. повторная инициализация Tilda не возвращает служебную запись на экран;
5. отправка проходит через тот же экземпляр нативной формы до matching
   success/error события и подтверждается у конечного получателя.

Любое изменение marker, native fields, mask, contact-method block или receivers
сбрасывает эту проверку: сначала повторная публикация, затем новый inspection и
end-to-end сценарии.

## End-to-end проверка

- Локальный fixture проверяет mapping и event lifecycle, но не заменяет smoke
  test опубликованного production URL. Тестовая служебная страница также не
  заменяет финальный URL лендинга.
- Перед внешней отправкой получить разрешение на конкретные тестовые данные.
  Отправить отдельную заявку для каждого варианта формы; использовать
  различимые тестовые контакты и не создавать лишние дубли.
- Для каждого сценария зафиксировать последовательность:
  1. success view скрыт, submit доступен только при валидных active fields;
  2. после submit все значения зеркально находятся в правильной нативной форме,
     неактивные контакты пусты, custom form остаётся в loading;
  3. при появлении CAPTCHA она проходится как часть Tilda workflow;
  4. matching native form получает штатный success, и только после этого
     появляется custom success view;
  5. тестовая заявка действительно видна в настроенной CRM или другом
     authoritative receiver.
- Класс `js-send-form-success` и открытый native successbox являются полезными
  supporting signals, но end-to-end результат считается подтверждённым только
  вместе с matching event и записью у конечного получателя.
- После добавления, удаления, переименования или перестановки нативного поля,
  изменения mask/contact type либо receivers заново опубликовать страницу и
  повторить preflight и все ветки end-to-end проверки.

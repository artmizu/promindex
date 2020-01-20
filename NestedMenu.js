import deepmerge from 'deepmerge';

/* 
  Логика для всплывающего меню с несколькими уровнями вложенности

  В качестве параметров можно передавать:
  selector - селектор оснвного элемента-родителя
  url - ссылка с данными из которых будет формироваться меню, пример структуры можно посмотреть в файле /data.json
  classes - объект с классами для основных элементов, структуру можно увидеть ниже
  mobileMaxWidth - на каком максимальном разрешении меню будет работать в мобильном режиме
*/

export default function NestedMenu({
  selector = '.bem-nested-menu',
  url,
  classes = {},
  mobileMaxWidth = 767,
} = {}) {
  let menu = document.querySelector(selector);
  if (!menu) return;

  let data, button, nestedListEl, activeNestedListEl, isActive, menuWrapper, listWrapper, title, close, back, blackout, defaultMenuTitle;
  let activated = false;
  downloadData();

  function downloadData() {
    fetch(url)
      .then(response => response.json())
      .then(json => {
        data = json;
        init();
      })
      .catch(e => console.error('Невозможно проинициализировать вложенное меню', e));
  }

  // Первоначальная инициализация при загрузке страницы: поиск элементов, присвоение стандартных значений 
  function init() {
    activeNestedListEl = [];
    isActive = false;
    classes = getClasses(classes);
    menuWrapper = menu.querySelector(`.${classes.menuWrapper.base}`);
    listWrapper = menu.querySelector(`.${classes.listWrapper.base}`);
    button = menu.querySelector(`.${classes.button.base}`);
    button.addEventListener('click', onButtonClick);

    blackout = document.querySelector(`.${classes.blackout.base}`);
    title = menu.querySelector(`.${classes.title.base}`);
    defaultMenuTitle = title.innerText;
    close = menu.querySelector(`.${classes.close.base}`);
    back = menu.querySelector(`.${classes.back.base}`);
    close.addEventListener('click', reset);
    back.addEventListener('click', backToPrevious);
  }

  // при клике на кнопку-активатор
  function onButtonClick(e) {
    // если активируем в первый раз - генерируем html
    if (!activated) {
      generateTemplate();
      nestedListEl = menu.querySelectorAll(`.${classes.el.nested} > .${classes.elTitle.base}`);
      activated = true;
    }

    if (isActive) {
      reset();
    } else {
      isActive = true;
      menu.classList.add(classes.menu.active);
      window.requestAnimationFrame(() => window.addEventListener('click', onWindowClick));
      window.addEventListener('resize', onResize);
      if (isMobile()) {
        toggleBlackout('on');
      } else {
        listWrapper.addEventListener('mousemove', onListWrapperHover);
      }
    }
  }

  function onNestedElClick(e) {
    e.preventDefault();
    enableEl(e.target.closest(`.${classes.el.base}`));
  }

  function onListWrapperHover(e) {
    let el = e.target.closest(`.${classes.el.base}`);
    if (el) enableEl(el);
  }

  function onWindowClick(e) {
    let isInsideMenu = e.target.closest(`.${classes.menuWrapper.base}`);
    let isListWrapper = e.target === listWrapper;
    if (!isInsideMenu || isListWrapper) {
      reset();
    }
  }

  function onResize() {
    if (isMobile()) {
      toggleBlackout('on');
      shiftListBy(activeNestedListEl.length);
      listWrapper.removeEventListener('mousemove', onListWrapperHover);
    } else {
      toggleBlackout('off');
      shiftListBy(0);
      listWrapper.addEventListener('mousemove', onListWrapperHover);
    }
  }

  // при активации элемента со вложенными пунктами
  function enableEl(el) {
    if (!el.classList.contains(classes.el.active) && el.classList.contains(classes.el.nested)) {
      activeNestedListEl.push(el);
      el.classList.add(classes.el.active);
      disableUnnecessaryEl(el);
      setTitle(el);
      back.classList.add(classes.back.active);
      if (isMobile()) shiftListBy(activeNestedListEl.length);
      log();
    } else if (!el.classList.contains(classes.el.nested)) {
      disableUnnecessaryEl(el);
      setTitle(activeNestedListEl[activeNestedListEl.length - 1]);
    }
  }

  function disableUnnecessaryEl(el) {
    let list = getAncestors(el);
    activeNestedListEl.forEach((active) => {
      if (!list.some(x => x === active)) {
        active.classList.remove(classes.el.active);
      }
    })
    activeNestedListEl = list;
    if (activeNestedListEl.length === 0) back.classList.remove(classes.back.active); 
  }

  // получаем все активные элементы выше по уровню от определенного элемента
  function getAncestors(el) {
    let arr = [];
    let current = el;
    while (current.parentNode !== menu) {
      if (current.classList.contains(classes.el.nested)) {
        arr.push(current);
      }
      current = current.parentNode;
    }
    return arr.reverse();
  }
  
  function setTitle(el) {
    let text = defaultMenuTitle;
    if (el) text = el.querySelector(`.${classes.elTitle.base}`).innerText;
    title.innerText = text;
  }

  function reset() {
    isActive = false;
    activeNestedListEl.forEach(el => el.classList.remove(classes.el.active));
    activeNestedListEl = [];
    menu.classList.remove(classes.menu.active);
    window.removeEventListener('click', onWindowClick);
    window.removeEventListener('resize', onResize);
    setTitle();
    shiftListBy(0);
    back.classList.remove(classes.back.active); 
    if (isMobile()) {
      toggleBlackout('off');
    } else {
      listWrapper.removeEventListener('mousemove', onListWrapperHover);
    }
    log();
  }

  function getClasses(obj) {
    return deepmerge({
      blackout: {
        base: 'bem-blackout',
        active: 'bem-blackout_active',
      },
      menu: {
        base: 'bem-nested-menu',
        active: 'bem-nested-menu_active',
      },
      button: {
        base: 'bem-nested-menu__button',
        active: 'bem-nested-menu__button_active',
      },
      close: {
        base: 'bem-nested-menu__mobile-close',
      },
      back: {
        base: 'bem-nested-menu__mobile-back',
        active: 'bem-nested-menu__mobile-back_active',
      },
      title: {
        base: 'bem-nested-menu__mobile-title',
      },
      menuWrapper: {
        base: 'bem-nested-menu__menu-wrapper',
      },
      listWrapper: {
        base: 'bem-nested-menu__list-wrapper',
      },
      list: {
        base: 'bem-nested-menu__list',
        active: 'bem-nested-menu__list_active',
      },
      el: {
        base: 'bem-nested-menu__el',
        nested: 'bem-nested-menu__el_nested',
        active: 'bem-nested-menu__el_active',
      },
      elTitle: {
        base: 'bem-nested-menu__el-title'
      }
    }, 
    obj);
  }

  function generateTemplate() {
    let el = createList(data);
    listWrapper.appendChild(el);
  }

  function createList(list) {
    let listEl = document.createElement('div');
    listEl.classList.add(classes.list.base);
    list.forEach((el) => {
      let temp = document.createElement('div');
      temp.classList.add(classes.el.base);
  
      let title = document.createElement('a');
      title.innerText = el.title;
      title.setAttribute('href', el.link);
      title.classList.add(classes.elTitle.base);
      temp.appendChild(title);

      if (el.child) {
        let childList = createList(el.child);
        temp.classList.add(classes.el.nested);
        temp.appendChild(childList);
        temp.addEventListener('click', onNestedElClick);
      };

      listEl.appendChild(temp);
    })

    return listEl;
  }

  function backToPrevious() {
    let el = activeNestedListEl.pop();
    el.classList.remove(classes.el.active);
    setTitle(activeNestedListEl[activeNestedListEl.length - 1]);
    shiftListBy(activeNestedListEl.length);
    if (activeNestedListEl.length === 0) {
      back.classList.remove(classes.back.active);
    }
  }

  function isMobile() {
    return window.innerWidth <= mobileMaxWidth;
  }

  function toggleBlackout(action = 'on') {
    blackout.classList[action === 'on' ? 'add' : 'remove'](classes.blackout.active);
  }

  function shiftListBy(n) {
    listWrapper.querySelector(`.${classes.list.base}`).style.transform = `translateX(-${n * 100}%)`;
  }

  function log() {
    console.log('Данные для дебага всплывающего меню:', {
      activeNestedListEl,
    });
  }

  return {
    reset,
  }
}
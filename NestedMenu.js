import deepmerge from 'deepmerge';

/* 
  Логика для всплывающего меню с несколькими уровнями вложенности

  В качестве параметров можно передавать:
  selector - селектор оснвного элемента-родителя
	baseMenuURL - ссылка на структуру базового меню, пример структуры в файле /baseMenuData.json
	nestedMenuURL - ссылка, в конец которой будут вставляться id'шники элементов меню (например при ссылке http://artmizu.ru/screenshots/ 
	запрос на пункт меню с id 4 будет таким http://artmizu.ru/screenshots/4). Ответ должен содержать структуру пункта меню, пример структуры в файле /nestedMenuElData.json. Если nestedMenuURL не предоставлен, то используется baseMenuURL
  classes - объект с классами для основных элементов, структуру можно увидеть ниже
  mobileMaxWidth - на каком максимальном разрешении меню будет работать в мобильном режиме
*/

export default function NestedMenu({
	selector = '.bem-nested-menu',
	baseMenuURL,
	nestedMenuURL,
	classes = {},
	mobileMaxWidth = 767,
	mouseMoveResetTimeout = 3000,
} = {}) {
	let menu = document.querySelector(selector);
	if (!menu) return;

	let baseListData,
		button,
		nestedListEl,
		activeNestedListEl,
		isActive,
		menuWrapper,
		listWrapper,
		title,
		close,
		back,
		blackout,
		defaultMenuTitle,
		menuResetTimeout;
	let activated = false;
	downloadData({
		url: baseMenuURL,
		afterDownload(d) {
			baseListData = d;
			init();
		},
	});

	function downloadData({ id, url, afterDownload = () => {} } = {}) {
		url = id ? url + id : url;
		fetch(url)
			.then((response) => response.json())
			.then((json) => {
				afterDownload(json);
			})
			.catch((e) => console.error('Невозможно загрузить данные для меню', e));
	}

	// Первоначальная инициализация при загрузке страницы: поиск элементов, присвоение стандартных значений
	function init() {
		activeNestedListEl = [];
		isActive = false;
		classes = getClasses(classes);
		if (!nestedMenuURL) nestedMenuURL = baseMenuURL ? baseMenuURL : null;
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
			generateBaseList();
			nestedListEl = menu.querySelectorAll(`.${classes.el.nested} > .${classes.elTitle.base}`);
			activated = true;
		}

		if (isActive) {
			reset();
		} else {
			isActive = true;
			button.classList.add(classes.button.active);
			menu.classList.add(classes.menu.active);
			window.requestAnimationFrame(() => window.addEventListener('click', onWindowClick));
			window.addEventListener('resize', onResize);
			toggleBlackout('on');
			if (!isMobile()) window.addEventListener('mousemove', onMouseMove);
		}
	}

	function onNestedElClick(e) {
		let alreadyActive = this.classList.contains(classes.el.active);
		if (isMobile()) e.preventDefault();
		if (alreadyActive) return;

		enableEl(this);
	}

	function onMouseMove(e) {
		let isInsideMenu = e.target.closest(`.${classes.listWrapper.base}`);
		if (isInsideMenu) {
			let el = e.target.closest(`.${classes.el.base}`);
			resetMouseMoveTimer();
			if (el) enableEl(el);
		} else {
			if (!menuResetTimeout) menuResetTimeout = setTimeout(reset, mouseMoveResetTimeout);
		}
	}

	function onWindowClick(e) {
		let isInsideMenu = e.target.closest(`.${classes.list.base}`);
		let isMobileTop = e.target.closest(`.${classes.mobileTop.base}`);
		if (!isInsideMenu && !isMobileTop) reset();
	}

	function onResize() {
		if (isMobile()) {
			shiftListBy(activeNestedListEl.length);
			resetMouseMoveTimer();
			window.removeEventListener('mousemove', onMouseMove);
		} else {
			shiftListBy(0);
			window.addEventListener('mousemove', onMouseMove);
		}
	}

	// при активации элемента со вложенными пунктами
	function enableEl(el) {
		if (!el.classList.contains(classes.el.active) && el.classList.contains(classes.el.nested)) {
			if (!el.dataset.downloaded) {
				el.dataset.downloaded = true;
				el.classList.add(classes.el.loading);
				downloadData({
					id: +el.dataset.id,
					url: nestedMenuURL,
					afterDownload(data) {
						let list = createList(data.child);
						el.appendChild(list);
						el.classList.remove(classes.el.loading);
						enableMenulEl(el);
					},
				});
			} else {
				enableMenulEl(el);
			}
		} else if (!el.classList.contains(classes.el.nested)) {
			disableUnnecessaryEl(el);
			setTitle(activeNestedListEl[activeNestedListEl.length - 1]);
		}
	}

	function enableMenulEl(el) {
		activeNestedListEl.push(el);
		el.classList.add(classes.el.active);
		disableUnnecessaryEl(el);
		setTitle(el);
		back.classList.add(classes.back.active);
		if (isMobile()) {
			shiftListBy(activeNestedListEl.length);
		}
		log();
	}

	function disableUnnecessaryEl(el) {
		let list = getAncestors(el);
		activeNestedListEl.forEach((active) => {
			if (!list.some((x) => x === active)) {
				active.classList.remove(classes.el.active);
			}
		});
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
		activeNestedListEl.forEach((el) => el.classList.remove(classes.el.active));
		activeNestedListEl = [];
		button.classList.remove(classes.button.active);
		menu.classList.remove(classes.menu.active);
		window.removeEventListener('click', onWindowClick);
		window.removeEventListener('resize', onResize);
		setTitle();
		shiftListBy(0);
		back.classList.remove(classes.back.active);
		toggleBlackout('off');
		resetMouseMoveTimer();
		if (!isMobile()) {
			window.removeEventListener('mousemove', onMouseMove);
		}
		log();
	}

	function resetMouseMoveTimer() {
		if (menuResetTimeout) {
			clearTimeout(menuResetTimeout);
			menuResetTimeout = null;
		}
	}

	function getClasses(obj) {
		return deepmerge(
			{
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
					loading: 'bem-nested-menu__el_loading',
					nested: 'bem-nested-menu__el_nested',
					active: 'bem-nested-menu__el_active',
				},
				elIcon: {
					base: 'bem-nested-menu__el-icon',
				},
				elTitle: {
					base: 'bem-nested-menu__el-title',
				},
				mobileTop: {
					base: 'bem-nested-menu__mobile-top',
				},
			},
			obj,
		);
	}

	function generateBaseList() {
		let el = createList(baseListData);
		listWrapper.appendChild(el);
	}

	function createList(list) {
		let listEl = document.createElement('div');
		listEl.classList.add(classes.list.base);
		list.forEach((el) => {
			let temp = document.createElement('div');
			temp.classList.add(classes.el.base);
			temp.dataset.id = el.id;
			if (el.class && el.class.length > 0) {
				el.class.forEach((elClass) => temp.classList.add(elClass));
			}

			let title = document.createElement('a');
			title.innerText = el.title;
			title.classList.add(classes.elTitle.base);
			temp.appendChild(title);
			if (el.icon) {
				let icon = document.createElement('div');
				icon.classList.add(classes.elIcon.base);
				icon.style.backgroundImage = `url(${el.icon})`;
				title.prepend(icon);
			}

			// если у элемента меню есть ссылка, подразумевается что у него не может быть детей и при клике на этот пункт должен совершаться переход
			if (el.link) {
				title.setAttribute('href', el.link);
			} else {
				temp.classList.add(classes.el.nested);
				temp.addEventListener('click', onNestedElClick);
			}

			listEl.appendChild(temp);
		});

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
		listWrapper.scrollTop = 0;
	}

	function log() {
		console.log('Данные для дебага всплывающего меню:', {
			activeNestedListEl,
		});
	}

	return {
		reset,
	};
}

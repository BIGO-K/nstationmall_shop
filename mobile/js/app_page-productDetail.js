'use strict';

/**
 * 상품 상세
 * 옵션선택, 탭메뉴, 찜하기
**/

//< 옵션 선택
var ProdOption = function (__isReload) {

	// ? __isReload:boolean - 함수 재실행 여부로 true인 경우 private을 실행하지 않음

	var $ui;
	var $optionMain, $optionSub;
	var json;
	var optionSubAll;// 서브 전체옵션
	var _type;// button/selelct(옵션 노출 방식)
	var _selectedMain;// 선택된 메인 옵션 이름
	var _selectedSub;// 선택된 서브 옵션 이름
	var _hideOption = null;// main/sub 옵션 숨김

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-product'; },// 데이타 속성 이름
		get _selectTypeDefault() { return '- 선택 -'; },
		get _classSelect() { return '__option-select'; },
		// 옵션 생성
		create: function () {

			var $optionLists = mm.find('.m_product-option-select ul', $ui);
			$optionMain = $optionLists[0];
			$optionSub = $optionLists[1];

			// 옵션 아이템 생성
			var $optionItem = mm.element.create('<li><button type="button" class="btn_option"><b></b></button></li>')[0];
			var $fragMain = document.createDocumentFragment();
			var $fragSub = document.createDocumentFragment();

			if (_type === 'select') $optionItem.firstElementChild.classList.add('mm_flex');

			// 옵션 1
			_.forEach(json.options, function (__option) {

				base.appendItem($fragMain.appendChild($optionItem.cloneNode(true)), __option);

			});

			// 옵션 2
			_.forEach(optionSubAll, function (__option) {

				// 처음 생성시 메인 옵션 갯수에 따라 1개인 경우에만 품절 옵션에 품절 표시가 되며, 이외에는 품절표시를 하지 않습니다
				base.appendItem($fragSub.appendChild($optionItem.cloneNode(true)), Object.assign(mm.extend(__option), (json.options.length === 1) ? {} : { _qty: 1 }));

			});

			if ($fragMain.childElementCount > 0) $optionMain.appendChild($fragMain);
			if ($fragSub.childElementCount > 0) $optionSub.appendChild($fragSub);

			$optionItem.remove();

			// 옵션 클릭 이벤트
			mm.delegate.on($ui, '.btn_option', 'click', function (__e) {

				if (_type === 'select' && !$ui.style.height) gsap.to($ui, { height: '75%', duration: mm.time._fast });
				base.selectOption(this);

			});

			// 단일 옵션 확인(옵션 이름 '-')
			if (_.every(json.options, function (__option) { return __option._name === '-' })) _hideOption = 'main';
			if (_.every(optionSubAll, function (__option) { return __option._name === '-' })) _hideOption = 'sub';

			// 단일 옵션 숨김 및 제목 변경
			if (_hideOption !== null) {
				_.forEach(mm.closest((_hideOption === 'main') ? $optionSub : $optionMain, 'section'), function (__$section) {

					__$section.firstElementChild.firstElementChild.textContent = '옵션';// h6 > b

				});

				mm.element.hide(mm.closest((_hideOption === 'main') ? $optionMain : $optionSub, 'section'));
			}

		},
		// 옵션 아이템
		appendItem: function (__$element, __option) {

			// ? __$element:element - 옵션 li 요소
			// ? __option:object - 옵션

			var data = mm.data.get(__$element);
			mm.find('b', __$element)[0].textContent = data._name = __option._name;

			if (__option.sub) data._isMain = true;// 옵션 1
			if (__option._qty === 0 || (__option.sub && _.every(__option.sub, ['_qty', 0]))) base.soldoutItem(__$element);// 품절

		},
		// 옵션 품절
		soldoutItem: function (__$element, __is) {

			// ? __$element:element - 옵션 li 요소
			// ? __is:boolean - true(품절 해제), false/undefined(품절)

			var data = mm.data.get(__$element);

			if (!data.$swap) {
				data.$swap = document.createDocumentFragment();
				data.$swap.appendChild(mm.element.create(mm.string.template([
					'<span class="btn_option" title="품절">',
					'	<b>${NAME}</b>',
					'	${SOLDOUT}',
					'</span>',
				], { NAME: __$element.textContent, SOLDOUT: (_type === 'select') ? '<b>(품절)</b>' : '<svg><line x1="0" y1="100%" x2="100%" y2="0" stroke="#cdcdcd" stroke-width="1" /></svg>' }))[0]);

				if (_type === 'select') data.$swap.firstElementChild.classList.add('mm_flex');
			}

			// 변경(swap)
			if ((__is && __$element.firstElementChild.tagName === 'SPAN') || (!__is && __$element.firstElementChild.tagName === 'BUTTON')) {
				__$element.appendChild(data.$swap.firstElementChild);
				data.$swap.appendChild(__$element.firstElementChild);
			}

		},
		// 옵션 선택
		selectOption: function (__$element, __isResult) {

			// ? __$element:element - 선택한 옵션 요소
			// ? __isResult:boolean - 옵션 선택 완료

			if (!__$element) return;

			var data = mm.data.get(__$element.parentElement);
			var $items;
			var options;

			// 중복 선택
			if (_type === 'select' && __$element.classList.contains(base._classSelect) && __isResult !== true) {
				mm.dropdown.open(mm.closest((data._isMain) ? $optionSub : $optionMain, '.mm_dropdown'));

				return;
			}

			// 버튼(같은 뎁스)
			_.forEach(mm.find('.btn_option', (data._isMain) ? $optionMain : $optionSub), function (__$btn) {

				if (mm.find('b', __$btn)[0].textContent.trim() === mm.find('b', __$element)[0].textContent.trim() && __isResult !== true) mm.class.toggle(__$btn, base._classSelect);
				else __$btn.classList.remove(base._classSelect);

			});

			var _isSelected = __$element.classList.contains(base._classSelect);

			// 1뎁스
			if (data._isMain) {
				_selectedMain = (_isSelected) ? data._name : null;
				$items = mm.find('li', $optionSub);
				options = (_isSelected) ? _.find(json.options, function (__option) { return __option._name === _selectedMain }).sub : {};

				if (_type === 'select') {
					mm.element.text(mm.find('.btn_dropdown > b', mm.closest($optionMain, '.mm_dropdown')), (_selectedMain) ? _selectedMain : base._selectTypeDefault);
					mm.dropdown.open(mm.closest($optionSub, '.mm_dropdown'));
				}
			}
			// 2뎁스
			else {
				_selectedSub = (_isSelected) ? data._name : null;
				$items = mm.find('li', $optionMain);
				options = [];

				_.forEach(json.options, function (__option) {

					if (_isSelected) {
						// 선택한 2뎁스가 있는 1뎁스만 노출
						var option = _.find(__option.sub, function (__sub) { return __sub._name === _selectedSub });
						if (option) options.push({ _name: __option._name, _qty: option._qty });
					}
					// 1뎁스 전체 노출
					else {
						options.push({ _name: __option._name, _qty: (_.every(__option.sub, ['_qty', 0])) ? 0 : 1 });
					}

				});

				if (_type === 'select') {
					mm.element.text(mm.find('.btn_dropdown > b', mm.closest($optionSub, '.mm_dropdown')), (_selectedSub) ? _selectedSub : base._selectTypeDefault);
					mm.dropdown.open(mm.closest($optionMain, '.mm_dropdown'));
				}
			}

			// 옵션 노출(다른 뎁스)
			_.forEach($items, function (__$item, __index) {

				// 셀렉트 해제 시 전체 노출로 qty를 1로 적용하며, 메인 옵션이 1개만 있는 경우 옵션2의 수량에 따라 기본을 품절 옵션으로 변경합니다.
				var option = (mm.is.empty(options)) ? (json.options.length === 1) ? { _qty: json.options[0].sub[__index]._qty } : { _qty: 1 } : _.find(options, ['_name', mm.find('b', __$item)[0].textContent.trim()]);
				if (option) {
					mm.element.show(__$item);
					base.soldoutItem(__$item, option._qty > 0);
				}
				else mm.element.hide(__$item);// 없는 옵션은 숨김(품절 아님)

				if (_type === 'select' && data._isMain && option) {
					var $btnOption = mm.find('.btn_option', __$item)[0];
					if (option._qty > 0) {
						if ($btnOption.children.length > 1) $btnOption.lastElementChild.remove();
						if (option._qty <= 5) mm.element.append($btnOption, mm.string.template('<b>(${STOCK}개)</b>', { STOCK: option._qty }));
					}
				}

			});

			// 옵션 2개 모두 선택
			if (_selectedMain && _selectedSub) base.result();
			// 단일 옵션 바로 선택
			else if (_hideOption !== null && __isResult !== true) base.selectOption(mm.find('.btn_option', $items)[0]);

		},
		// 옵션 선택 완료
		result: function(__isDirect) {

			// ? __isDirect:boolean - 옵션 1개로 바로 선택된 화면 표시

			var $selected = mm.find('.m_product-option-selected', $ui)[0];
			var data = mm.data.get($ui).product;
			var _mainName = _selectedMain;// 옵션 새로 저장
			var _subName = _selectedSub;// 옵션 새로 저장
			var _optionName = mm.string.template('${MAIN}/${SUB}', { MAIN: _mainName, SUB: _subName }).replace(/^\-\/|\/\-$/g, '');// 이름/- 또는 -/이름 변경
			if (_optionName === '-') _optionName = '';

			if (__isDirect !== true) {
				// 기존 선택 옵션 삭제
				base.selectOption(mm.find(mm.selector(base._classSelect, '.'), $optionMain)[0], true);
				base.selectOption(mm.find(mm.selector(base._classSelect, '.'), $optionSub)[0], true);
				if (_type === 'select') mm.dropdown.close($ui);

				// 중복선택 체크
				if (_optionName.length > 0 && _.some(mm.find('.text_option', $selected), function (__$text) { return __$text.textContent.trim() === _optionName; })) {
					mm.bom.alert('이미 선택된 옵션입니다.');

					return;
				}
			}

			// 옵션생성
			if (mm.find('ul', $selected).length === 0) mm.element.append($selected, '<ul></ul>');

			var selectedOption = _.find(_.find(json.options, function (__option) { return __option._name === _mainName; }).sub, function (__sub) { return __sub._name === _subName; });
			var $selectedItem = mm.element.create(mm.string.template([
				'<li>',
					'<div class="m__selected-info">',
						'<p class="text_product">${PRODUCT}</p>',
						'<p class="text_option">${NAME}</p>',
						'<p class="text_stock">남은수량 <span>${STOCK}</span>개</p>',
					'</div>',
					'<div class="mm_stepper" data-stepper>',
						'<div class="mm_form-text">',
							'<label>',
								'<input type="text" class="textfield text_stepper" data-text><i class="bg_text"></i>',
								'<span class="mm_ir-blind text_placeholder">수량</span>',
							'</label>',
						'</div>',
						'<button type="button" class="btn_stepper-subtract"><i class="ico_stepper-subtract"></i><b class="mm_ir-blind">수량 빼기</b></button>',
						'<button type="button" class="btn_stepper-add"><i class="ico_stepper-add"></i><b class="mm_ir-blind">수량 더하기</b></button>',
					'</div>',
					'<p class="text_price"><strong>${PRICE}</strong></p>',
					'<button type="button" class="btn_option-remove"><i class="mco_option-remove"></i><b class="mm_ir-blind">옵션삭제</b></button>',
				'</li>'
			], { PRODUCT: json._name, NAME: _optionName, STOCK: selectedOption._qty, PRICE: mm.number.comma(selectedOption._price) }))[0];

			if (_optionName.trim().length === 0) mm.find('.text_option', $selectedItem)[0].remove();// 옵션 이름이 없으면 삭제
			if (selectedOption._qty > 5) mm.find('.text_stock', $selectedItem)[0].remove();// 수량이 5개가 넘으면 남은수량 삭제

			if (__isDirect === true) {
				$selectedItem.classList.add('__selected-single');
				$selectedItem.lastElementChild.remove();
			}

			mm.element.attribute($selectedItem, { 'data-option': { _code: selectedOption._code, _price: selectedOption._price }});
			mm.element.append(mm.find('> ul', $selected), $selectedItem);

			if (_type === 'select' && ($ui.offsetHeight + ($selected.scrollHeight - $selected.offsetHeight) > screen.availHeight * 0.9)) gsap.to($ui, { height: '90%', duration: mm.time._fast });

			var $item = $selected.firstElementChild.lastElementChild;// ul > li

			// 스텝퍼 업데이트
			var $stepper = mm.find('[data-stepper]', $item)[0];
			mm.element.attribute($stepper, { 'data-stepper': { _max: selectedOption._qty }});
			mm.stepper.update($stepper);

			var stepperData = mm.data.get($stepper, 'data-stepper');
			stepperData.onChange = base.sum;
			stepperData.onChangeParams = [$ui];

			mm.form.update($item);

			if (mm.is.mobile('android')) {
				mm.event.on(mm.find('.text_stepper', $stepper), 'focusin focusout', function (__e) {

					var $optionSum = $stepper.closest('.m_product-option-footer');
					switch (__e.type) {
						case 'focusin':
							mm.element.hide($optionSum);
							break;
						case 'focusout':
							if (!mm.is.display($optionSum)) mm.element.show($optionSum);
							break;
					}

				});
			}

			// 옵션 삭제
			mm.event.on(mm.find('.btn_option-remove', $item), 'click', function (__e) {

				if ($item.parentElement.childElementCount === 1) {
					$item.parentElement.remove();// ul 삭제

					if (_type === 'select')mm.element.style($ui, { height: '' });
				}
				else $item.remove();

				base.sum();

				mm.apply(data.onChange, $selected, [selectedOption._code, 'remove']);

			});

			$selected.scrollTop = $selected.scrollHeight;// 선택한 요소로 스크롤 이동

			mm.apply(data.onChange, $selected, [selectedOption._code, 'add']);

		},
		// 총 상품 금액
		sum: function () {

			var $selected = mm.find('.m_product-option-selected', $ui)[0];

			// stepper의 onChange로 호출된 base.sum의 this는 mm_stepper 요소이며, 삭제로 호출시의 this는 ProdOption 함수의 base Object입니다.
			var $stepper = (mm.is.element(this) === true) ? this : null;
			if ($stepper) {
				var _changePrice = mm.data.get($stepper.closest('li'), 'data-option', true)._price * mm.find('.text_stepper', $stepper)[0].value;

				mm.element.text(mm.siblings($stepper, '.text_price')[0].firstElementChild, mm.number.comma(_changePrice));
			}

			var _total = _.sumBy(mm.find('li', $selected), function (__$item) { return mm.data.get(__$item, 'data-option', true)._price * mm.find('.text_stepper', __$item)[0].value; });

			mm.element.text(mm.find('.m_product-option-footer .text_price > strong', $ui), mm.number.comma(_total));

		},
		// 셀렉트 타입에서 드롭다운 토글 시 실행
		selectToggle: function (__isOpen) {

			if (typeof(__isOpen) !== 'boolean' || !mm.is.display(this)) return;

			var $selected = mm.find('.m_product-option-selected', this.closest('.m_product-option'))[0];
			// 드롭다운이 열릴 때 선택된 옵션 영역과 겹치지 않도록 visibility: hidden을 적용하고, 높이를 스크립트로 적용
			if (__isOpen === true) {
				// this.style['height'] = mm.number.unit(mm.scroll.find(this).offsetHeight + 42);
				$selected.style['visibility'] = 'hidden';
			}
			else {
				// this.style['height'] = '';
				$selected.style['visibility'] = '';
			}

		},
	};

	ProdOption.selectToggle = base.selectToggle;

	// private
	(function () {

		if (__isReload === true) return;

		var _classOn = '__option-open';// ? :string - 옵션 선택 패널 오픈

		// 구매하기, 옵션선택 닫기 버튼 클릭
		mm.delegate.on(document, '.btn_product-buy, .btn_option-close', 'click', function (__e) {

			if (this.classList.contains('btn_product-buy')) {
				mm.class.add($ui, _classOn);

				// 셀렉트 타입 자동 열림/닫힘
				if (_type === 'select') {
					var $selected = mm.find('.m_product-option-selected', $ui)[0];
					var $options = (_hideOption === 'main') ? $optionSub : $optionMain;
					if ($selected.firstElementChild) mm.dropdown.close(mm.closest($options, '.mm_dropdown'));
					else mm.dropdown.open(mm.closest($options, '.mm_dropdown'));
				}

				// 페이지 스크롤 시 옵션 닫기
				mm.event.on(mm.scroll.el, 'scroll', function () {

					mm.event.dispatch('.btn_option-close', 'click');

				}, { _isOnce: true });
			}
			else {
				mm.class.remove($ui, _classOn);
			}

		});

	})();

	// public
	return {
		// 이벤트 연결
		update: function (__json, __$ui) {

			if (!__json || !__json.options) return;

			json = __json;
			$ui = __$ui;

			// 옵션 1개 바로 선택
			if (json.options.length === 1 && json.options[0].sub.length === 1) {
				_selectedMain = json.options[0]._name;
				_selectedSub = json.options[0].sub[0]._name;

				if (json.options[0].sub[0]._qty != 0) {
					base.result(true);

					return;
				}
			}

			// 서브 옵션 전체(1뎁스 전체 옵션이 같지 않을 경우 대비)
			// optionSubAll = _.chain(json.options).map(function (__option) { return __option.sub; }).flatten().uniqBy('_name').sortBy(function (__option) { return parseInt(__option._name, 10); }).value();
			optionSubAll = _.chain(json.options).map(function (__option) { return __option.sub; }).flatten().uniqBy('_name').value(); // 개발팀 요청으로 sortBy 제거

			_type = (json.options.length > 6 || optionSubAll.length > 6) ? 'select' : 'button';
			var _sectionHtml = mm.string.template((_type === 'button') ? [
				'<section>',
				'	<h6 class="mm_strapline"><b></b></h6>',
				'	<div class="mm_scroller __scroller_x__">',
				'		<ul></ul>',
				'	</div>',
				'</section>',
			] : [
				'<section class="mm_dropdown" data-dropdown>',
				'	<h6 class="mm_strapline"><b></b></h6>',
				'	<button type="button" class="btn_dropdown" title="펼쳐보기"><b>${DEFAULT}</b><i class="mco_dropdown-bold"></i></button>',
				'	<div class="mm_dropdown-item">',
				'		<div class="mm_dropdown-item-inner">',
				'			<div class="mm_scroller">',
				'				<ul></ul>',
				'			</div>',
				'		</div>',
				'	</div>',
				'</section>',
			], { DEFAULT: base._selectTypeDefault });

			var data = mm.data.get($ui).product;
			var $optionSelect = mm.find('.m_product-option-select', $ui)[0];

			// 옵션 영역 생성
			var $section = mm.find('section', $optionSelect)[0];
			if (!$section) $section = mm.element.create(_sectionHtml)[0];

			var $fragment = document.createDocumentFragment();

			for (var _i = 0; _i < 2; _i++) {
				var $cloneSection = $fragment.appendChild($section.cloneNode(true));
				// var _text = mm.find('> .mm_strapline > b', $cloneSection)[0].textContent = mm.string.template('옵션${INDEX}', { INDEX: _i + 1 });
				mm.find('> .mm_strapline > b', $cloneSection)[0].textContent = mm.string.template('옵션${INDEX}', { INDEX: _i + 1 });

				// 셀렉트 타입
				if (_type === 'select') {
					mm.element.attribute($cloneSection, { 'data-dropdown': { _group: mm.string.template('dev_accrodion-option${INDEX}', { INDEX: data._index }), 'onChange': 'ProdOption.selectToggle' } });
					// mm.find('.btn_dropdown > b', $cloneSection)[0].textContent = _text;
				}
			}

			$section.remove();
			$optionSelect.prepend($fragment);

			// 재입고알림 노출
			_.forEach(json.options, function (__option) {

				if (_.find(__option.sub, function (__sub) { return (__sub._code != '0' && __sub._qty === 0) })) {
					var $restocks = mm.find('.btn_restock-alarm', $ui);
					if ($restocks.length > 0) mm.element.style($restocks, { 'display': 'inline-block' });

					return false;
				}

			});

			// 기본 옵션 생성
			base.create(json);

		},
	};

}
//> 옵션 선택

mm.ready(function () {

	// 품절임박 숨김
	(function (__$stock) {

		if (!__$stock) return;

		gsap.fromTo('.m_prodetail-head-stock .mco_clock', { rotate: -15 }, { rotate: 15, duration: 0.05, ease: 'linear.none', yoyo: true, yoyoEase: 'linear.none', repeat: 100 });
		gsap.to('.m_prodetail-head-stock .mco_clock', { scale: 1.4, duration: 0.4, delay: 0.5, ease: 'bounce.out', yoyo: true, repeat: 5, yoyoEase: 'back.in',
			onComplete: function () {

				gsap.to(__$stock, { autoAlpha: 0, height: 0, y: 0, duration: 0.4, delay: 2, ease: 'cubic.inOut' });

			},
		});

	})(mm.find('.m_prodetail-head-stock')[0]);

	// 탭메뉴 fixed
	var $header = mm.find('.mm_header')[0];
	var $tab = mm.find('.m_prodetail-tab .mm_tabmenu')[0];

	function tabSticky() {

		if (mm.element.offset($tab).top < $header.offsetHeight + mm.element.position($header).top) $tab.classList.add(_classSticky);
		else $tab.classList.remove(_classSticky);

	}

	// 펀딩/공동구매 등의 상품 상세 내 탭을 사용하지 않는 페이지로 인해 탭메뉴 유무를 분기처리합니다.
	if ($tab) {
		var _tabLimit = mm.element.position($tab).top - $header.offsetHeight - mm.element.position($header).top;
		var _classSticky = '__tabmenu-sticky';

		mm.event.on(mm.scroll.el, 'scroll', tabSticky);
		tabSticky();

		mm.event.on(mm.find('.btn_tab', $tab), 'click', function (__e) {

			__e.preventDefault();

			if ($tab.classList.contains(_classSticky)) mm.scroll.to(_tabLimit);

		});
	}

	// 남은 수량의 글자가 영역을 넘어 길어지는 경우 '9999+'로 대체
	(function (__$timeSale) {

		if (!__$timeSale) return;

		var $stock = mm.find('.text_stock strong', __$timeSale)[0];
		if ($stock.textContent.trim() > 9999) $stock.textContent = '9999+';

		mm.event.on(window, 'load resize', function () {

			var __$timeSale = mm.find('.m_prodetail-special')[0];
			if (!__$timeSale.classList.contains('__switch-on')) mm.element.style(__$timeSale, { 'width': mm.number.unit(window.outerWidth - 28) });

		});

	})(mm.find('.m_prodetail-special')[0]);

	// 상품 360도
	(function (__$multiangle) {

		var $list = mm.find('.m_prodetail-multiangle-image', __$multiangle)[0];

		if (!$list) return;

		mm.intersection.force(mm.find('data-lazyload', $list));
		mm.class.add($list.children, '__on');// 화면에 처음 노출될 때 깜빡이는 이슈로 첫 실행 시 노출 적용
		mm.element.append('.mm_view', __$multiangle);// ios에서 z-index가 최상위로 올라오지 않는 이슈로 이동 적용

		// 상품 이미지 360도 보기
		mm.event.on(mm.find('.btn_multiangle-view')[0], 'click', function () {

			var $multiangleBtn = this;
			var _classOn = '__multiangle-on';

			if (!__$multiangle || __$multiangle.classList.contains(_classOn)) return;

			$multiangleBtn.disabled = true;
			mm.event.on(mm.find('.btn_close', __$multiangle)[0], 'click', function () {

				$multiangleBtn.disabled = false;
				__$multiangle.classList.remove(_classOn);

			}, { _isOnce: true });

			var $multiangleNote = mm.find('.m_prodetail-multiangle-note', __$multiangle)[0];
			$multiangleNote.classList.add('__note-on');
			__$multiangle.classList.add(_classOn);

			mm.delay.on(mm.class.remove, { _time: 1, _isSec: true, _name: 'DELAY_360_NOTE_HIDE', _isOverwrite: true, params: [$multiangleNote, '__note-on'] });

			mm.class.remove($list.children, '__on');
			$list.firstElementChild.classList.add('__on');

		});

		// 상품 이미지 360도 드래그
		var _sensitive = 1.7 * (32 / $list.childElementCount);
		var _dragCount = 0;
		var _previewIndex = 0;

		mm.event.on($list, 'touchstart', function (__e) {

			_dragCount = 0;
			_previewIndex = mm.element.index($list.children, '.__on');
			var prevTouch = __e.touches[0];

			mm.event.on($list, 'touchmove touchend', function view360MouseInlineHandler(__e) {

				__e.preventDefault();
				__e.stopPropagation();

				switch (__e.type) {
					case 'touchmove':
						var touch = (__e.type === 'touchend') ? __e.changedTouches[0] : __e.touches[0];
						var _moveX = touch.screenX - prevTouch.screenX;
						prevTouch = touch;

						if (_moveX > 0) _dragCount++;
						else _dragCount--;

						if (Math.abs(_dragCount) > _sensitive) {
							_dragCount = 0;
							_previewIndex = (_moveX > 0) ? _previewIndex + 1 : _previewIndex - 1;
							if (_previewIndex >= $list.childElementCount) _previewIndex = 0;
							if (_previewIndex < 0) _previewIndex = $list.childElementCount - 1;

							mm.class.remove($list.children, '__on');
							$list.children[_previewIndex].classList.add('__on');
							}
						break;
					case 'touchend':
						mm.event.off($list, 'touchmove touchend', view360MouseInlineHandler);
						break;
				}

			});

		});

	})(mm.find('.m_prodetail-multiangle')[0]);

});

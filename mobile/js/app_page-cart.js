'use strict';

/**
 * 장바구니
 * 옵션/수량 변경
**/

//< 옵션 선택
// * 기본적인 구조는 상품상세와 동일하고 selected 등 장바구니에 없는 기능 제거
var ProdOption = function () {

	var $ui;
	var $optionMain, $optionSub;
	var json;
	var optionSubAll;// 서브 전체옵션
	var selectedOption;// 선택된 옵션
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

				mm.closest((_hideOption === 'main') ? $optionMain : $optionSub, 'section')[0].classList.add('__option-hide');
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
				if (__$element.firstElementChild.classList.contains(base._classSelect)) {
					__$element.firstElementChild.classList.remove(base._classSelect);
					data.$swap.firstElementChild.classList.add(base._classSelect);
				}

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
				mm.dropdown.close(mm.closest((data._isMain) ? $optionMain : $optionSub, '.mm_dropdown'));

				return;
			}

			// 버튼(같은 뎁스)
			_.forEach(mm.find('.btn_option', (data._isMain) ? $optionMain : $optionSub), function (__$btn) {

				if (mm.find('b', __$btn)[0].textContent.trim() === mm.find('b', __$element)[0].textContent.trim()) mm.class[(__isResult !== true) ? 'toggle' : 'add'](__$btn, base._classSelect);
				else __$btn.classList.remove(base._classSelect);

			});

			var _isSelected = __$element.classList.contains(base._classSelect);

			// 1뎁스
			if (data._isMain) {
				_selectedMain = (_isSelected) ? data._name : null;
				$items = mm.find('li', $optionSub);
				options = (_isSelected) ? _.find(json.options, function (__option) { return __option._name === _selectedMain }).sub : {};

				if (_type === 'select') {
					// 1뎁스가 변경되면 2뎁스 초기화
					if (_hideOption === null) {
						_selectedSub = null;
						mm.element.text(mm.find('.btn_dropdown > b', mm.closest($optionSub, '.mm_dropdown')), base._selectTypeDefault);
						mm.class.remove(mm.find(mm.selector(base._classSelect, '.'), $optionSub)[0], base._classSelect);
					}

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

					// 선택한 2뎁스가 있는 1뎁스만 노출
					if (_isSelected && _type !== 'select') {
						var option = _.find(__option.sub, function (__sub) { return __sub._name === _selectedSub });
						if (option) options.push({ _name: __option._name, _qty: option._qty });
					}
					// select는 1뎁스 전체 노출
					else options.push({ _name: __option._name, _qty: (_.every(__option.sub, ['_qty', 0])) ? 0 : 1 });

				});

				if (_type === 'select') {
					var $dropdown = mm.closest($optionSub, '.mm_dropdown');
					mm.element.text(mm.find('.btn_dropdown > b', $dropdown), (_selectedSub) ? _selectedSub : base._selectTypeDefault);
					mm.dropdown.close($dropdown);
				}
			}

			// 옵션 노출(다른 뎁스)
			_.forEach($items, function (__$item) {

				var option = (mm.is.empty(options)) ? { _qty: 1 } : _.find(options, ['_name', mm.find('b', __$item)[0].textContent.trim()]);// 셀렉트 해제 시 전체 노출로 qty 적용
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

			if (_isSelected) {
				// 옵션 2개 모두 선택
				if (_selectedMain && _selectedSub) base.result();
				// 단일 옵션 바로 선택
				else if (_hideOption !== null && __isResult !== true) base.selectOption(mm.find('.btn_option', $items)[0]);// !
			}

		},
		// 옵션 선택 완료
		result: function(__isDirect) {

			// ? __isDirect:boolean - 옵션 1개로 바로 선택된 화면 표시

			if (_type === 'select') mm.dropdown.close($ui);

			selectedOption = (_selectedMain && _selectedSub) ? _.find(_.find(json.options, function (__option) { return __option._name === _selectedMain; }).sub, function (__sub) { return __sub._name === _selectedSub; }) : { _qty: 0 };

			// 구매가능수량
			mm.find('.text_stock', $ui)[0].textContent = (selectedOption._qty > 0 && selectedOption._qty < 6) ? mm.string.template('구매가능 수량 ${STOCK}개', { STOCK: selectedOption._qty }) : '';

			// 스텝퍼 업데이트
			var $stepper = mm.find('data-stepper', $ui)[0];
			var _value = parseFloat(mm.find('.text_stepper', $stepper)[0].value);
			var dataStepper = mm.data.get($stepper, 'data-stepper');

			if (!dataStepper) mm.stepper.update($stepper);

			mm.data.get($stepper, 'data-stepper')._max = selectedOption._qty;// (selectedOption._qty === 0) ? 1 : selectedOption._qty;
			mm.stepper.change($stepper, (Number.isFinite(_value) && _value !== json.selected._qty && __isDirect !== true) ? _value : (json.selected._qty > selectedOption._qty) ? selectedOption._qty : json.selected._qty);

		},
		// 초기, 이전 값
		default: function (__isSet) {

			// ? __isSet:boolean - 선택 없이 값만 저장

			// 초기 값 선택 적용
			var _isBreak = false;
			_.forEach(json.options, function (__mainOption, __mainIndex) {

				var $sections = mm.find('section', $ui);
				_.forEach(__mainOption.sub, function (__subOption, __subIndex) {

					if (json.selected._code === __subOption._code) {
						if (__subOption._qty > 0) {
							// 값만 저장
							if (__isSet) {
								_selectedMain = __mainOption._name;
								_selectedSub = __subOption._name;
							}
							// 선택
							else {
								var _subIndex = (__mainOption.sub.length != optionSubAll.length) ? _.findIndex(optionSubAll, function (__option, __index) { return (__subOption._name === __option._name) }) : __subIndex;

								base.selectOption(mm.find('.btn_option', $sections[0])[__mainIndex], true);
								base.selectOption(mm.find('.btn_option', $sections[1])[_subIndex], true);
							}
						}
						// 품절
						else {
							// 품절 상품의 옵션을 선택후 적용하지 않고 옵션 변경창을 닫은 경우 선택을 초기화합니다.
							if (!__isSet) {
								base.selectOption(mm.find(mm.selector(base._classSelect, '.'), $sections[0])[0]);
								base.selectOption(mm.find(mm.selector(base._classSelect, '.'), $sections[1])[0]);
							}
						}

						_isBreak = true;
						return false;
					}

				});

				if (_isBreak) return false;

			});

			base.result(true);

		}
	};

	// private
	(function () {

		//

	})();

	// public
	return {
		// 이벤트 연결
		update: function (__json, __$ui) {

			if (!__json || !__json.options) return;

			json = __json;
			$ui = __$ui;

			// 초기 값 적용
			base.default(true);

			// 품절 옵션 열기
			var $switch = mm.find('.btn_option-switch', $ui)[0];
			if (selectedOption._qty === 0) mm.switch.on($switch);
			else mm.switch.off($switch);

			mm.data.get($switch).switch.onChange = function (__is) {

				// 선택 값 적용
				if (__is) base.default();
				// 초기화
				else {
					var $sections = mm.find('section', $ui);
					base.selectOption(mm.find(mm.selector(base._classSelect, '.'), $sections[0])[0], true);
					base.selectOption(mm.find(mm.selector(base._classSelect, '.'), $sections[1])[0], true);
					if (_type === 'select') mm.dropdown.close($ui);

					mm.find('.text_stepper', $ui)[0].value = json.selected._qty;
				}

			}

			// 옵션변경 적용
			mm.event.on(mm.find('.btn_option-change', $ui), 'click', function () {

				if (!_selectedMain || !_selectedSub) {
					mm.bom.alert('선택된 옵션이 없습니다.');
					return;
				}

				json.selected = mm.extend(json.selected, selectedOption);// 현재 선택된 옵션 저장
				json.selected._qty = parseFloat(mm.find('.text_stepper', $ui)[0].value);

				var _optionName = mm.string.template('${MAIN} ${SUB}', { MAIN: _selectedMain, SUB: _selectedSub }).replace(/^\-\s|\s\-$/g, '');// 이름/- 또는 -/이름 변경
				if (_optionName === '-') _optionName = '';
				var _option = mm.string.template('${NAME} / ${QTY}개', { NAME: _optionName, QTY: json.selected._qty });
				var _price = selectedOption._price * json.selected._qty;

				var $textOption = mm.find('.text_option', $ui)[0];
				$textOption.textContent = (_option.startsWith(' / ')) ? _option.replace(' / ', '') : _option;
				mm.find('.text_price > strong', $ui)[0].textContent = mm.number.comma(_price);

				var $soldout = this.closest('.__select-soldout');
				if ($soldout) {
					$soldout.classList.remove('__select-soldout');
					$textOption.classList.remove('__option-soldout');
				}

				mm.switch.off(mm.find('data-switch', $ui));

				var data = mm.data.get($ui).product;
				mm.apply(data.onChange, $ui, [selectedOption._code, json.selected._qty, _price, 'change']);

			});

			// 옵션변경 취소
			mm.event.on(mm.find('.btn_option-cancel', $ui), 'click', function () {

				mm.switch.off(mm.find('data-switch', $ui));

			});

			// 서브 옵션 전체(1뎁스 전체 옵션이 같지 않을 경우 대비)
			optionSubAll = _.chain(json.options).map(function (__option) { return __option.sub; }).flatten().uniqBy('_name').value();

			// 옵션 1개 바로 선택
			if (json.options.length === 1 && json.options[0].sub.length === 1) {
				_selectedMain = json.options[0]._name;
				_selectedSub = json.options[0].sub[0]._name;
				base.result(true);

				return;
			}

			_type = (json._isFunding || json.options.length > 6 || optionSubAll.length > 6) ? 'select' : 'button';
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
					mm.element.attribute($cloneSection, { 'data-dropdown': { _group: mm.string.template('dev_accrodion-option${INDEX}', { INDEX: data._index }) } });
					// mm.find('.btn_dropdown > b', $cloneSection)[0].textContent = _text;
				}
			}

			$section.remove();
			$optionSelect.prepend($fragment);

			// 기본 옵션 생성
			base.create(json);

		},
	};

}
//> 옵션선택
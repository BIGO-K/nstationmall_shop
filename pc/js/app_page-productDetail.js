'use strict';

/**
 * 상품 상세
 * 옵션선택, 탭메뉴, 찜하기
**/

//< 옵션 선택
var ProdOption = function () {

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

			if (mm.is.ie()) {
				$fragMain = document.createElement('ul');
				$fragSub = document.createElement('ul');
			}

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

			if (mm.is.ie()) {
				if ($fragMain.childElementCount > 0) {
					mm.element.after($optionMain, $fragMain);
					$optionMain.remove();
					$optionMain = $fragMain;
				};
				if ($fragSub.childElementCount > 0) {
					mm.element.after($optionSub, $fragSub);
					$optionSub.remove();
					$optionSub = $fragSub;
				}
			}
			else {
				if ($fragMain.childElementCount > 0) $optionMain.appendChild($fragMain);
				if ($fragSub.childElementCount > 0) $optionSub.appendChild($fragSub);
			}

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
				var _section = (_type === 'select') ? '.mm_dropdown' : 'section';
				_.forEach(mm.closest((_hideOption === 'main') ? $optionSub : $optionMain, _section), function (__$section) {

					__$section.firstElementChild.firstElementChild.textContent = '옵션';// h6 > b

				});

				mm.element.hide(mm.closest((_hideOption === 'main') ? $optionMain : $optionSub, _section));
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
				data.$swap = (mm.is.ie()) ? document.createElement('div') :  document.createDocumentFragment();
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
						if (option._qty <= 5 && !__isResult) mm.element.append($btnOption, mm.string.template('<b>(${STOCK}개)</b>', { STOCK: option._qty }));
					}
				}

			});

			// 현재 옵션을 선택한 옵션 영역 외 다른 옵션 선택 영역에 선택한 옵션 연동
			if (!__isResult) {
				var $syncer = _.find(mm.find(base._dataName), function (__$el) { return __$el != $ui });
				_.forEach(mm.find('.m_product-option-select ul', $syncer)[(data._isMain) ? 0 : 1].children, function (__$item) {

					var $btn = mm.find('.btn_option', __$item)[0];
					var _selectedOption = (data._isMain) ? _selectedMain : _selectedSub;

					if (!_selectedOption) {
						if ($btn.classList.contains(base._classSelect)) mm.event.dispatch($btn, 'click');
						else if (!mm.find(mm.selector(base._classSelect, '.'), __$item)[0]) return false;
					}
					else if (mm.data.get(__$item)._name === _selectedOption) {
						if (!mm.find(mm.selector(base._classSelect, '.'), __$item)[0] && _selectedOption != '-') mm.event.dispatch($btn, 'click');

						return false;
					}

				});
			}

			// 옵션 2개 모두 선택
			if (_selectedMain && _selectedSub) base.result();
			// 단일 옵션 바로 선택
			else if (_hideOption !== null && __isResult !== true) base.selectOption(mm.find('.btn_option', $items)[0]);

		},
		// 옵션 선택 완료
		result: function(__isDirect, __option) {

			// ? __isDirect:boolean - 옵션 1개로 바로 선택된 화면 표시

			var $selected = mm.find('.m_product-option-selected', $ui)[0];
			var data = mm.data.get($ui).product;
			var _mainName = _selectedMain ? _selectedMain : __option._selectedMain;// 옵션 새로 저장
			var _subName = _selectedSub ? _selectedSub : __option._selectedSub;// 옵션 새로 저장
			var _optionName = mm.string.template('${MAIN}/${SUB}', { MAIN: _mainName, SUB: _subName }).replace(/^\-\/|\/\-$/g, '');// 이름/- 또는 -/이름 변경
			if (_optionName === '-') _optionName = '';

			var _classSelected = '__option-selected';
			var _classScroll = '__selected-scroll';

			if (__isDirect !== true) {
				// 기존 선택 옵션 삭제
				base.selectOption(mm.find(mm.selector(base._classSelect, '.'), $optionMain)[0], true);
				base.selectOption(mm.find(mm.selector(base._classSelect, '.'), $optionSub)[0], true);
				if (_type === 'select') mm.dropdown.close($ui);

				// 중복선택 체크
				if (_optionName.length > 0 && _.some(mm.find('.text_option', $selected), function (__$text) { return __$text.firstElementChild.textContent.trim() === _optionName; })) {
					if (mm.data.get($ui).product._index === 0) mm.bom.alert('이미 선택된 옵션입니다.');

					return;
				}
			}

			// 옵션생성
			if (mm.find('ul', $selected).length === 0) {
				$selected.appendChild(mm.element.create(mm.string.template('<div class="mm_scroller"><ul></ul></div>'))[0]);
				$ui.classList.add(_classSelected);
			}
			var $scroller = mm.find('.mm_scroller', $selected)[0];

			var selectedOption = _.find(_.find(json.options, function (__option) { return __option._name === _mainName; }).sub, function (__sub) { return (__sub._name === _subName && __sub._qty != 0); });
			var $selectedItem = mm.element.create(mm.string.template([
				'<li>',
					'<div class="m__selected-info">',
						'<p class="text_option"><span>${NAME}</span><strong class="text_stock">남은수량 <span>${STOCK}</span>개</strong></p>',
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
					'</div>',
				'</li>'
			], { NAME: _optionName, STOCK: selectedOption._qty, PRICE: mm.number.comma(selectedOption._price) }))[0];

			if (_optionName.trim().length === 0) mm.find('.text_option', $selectedItem)[0].remove();// 옵션 이름이 없으면 삭제
			if (selectedOption._qty > 5) mm.find('.text_stock', $selectedItem)[0].remove();// 수량이 5개가 넘으면 남은수량 삭제

			if (__isDirect === true) {
				$selectedItem.classList.add('__selected-single');
				$selectedItem.firstElementChild.lastElementChild.remove();
			}

			mm.element.attribute($selectedItem, { 'data-option': { _code: selectedOption._code, _price: selectedOption._price }});
			mm.element.append(mm.find('> ul', $scroller), $selectedItem);

			if ($scroller.scrollHeight > $selected.offsetHeight) $selected.classList.add(_classScroll);

			var $item = $scroller.firstElementChild.lastElementChild;// ul > li

			// 스텝퍼 업데이트
			var $stepper = mm.find('[data-stepper]', $item)[0];
			mm.element.attribute($stepper, { 'data-stepper': { _max: selectedOption._qty }});
			mm.stepper.update($stepper);

			var stepperData = mm.data.get($stepper, 'data-stepper');
			stepperData.onChange = base.sum;

			mm.form.update($item);

			// 옵션 삭제
			mm.event.on(mm.find('.btn_option-remove', $item), 'click', function (__e) {

				var _itemCode = mm.data.get($item, 'data-option', true)._code;

				_.forEach(mm.find(base._dataName), function (__$ui) {

					var $selected = mm.find('.m_product-option-selected', __$ui)[0];
					var $items = mm.find('li', $selected);
					var $item = _.find($items, function (__$item) { return mm.data.get(__$item, 'data-option', true)._code === _itemCode; });

					mm.element.remove(($item.parentElement.childElementCount === 1) ? $item.closest('.mm_scroller') : $item);

					if ($items.length === 0) __$ui.classList.remove(_classSelected);
					else if (mm.find('.mm_scroller', $selected)[0].scrollHeight === $selected.offsetHeight) $selected.classList.remove(_classScroll);

				});

				base.sum();

				mm.apply(data.onChange, $selected, [selectedOption._code, 'remove']);

			});

			if (mm.data.get($ui).product._index === 0) mm.apply(data.onChange, $selected, [selectedOption._code, 'add']);

		},
		// 총 상품 금액
		sum: function () {

			var $stepper = (mm.is.element(this) === true) ? this : null;

			_.forEach(mm.find(base._dataName), function (__$ui) {

				var $selected = mm.find('.m_product-option-selected', __$ui)[0];

				if ($stepper) {
					var optionDetail = mm.data.get($stepper.closest('li'), 'data-option', true);
					var $item = _.find(mm.find('li', $selected), function (__$item) { return mm.data.get(__$item, 'data-option', true)._code === optionDetail._code; });

					if ($item) {
						var _qty = Number(mm.find('.text_stepper', $stepper)[0].value);
						if (mm.find('.text_stepper', $item)[0].value != _qty) mm.stepper.change(mm.find('.mm_stepper', $item)[0], _qty);

						mm.element.text(mm.find('.text_price > strong', $item)[0], mm.number.comma(optionDetail._price * _qty));
					}
					else return;
				}

				var _total = _.sumBy(mm.find('li', $selected), function (__$item) { return mm.data.get(__$item, 'data-option', true)._price * mm.find('.text_stepper', __$item)[0].value; });

				mm.element.text(mm.find('.m_product-option-buy .text_price > strong', __$ui), mm.number.comma(_total));

			});

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
				'<div class="mm_dropdown" data-dropdown>',
				'	<h6 class="mm_strapline"><b></b></h6>',
				'	<button type="button" class="btn_dropdown" title="펼쳐보기"><b>${DEFAULT}</b><i class="mco_dropdown-bold"></i></button>',
				'	<div class="mm_dropdown-item">',
				'		<div class="mm_dropdown-item-inner">',
				'			<div class="mm_scroller">',
				'				<ul></ul>',
				'			</div>',
				'		</div>',
				'	</div>',
				'</div>',
			], { DEFAULT: base._selectTypeDefault });

			var data = mm.data.get($ui).product;
			var $optionSelect = mm.find('.m_product-option-select', $ui)[0];

			// 옵션 영역 생성
			var $section = mm.find((_type === 'select') ? '.mm_dropdown' : 'section', $optionSelect)[0];
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

// 하단 구매옵션 열기/닫기 이벤트
function changeSidePosition (__is) {

	var $sidebar = mm.find('.mm_sidebar')[0];

	var _classSideOptionUp = '__sidebar-up';
	var _classSideOptionOpen = '__sidebar-upper';

	// 옵션창이 열려서 노출될 때 사이드바 위치 변경
	if (__is) {
		$sidebar.classList.remove(_classSideOptionUp);
		$sidebar.classList.add(_classSideOptionOpen);
	}
	else {
		$sidebar.classList.remove(_classSideOptionOpen);
		$sidebar.classList.add(_classSideOptionUp);
	}

	// 셀렉트형 옵션 드롭다운 닫기
	var $optionDropdown = mm.find('.m_prodetail-buy .mm_dropdown');
	if ($optionDropdown[0]) mm.dropdown.close($optionDropdown);

}

mm.ready(function () {

	// 품절임박 숨김
	(function (__$stock) {

		if (!__$stock) return;

		gsap.fromTo('.m_prodetail-head-stock .mco_clock', { rotate: -15 }, { rotate: 15, duration: 0.05, ease: 'linear.none', yoyo: true, yoyoEase: 'linear.none', repeat: 100 });
		gsap.to('.m_prodetail-head-stock .mco_clock', { scale: 1.4, duration: 0.4, delay: 0.5, ease: 'bounce.out', yoyo: true, repeat: 5, yoyoEase: 'back.in',
			onComplete: function () {

				gsap.to(__$stock, { autoAlpha: 0, height: 0, duration: 0.4, delay: 2, ease: 'cubic.inOut' });

			},
		});

	})(mm.find('.m_prodetail-head-stock')[0]);

	// 탭메뉴
	_.forEach(mm.find('.m_prodetail-tab'), function (__$tab) {

		var $option = mm.find('.m_prodetail-buy')[0];
		var $header = mm.find('.mm_header')[0];
		var $sidebar = mm.find('.mm_sidebar')[0];
		var $scroll = mm.scroll.el;

		var _classSticky = '__tab-sticky';
		var _classStickyEnd = '__tab-stickyEnd';
		var _classBuySticky = '__buy-sticky';
		var _classBuySwitch = '__switch-on';
		var _classSideOptionUp = '__sidebar-up';
		var _classSideOptionOpen = '__sidebar-upper';

		var data = mm.data.get(__$tab).tab;
		data.onChange = function() {

			mm.frameResize(mm.find('.mm_tab-item.__tab-on iframe', __$tab))
			mm.event.dispatch($scroll, 'scroll');

			if (mm.class.some(__$tab, [_classSticky, _classStickyEnd])) mm.scroll.to(__$tab, { _time: 0, _margin: $header.offsetHeight });

		};

		// 스크롤
		mm.event.on(mm.scroll.el, 'load scroll', function (__e) {

			var _tabTop = mm.element.offset(__$tab).top;
			if (_tabTop - $header.offsetHeight - mm.element.offset($header).top < 0) {
				if (_tabTop > -__$tab.offsetHeight + document.documentElement.offsetHeight * 0.33) {
					__$tab.classList.remove(_classStickyEnd);
					__$tab.classList.add(_classSticky);
				}
				else {
					__$tab.classList.remove(_classSticky);
					__$tab.classList.add(_classStickyEnd);
				}

				$sidebar.classList.add(_classSideOptionUp);
				if ($option) $option.classList.add(_classBuySticky);
			}
			else {
				__$tab.classList.remove(_classSticky);
				mm.class.remove($sidebar, [_classSideOptionUp, _classSideOptionOpen]);

				if ($option) {
					mm.class.remove($option, [_classBuySticky, _classBuySwitch]);

					var $optionDropdown = mm.find('.m_product-option-select .mm_dropdown',  $option);
					if ($optionDropdown[0]) mm.dropdown.close($optionDropdown[0]);
				}
			}

		});

	});

	// 공동구매 하단옵션 스크롤 이벤트
	(function (__$coopbuy) {

		if (!__$coopbuy) return;

		var $option = mm.find('.m_prodetail-buy')[0];
		var $header = mm.find('.mm_header')[0];
		var $sidebar = mm.find('.mm_sidebar')[0];

		var _classBuySticky = '__buy-sticky';
		var _classBuySwitch = '__switch-on';
		var _classSideOptionUp = '__sidebar-up';
		var _classSideOptionOpen = '__sidebar-upper';

		// 스크롤
		mm.event.on(mm.scroll.el, 'load scroll', function (__e) {

			var _coopbuyTop = mm.element.offset(__$coopbuy).top;
			if (_coopbuyTop - $header.offsetHeight - mm.element.offset($header).top < 0) {
				$sidebar.classList.add(_classSideOptionUp);
				if ($option) $option.classList.add(_classBuySticky);
			}
			else {
				mm.class.remove($sidebar, [_classSideOptionUp, _classSideOptionOpen]);
				mm.class.remove($option, [_classBuySticky, _classBuySwitch]);

				var $optionDropdown = mm.find('.m_product-option-select .mm_dropdown',  $option);
				if ($optionDropdown[0]) mm.dropdown.close($optionDropdown);
			}

		});

	})(mm.find('.m_prodetail-coopbuy')[0]);

	// 상품 360도
	(function (__$multiangle) {

		var $list = mm.find('.m_prodetail-multiangle-image', __$multiangle)[0];

		if (!$list) return;

		mm.intersection.force(mm.find('data-lazyload', $list));
		mm.class.add($list.children, '__on');// 화면에 처음 노출될 때 깜빡이는 이슈로 첫 실행 시 노출 적용

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
		var _sensitive = 2 * (32 / $list.childElementCount);
		var _dragCount = 0;
		var _previewIndex = 0;

		mm.event.on(__$multiangle, 'mousedown', function (__e) {

			_dragCount = 0;
			_previewIndex = mm.element.index($list.children, '.__on');
			var _prevX = __e.clientX;

			mm.event.on(document, 'mousemove mouseup', function view360MouseInlineHandler(__e) {

				__e.preventDefault();

				switch (__e.type) {
					case 'mousemove':
						var _moveX = __e.clientX - _prevX;
						_prevX = __e.clientX;

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
					case 'mouseup':
						mm.event.off(document, 'mousemove mouseup', view360MouseInlineHandler);
						break;
				}

			});

		});

	})(mm.find('.m_prodetail-multiangle')[0]);

});

'use strict';

//**
//** 전시관리 공통
//**

//< 전시테이블
(function () {

	var base = {
		_dataName: 'data-display',
		_classOn: '__on',
		get _isOpen() {

			return (mm.find(mm.selector(base._classOn, '.'), $display).length > 0) ? true : false;

		},
		// 동작 변경 확인
		confirm: function (__function, __text) {

			if (base._isOpen) {

				__text = (!__text) ? '열려있는 항목이 있습니다.<br>해당 항목을 취소하고 진행하시겠습니까?' : __text;
				mm.bom.confirm(__text, function (__is) {

					if (__is) {
						base.close();
						__function();
					}

				});

			}
			else __function();

		},
		// iframe 닫기
		close: function (__isCreate) {

			_.forEach(mm.find(mm.selector(base._classOn, '.'), $display), function (__$el) {

				var $iframe = mm.find('iframe', __$el)[0];
				if (!__isCreate && $iframe.src.includes('create')) __$el.remove();
				else {
					__$el.classList.remove(base._classOn);
					mm.element.attribute($iframe, { 'src': '', 'style': '' });
				}

			});

		},
	};

	var $display = mm.find(base._dataName)[0];
	var $table = mm.find('table', $display)[0];
	var data = mm.data.get($display, base._dataName, true);
	var $frameTr = mm.element.create(mm.string.template([
		'<tr>',
		'	<td>',
		'		<iframe class="m_display-table-frame" data-iframe="{ \'_extraHeight\': -3 }"></iframe>',
		'	</td>',
		'</tr>',
	]))[0];

	// 테이블 초기값
	_.forEach(mm.find('tbody', $table), function (__$tbody, __index) {

		var _total = __$tbody.firstElementChild.childElementCount;
		__$tbody.append($frameTr.cloneNode(true));
		__$tbody.children[1].firstElementChild.colSpan = _total;

		if (__index === 0) {
			$table.prepend(mm.element.create(mm.string.template([
				'<colgroup>',
				'	${,,,COL()}',
				'</colgroup>',
			], { COL: _.fill(Array(_total), '<col>') }))[0]);
		}

	});

	// 숫자, 가격 컴마
	_.forEach(mm.find('.text_comma, .text_price', $table), function (__$text) {

		var _number = __$text.textContent.trim();
		__$text.textContent = (_number.length > 0) ? mm.number.comma(_number) : 0;

	});

	// 수정
	mm.delegate.on($display, '.btn_display-modify', 'click', function (__e) {

		var $this = this;

		base.confirm(function () {

			var $tbody = $this.closest('tbody');
			$tbody.classList.add(base._classOn);

			// iframe 로드
			var $iframe = mm.find('iframe', $tbody)[0];
			if (!$iframe.getAttribute('scrolling')) $iframe.setAttribute('scrolling', 'no');// scrolling 속성 웹표준 오류로 스크립트로 적용

			mm.event.on($iframe, 'load', function (__e) {

				if (mm.is.ie() && $iframe.getAttribute('scrolling') === 'no') $iframe.contentDocument.body.scroll = 'no';

				// iframe 취소
				mm.event.on(mm.find('.btn_display-cancel', $iframe), 'click', function (__e) {

					base.confirm(base.close, '수정을 취소하시겠습니까?');

				});

				// iframe 적용
				mm.event.on(mm.find('.btn_display-apply', $iframe), 'click', function (__e) {

					// 각 블록 내 하위항목 추가/수정시 비동기 결과처리가 필요한 부분이 있어
					// 반환값이 promise인 경우 해당 프로미스가 true로 resolve 되었을 때에만 ui 적용처리하도록 수정했습니다 - 김기쁨
					var resultPromise = mm.apply(applyDisplayItem, $iframe, [$tbody.dataset.id]);
					// resultPromise instanceof Promise -> 동작 안 함
					if (resultPromise && typeof resultPromise.then === 'function') {
						resultPromise.then(function (result) {
							if (result === true) {
								base.close();
							}
						});
					} else {
						base.close();
					}

				});

				// iframe 삭제
				mm.event.on(mm.find('.btn_display-remove', $iframe), 'click', function (__e) {

					base.confirm(function () {

						var resultPromise = mm.apply(removeDisplayItem, $iframe, [$tbody.dataset.id]);

						if (resultPromise && typeof resultPromise.then === 'function') {
							resultPromise.then(function (result) {
								if (result === true) {
									$tbody.remove();
								}
							});
						} else {
							$tbody.remove();
						}

					}, '항목을 삭제하시겠습니까?');

				});

			}, { _isOnce: true });

			$iframe.src = mm.string.join(data._frameSrc, (data._frameSrc.includes('.html')) ? '?/' : '/', 'edit/', $tbody.dataset.id);

		});

	});

	// 등록
	var _createHTML = mm.find('[type="text/codehtml"]')[0].innerHTML;
	mm.event.on(mm.find('.btn_display-add', $display), 'click', function (__e) {

		base.confirm(function () {

			var $tbody = mm.element.create(_createHTML)[0];
			$tbody.classList.add(base._classOn);

			var _total = $tbody.firstElementChild.childElementCount;
			$tbody.append($frameTr.cloneNode(true));
			$tbody.children[1].firstElementChild.colSpan = _total;

			if (mm.find('colgroup', $table).length === 0) {
				$table.prepend(mm.element.create(mm.string.template([
					'<colgroup>',
					'	${,,,COL()}',
					'</colgroup>',
				], { COL: _.fill(Array(_total), '<col>') }))[0]);
			}

			$table.append($tbody);
			mm.scroll.to($tbody.previousElementSibling);

			// iframe 로드
			var $iframe = mm.find('iframe', $tbody)[0];
			if (!$iframe.getAttribute('scrolling')) $iframe.setAttribute('scrolling', 'no');// scrolling 속성 웹표준 오류로 스크립트로 적용

			mm.event.on($iframe, 'load', function (__e) {

				// iframe 적용
				mm.event.on(mm.find('.btn_display-apply', $iframe), 'click', function (__e) {

					// 각 블록 내 하위항목 추가/수정시 비동기 결과처리가 필요한 부분이 있어
					// 반환값이 promise인 경우 해당 프로미스가 true로 resolve 되었을 때에만 ui 적용처리하도록 수정했습니다 - 김기쁨
					var resultPromise = mm.apply(applyDisplayItem, $iframe, ['create']);
					// resultPromise instanceof Promise -> 동작 안 함
					if (resultPromise && typeof resultPromise.then === 'function') {
						resultPromise.then(function (result) {
							if (result === true) {
								base.close(true);
							}
						});
					} else {
						base.close(true);
					}

				});

				// iframe 삭제/취소
				mm.event.on($iframe.contentWindow.mm.find('.btn_display-remove, .btn_display-cancel', $iframe), 'click', function (__e) {

					base.confirm(function () {

						mm.apply(removeDisplayItem, $iframe, ['create']);
						$tbody.remove();

					}, '등록을 취소하시겠습니까?');

				});

			}, { _isOnce: true });

			$iframe.src = mm.string.join(data._frameSrc, (data._frameSrc.includes('.html')) ? '?/' : '/', 'create');

		});

	});

	// 이미지보기
	var $toggleImages = mm.find('.btn_preview-toggle', $display);
	mm.event.on($toggleImages, 'click', function (__e) {

		__e.stopPropagation();// delegate로 연결된 기존 이벤트 차단

		var $table = this.closest('.m_display-table');
		var $previewIcons = mm.find('i[class*="ico_image-"]', $toggleImages);

		$table.classList.toggle('__preview-on');
		mm.class.remove($previewIcons, ['ico_image-show', 'ico_image-hide']);

		if (mm.class.every($table, '__preview-on')) {
			mm.element.attribute($toggleImages, {'title': '이미지 미리보기 끄기'});
			mm.class.add($previewIcons, 'ico_image-hide');
			mm.preload.destroy($table);
			mm.preload.update($table);
		}
		else {
			mm.element.attribute($toggleImages, {'title': '이미지 미리보기 켜기'});
			mm.class.add($previewIcons, 'ico_image-show');
		}

		mm.table.resize($table);

	});

	// 순서변경
	// * data-table과 구조가 달라 별도 적용
	(function () {

		var initial = {
			onChange: null,// ? :function
			onChangeParams: [],// ? :array
		}
		var _dataName = 'data-sort';
		var _classSort = '__list-sortable';
		var defaultLists = [];

		mm.event.on('[data-sort]', 'click', function (__e) {

			__e.stopPropagation();// delegate로 연결된 기존 이벤트 차단

			var $this = this;
			if (__e.detail._isSort !== true) {
				base.confirm(function () {

					mm.event.dispatch($this, 'click', { data: { _isSort: true } });

				});
				return;
			}

			var $ui = this.closest('.__form_sortable__');
			if (!$ui) return false;

			var $sort = mm.find('.m_display-table-list', $ui)[0];
			var $sortList = mm.find('table', $sort)[0];
			var $sortItems = mm.find('> tbody', $sortList);
			var data = mm.data.get(this, _dataName);
			if (mm.is.empty(data)) data = mm.data.set(this, _dataName, { initial: initial });

			$ui.classList.add(_classSort);

			var $checks = mm.find('.__checked', $ui);
			mm.class.remove($checks, '__checked');
			mm.class.add($checks, '__checked-temp');

			var $firstItems = mm.find('> tr:first-child > th:first-child', $sortItems);
			var _checkHtml = mm.string.template([
				'<label class="mm_form-check __check-sortable">',
				'	<input type="checkbox" data-check>',
				'	<b class="mm_block">',
				'		<i class="ico_form-check"></i>',
				'		<span class="text_label mm_ir-blind">항목선택</span>',
				'	</b>',
				'</label>'
			]);

			mm.element.prepend($firstItems, _checkHtml);
			mm.form.update($sortList);

			_.forEach(mm.find('> tbody', $sortList), function (__$tbody, __index) {

				defaultLists[__index] = __$tbody;
				if (__$tbody.offsetHeight < 10) mm.element.remove(mm.find('.__check-sortable', __$tbody.firstElementChild));

			});

			// 버튼 생성
			var $btnEdits = mm.find('[data-sort]', $ui);
			mm.element.after($btnEdits, mm.string.template([
				'<button type="button" class="mm_btn btn_sort-cancel __btn_line__"><i class="ico_sortable-cancel"></i><b>순서편집 취소</b></button>',
				'<button type="button" class="mm_btn btn_sort-complete __btn_secondary__"><i class="ico_sortable-complete"></i><b>순서편집 적용</b></button>',
				'<button type="button" class="mm_btn btn_sort-top"><b>최상단 이동</b></button>',
				'<button type="button" class="mm_btn btn_sort-bottom"><b>최하단 이동</b></button>',
				'<button type="button" class="mm_btn btn_sort-up"><b>위로 1칸 이동</b></button>',
				'<button type="button" class="mm_btn btn_sort-down"><b>아래로 1칸 이동</b></button>',
			]));

			var $buttons = mm.siblings($btnEdits, '[class*="btn_sort-"]');
			mm.event.on($buttons, 'click', function (__e) {

				// 초기화
				function resetSortable() {

					mm.event.off($buttons, 'click');
					mm.element.remove($buttons);

					$ui.classList.remove(_classSort);
					mm.class.remove(mm.find('.__checked', $ui), '__checked');

					var $temps = mm.find('.__checked-temp');
					mm.class.remove($temps, '__checked-temp');
					mm.class.add($temps, '__checked');

					mm.element.remove(mm.find('th:first-child .__check-sortable', $sortList));

					mm.form.update($sortList);

					// ie에서 순서편집 후 스크롤 확장될 때 스크롤 아래 영역에 있는 요소 전체 클릭이 안되는 이슈로 스크롤 재적용
					if (mm.is.ie('ie')) {
						var _ieCount = 0;
						var ieInterval = setInterval(function () {

							if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
								mm.scroll.off();
								mm.delay.on(mm.scroll.on);

								clearInterval(ieInterval);
							}

							_ieCount++;
							if (_ieCount > 100) clearInterval(ieInterval);

						}, 10);
					}

				}

				var $clicked = this;
				var $sortItems = mm.find('> tbody', $sortList);

				// 순서편집 취소
				if ($clicked.classList.contains('btn_sort-cancel')) {
					mm.bom.confirm('순서변경을 취소하시겠습니까?', function (__is) {

						if (__is === true) {
							_.forEach(defaultLists, function (__$list) {

								mm.element.append($sortList, __$list);

							});
							resetSortable();
						}

					});
				}
				// 순서편집 적용
				else if ($clicked.classList.contains('btn_sort-complete')) {
					mm.bom.confirm('순서변경을 적용하시겠습니까?', function (__is) {

						if (__is === true) {
							resetSortable();
							mm.apply(data.onChange, $clicked, data.onChangeParams);
						}

					});
				}
				// 순서편집 제어
				else {
					var sortables = _.filter($sortItems, function (__$item) {

						var $sortCheck = mm.find('.__check-sortable [data-check]', __$item)[0];
						return $sortCheck && $sortCheck.checked;

					});
					if ($sortItems.length === sortables.length) return;

					var _isForm = $sort.classList.contains('mm_form');// 첫 번째 tr 요소 샘플 숨김 확인
					var _index;

					// 위로 1칸 이동
					if ($clicked.classList.contains('btn_sort-up')) {
						_index = mm.element.index($sortItems, sortables[0]);
						if (_index === 0 || (_isForm && _index === 1)) return;

						_.forEach(sortables, function (__$item) {

							mm.element.before(__$item.previousElementSibling, __$item);

						});
					}
					// 아래로 1칸 이동
					else if ($clicked.classList.contains('btn_sort-down')) {
						_index = mm.element.index($sortItems, sortables[sortables.length - 1]);
						if (_index === $sortItems.length - 1) return;

						_.forEach(_.reverse(sortables.concat()), function (__$item) {

							mm.element.after(__$item.nextElementSibling, __$item);

						});
					}
					// 최상단 이동
					else if ($clicked.classList.contains('btn_sort-top')) {
						_index = mm.element.index($sortItems, sortables[0]);
						if (sortables.length === 1 && (_index === 0 || _isForm && _index === 1)) return;

						var _targetIndex = (_isForm) ? 1 : 0;
						mm.element.before(mm.find('> tbody', $sortList)[_targetIndex], sortables);
					}
					// 최하단 이동
					else {
						_index = mm.element.index($sortItems, sortables[sortables.length - 1]);
						if (sortables.length === 1 && _index === $sortItems.length - 1) return;

						mm.element.after(_.last(mm.find('> tbody', $sortList)), sortables);
					}
				}

			});

		});

	})();

})();
//> 전시테이블
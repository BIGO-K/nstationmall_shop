'use strict';

/**
 * 페이지 공통
 * 프로젝트 컴포넌트/모듈, 레디, 로드
**/

//< 최초(레디 전)
(function () {

	/*
	// 우클릭 및 드래그 방지
	function returnHandler(__e) {

		__e.preventDefault();

	}

	window.addEventListener('contextmenu', returnHandler);
	// document.addEventListener('selectstart', returnHandler);// 에디터 입력 이슈
	document.addEventListener('dragstart', returnHandler);
	*/

	// 스테이지 확인
	if (!mm._isStage && !mm._isFrame && !mm._isModal && !mm._isError && !mm._isExternal) {
		if (mm._isPublish) {
			mm.storage.set('session', 'directPage', location.href.replace(location.origin, ''));
			mm.history.replace(null, mm._homeUrl);// location.replace를 사용하면 뒤로가기를 할 때 새로고침 되는 이슈가 있음
			location.reload();
		}
		// 개발에서 적용
		else {
			// 미들웨어에서 스테이지로 이동하면 뒤로가기를 할 때 새로고침 되는 이슈(location.replace 이슈와 같음)
			try {
				// 스크립트 내 적용 방식은 퍼블과 같고, directPage 분기를 위해 별도 스크립트 적용
				App.pageScript.common.goStage();
			}
			catch (__error) {
				console.log('App.pageScript.common.goStage(); 오류:', __error);
			}
		}
	}

	// ios에서 iframe 요소를 로드할 때 state가 없어지는 이슈로(메인 등) 기존 값 적용
	if (mm.is.mobile('ios') && frameElement && !mm.history.state) mm.history.state = mm.storage.get('session', 'stateBackup');

})();
//> 최초(레디 전)

//< 레디
mm.ready(function () {

	// 팝업
	if (mm._isPopup) {
		var state = mm.history.state;
		var _keepIndex = (state) ? state._keepIndex : 0;

		if (_keepIndex > 0) mm.find('[data-href*="back"]')[0].classList.remove('__off');// 뒤로가기 노출
	}

	// 아이프레임
	if (frameElement) {
		mm.observer.dispatch(mm.event.type.frame_ready, { data: { this: window } });

		// 컨텐츠 아이프레임
		if (mm._isFrame) {
			// 리사이즈
			if (!mm._isMain) mm.frameResize(null, { _isLoad: true });

			// 캐러셀/슬라이더 컨텐츠 아이프레임
			var $ui = frameElement.closest('[data-carousel], [data-slider]');
			if ($ui) {
				var $touch = mm.find('.mm_page-inner')[0];// 페이지 영역에서만 적용
				var data = ($ui.getAttribute('data-carousel')) ? mm.data.get($ui).carousel : mm.data.get($ui).slider;

				function uiFrameHandler(__e) {

					mm.event.dispatch(mm.find('.mm_carousel-inner, .mm_slider-inner', $ui)[0], __e.type, { data: { touches: (__e.type === 'touchend') ? __e.changedTouches : __e.touches, target: __e.target } });
					if (__e.type === 'touchmove' && data.__._isDirection === true) __e.preventDefault();// 이동 중 스크롤 차단
					if (__e.type === 'touchend') mm.event.off($touch, 'touchmove touchend', uiFrameHandler);

				}

				mm.event.on($touch, 'touchstart', function (__e) {

					var $scroll = mm.scroll.find(__e.target, true);
					if ($scroll.window) $scroll = null;
					if (__e.target.closest('[data-carousel], [data-slider') || ($scroll && $scroll !== mm.scroll.el)) return;

					uiFrameHandler(__e);
					mm.event.on($touch, 'touchmove touchend', uiFrameHandler);

				});
			}
		}
	}

    // 컴포넌트
    mm.ui.update();

	// autofill 감지
	mm.event.on('[data-text]', 'animationstart', function (__e) {

		var $text = this.closest('.mm_form-text');
		if (!$text) return;

		switch (__e.animationName) {
			case 'autofill-on':
				$text.classList.add('__text-on');
				break;
			case 'autofill-cancel':
				if (this.value.trim().length === 0) $text.classList.remove('__text-on');
				break;
		}

	});

	// 모바일 로테이션
	/* 동영상 회전을 위해 새로고침 사용 안함(이슈 발생 시 확인 필요)
	if (!mm.is.mobile('app')) {
		mm.event.on(window, 'orientationchange', function () {

			location.reload();// stage부터 새로 그려야 하는 부분은 replace 대신 reload 사용
			// location.replace(location.href.split('#')[0]);

		});
	}
	*/

	// 터치이벤트 확인
	mm.event.on(document, 'touchstart touchend', function (__e) {
	// mm.delegate.on(document, '*', 'touchstart touchend', function (__e) {

		switch (__e.type) {
			case 'touchstart':
				mm._isTouch = true;
				break;
			case 'touchend':
				mm._isTouch = false;
				break;
		}

	});

	// 아이폰 위/아래 스크롤 막기
	if (mm.is.mobile('ios')) {
		var _touchCount = 0;
		var _touchBefore = 0;

		// 세로 스크롤만 적용
		mm.event.on('.mm_scroller:not(.__scroller_x__)', 'touchstart touchmove', function (__e) {

			if (__e.detail && __e.detail.touches) return;// 커스텀이 아닌 순수 스크롤만 적용

			var $scroll = mm.scroll.find(__e.target, true);
			if ($scroll.scrollHeight <= $scroll.offsetHeight) return;// 스크롤 내용이 적음

			var touch = __e.touches[0];

			switch (__e.type) {
				case 'touchstart':
					_touchBefore = touch.pageY;
					_touchCount = 0;
					break;
				case 'touchmove':
					var _touchMove = touch.pageY;
					if (_touchMove - _touchBefore < 0) {// 위로 스크롤
						if (_touchCount < 0) _touchCount = 0;
						_touchCount++;
					}
					else if (_touchMove - _touchBefore > 0) {// 아래로 스크롤
						if (_touchCount > 0) _touchCount = 0;
						_touchCount--;
					}
					_touchBefore = _touchMove;
					break;
			}

			// 스크롤 상/하단에서 영역을 넘겨 드래그하면 캔슬
			var _scrollHeight = $scroll.scrollHeight - $scroll.offsetHeight;
			if ($scroll === this && ($scroll.scrollTop <= 0 && _touchCount < 0) || ($scroll.scrollTop >= _scrollHeight && _touchCount > 0)) {
				__e.preventDefault();
			}

		});
		// }, { _isPassive: false });// ! _isPassive 일 때 가로스크롤 끊기는 이슈(맥북으로 테스트 필요)
	}

	// a 링크
	mm.delegate.on(document, 'a[data-href]', 'click', function (__e) {

		if (this.target.toLowerCase() === 'blank') return;// target blank 제외

		__e.preventDefault();

		// mm.data에 저장할 기본 값
		var initial = {
			openEl: this,// ? :element - 클릭한 요소
			_type: null,// ? :string - link, popup, modal, anchor, back, forward, reload
			_frameId: null,// ? :string - popup, modal을 iframe으로 노출할 때 id 값
			_frameName: null,// ? :string - popup, modal을 iframe으로 노출할 때 name 값
			// _isCloseBefore: false,// ? :boolean - type 값이 link/popup일 때 현재 팝업 요소를 닫음(교체)
			// _isLinkStage: true,// ? :boolean - type 값이 link/popup일 때 true(스테이지에서 실행 mm.popup.open), false(현재 창에서 실행 location.href)
			_step: 1,// ? :number - mm.history.back/forward 이동 수
			// * 이 외 mm.link, mm.scroll.to  등에서 사용하는 변수를 추가로 적용하여 사용
		};

		var data = mm.data.get(this, 'data-href', { initial: initial });
		if (mm.is.empty(data)) data = mm.data.set(this, 'data-href', { initial: initial });
		var _attrHref = this.getAttribute('href');
		var _href = this.href;

		if (!data._type) return false;

		if (['link', 'popup'].includes(data._type)) {
			// 외부링크
			if (!_href.includes(location.host)) {
				// 프로토콜이 https 일 때 외부 http 경로의 iframe이 보안상 이유로 연결 안됨
				// mm.popup.open('popup_externalLink.html?url=' + _href);
				window.open(_href);// 새 창 열림
				return false;
			}
			else {
				if (_attrHref.replace('#', '').trim().length === 0 || _attrHref.toLowerCase().includes('javascript:')) return false;

				// 변경하는 링크가 같으면
				if (_href.split('#')[0] === location.href.split('#')[0]) {
					if (_href.includes('#')) data._type = 'anchor';// 링크가 같고 #이 있으면 anchor로 변경
					else data._type = 'reload';// reload로 변경
				}
			}
		}

		switch (data._type) {
			case 'reload':
				// location.reload();
				location.replace(location.href.split('#')[0]);
				break;
			case 'back':
				mm.history.back(data._step);
				break;
			case 'forward':
				mm.history.forward(data._step);
				break;
			case 'anchor':
				mm.scroll.to(_attrHref, data);
				break;
			case 'modal':
			case 'popup':
				// data.openEl = this;
			case 'link':
			case 'home':
				mm.link(_href, data);
				break;
		}

	});

	// 당겨서 새로고침
	(function (__$scroll) {

		if (!__$scroll || __$scroll === window || (mm._isMain && !mm._isFrame) || mm._isModal || mm._isSide) return;

		mm.element.before(__$scroll, mm.string.template([
			'<!-- 당겨서 새로고침 -->',
			'<!-- (D) 해당영역은 스크립트로 자동 생성됩니다. -->',
			'<div class="mm_refresh">',
			'	<div class="ico_loading"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>',
			'	<p>아래로 당겨 새로고침</p>',
			'</div>',
			'<!--// 당겨서 새로고침 -->',
		]));

		mm.event.on(__$scroll, 'touchstart', function (__e) {

			if (!__e.touches) return;

			var startTouch = __e.touches[0];
			var _isDirection = null;

			mm.event.on(__$scroll, 'touchmove touchend', function touchInlineHandler(__e) {

				var touch = (__e.type === 'touchend') ? __e.changedTouches[0] : __e.touches[0];

				if (_isDirection === null) {
					var _moveX = Math.abs(touch.screenX - startTouch.screenX);
					var _moveY = Math.abs(touch.screenY - startTouch.screenY);
					var _limit = 1.6;// 캐러셀, 가로 스크롤 대응으로 세로 이동 비율 높임

					if (_moveY / _moveX > _limit) _isDirection = true;
					else mm.event.off(__$scroll, 'touchmove touchend', touchInlineHandler);
				}
				else {
					var _y = Math.max((touch.screenY - startTouch.screenY) * 0.4, 0);

					switch (__e.type) {
						case 'touchmove':
							if (__$scroll.scrollTop > 0) return mm.event.off(__$scroll, 'touchmove touchend', touchInlineHandler);

							gsap.set(__$scroll, { marginTop: _y });
							break;
						case 'touchend':
							if (_y < 130) gsap.to(__$scroll, { marginTop: 0, duration: 0.2, ease: 'sine.inOut' });
							else {
								gsap.to(__$scroll, { marginTop: 130, duration: 0.2, ease: 'sine.inOut', onComplete: function () {

										location.replace(location.href);// 새로고침

									}
								});
							}
							break;
					}
				}

				if (__e.type === 'touchend') mm.event.off(__$scroll, 'touchmove touchend', touchInlineHandler);

			});

		});

	})(mm.scroll.el);

	// 푸터 앱 설치배너
	var $appInstall = mm.find('.mm_footer .btn_download')[0];
	if ($appInstall && mm.is.mobile('app')) $appInstall.remove();

	// 툴바 퀵메뉴
	mm.event.on('.mm_toolbar-quickmenu-dim, .mm_toolbar-quickmenu-item a', 'click', function () {

		var $toolbar = this.closest('.mm_toolbar');
		var _classOn = '__switch-on';

		if ($toolbar.classList.contains(_classOn)) $toolbar.classList.remove(_classOn);

	});

	// 스크롤이벤트
	(function (__$scrolls) {

		var $header = (frameElement && mm._isMain && mm._isFrame) ? mm.find('.mm_header', parent.document)[0] : mm.find('.mm_header')[0];// 메인 컨텐츠 아이프레임에서는 부모에서 검색
		var $footer = mm.find('.mm_footer')[0];
		var $btnTop = mm.find('.btn_topmost')[0];
		var $prodList = _.filter(mm.find('.mm_product-list'), function (__$list) { return !__$list.parentElement.classList.contains('mm_scroller') && __$list.parentElement.classList.contains('mm_inner'); })[0];
		var $btnGender = mm.find('.mm_filter-gender')[0];
		var $toast = mm.siblings(__$scrolls[0], '.mm_toast')[0];
		var _scrollBefore = 0;
		var _scrollCount = 0;
		var _scrollThreshold = (mm.is.mobile('ios')) ? 10 : 10;// 아이폰과 안드로이드 감도 조절 필요?
		var _classHeaderHide = '__header-hide';
		// var _classHeaderMinimal = '__header-minimal';

		// 스크롤과 같은 뎁스에 토스트 요소가 있으면 padding-bottom 추가
		if ($toast) {
			var $btnToast = mm.find('.btn_toast', $toast)[0];
			if ($btnToast) mm.element.style('.mm_page-inner', { 'padding-bottom': mm.number.unit($btnToast.offsetHeight) });
		}

		function scrollEventHandler(__$scroller) {

			var $html = (mm._isMain) ? parent.document.documentElement : document.documentElement;
			var _scroll = __$scroller.scrollTop;
			// if (mm.is.mobile('ios') && _scroll === 0) _scroll = Math.max(_scroll, -__$scroller.children[0].getBoundingClientRect().top);// ios12에서 scrollTop을 못가져오는 이슈로 대체 적용했으나 이슈사항 발견 안됨

			var _isScrollEnd = (__$scroller.scrollHeight - __$scroller.offsetHeight) === __$scroller.scrollTop;
			var _direction = (_scroll - _scrollBefore > 0) ? 'down' : 'up';

			// 헤더 노출/숨김
			if ($header && !mm._isModal) {// 모달 제외
				if (_direction === 'down') _scrollCount = (_scrollCount < 0) ? 0 : _scrollCount + 1;
				else _scrollCount = (_scrollCount > 0) ? 0 : _scrollCount - 1;

				if (_scroll > $header.offsetHeight * 2 && !_isScrollEnd) {
					if (_scrollCount > _scrollThreshold) $html.classList.add(_classHeaderHide);
					else if (_scrollCount < -_scrollThreshold) $html.classList.remove(_classHeaderHide);
				}
				else $html.classList.remove(_classHeaderHide);

				// 메인 iframe에서만 스크롤이 있어 클래스 추가
				if (mm._isMain) {
					var $frameHtml = document.documentElement;
					if ($html.classList.contains(_classHeaderHide)) {
						$frameHtml.classList.add(_classHeaderHide);
						// mm.class.add([$frameHtml, $html], _classHeaderMinimal);
					}
					else $frameHtml.classList.remove(_classHeaderHide);

					// if (_scroll < 50) mm.class.remove([$frameHtml, $html], _classHeaderMinimal);
				}
			}

			// 탑버튼 노출/숨김
			if ($btnTop) {
				// 헤더가 보이고 스크롤 높이가 화면의 1.5배보다 클 때 화면의 절반 이상을 스크롤 하거나 마지막에 도달하면 노출
				if (!$html.classList.contains(_classHeaderHide) && __$scroller.scrollHeight > window.innerHeight * 1.5 && (_scroll > window.innerHeight * 0.5 || _isScrollEnd)) $btnTop.classList.add('__on');
				else $btnTop.classList.remove('__on');
			}

			// 상품 리스트 성별 필터
			if ($btnGender) {
				if (mm.element.offset($prodList).top > window.innerHeight * 0.5 || mm.element.offset($footer).top < __$scroller.offsetHeight - parseFloat(mm.element.style(__$scroller, 'padding-bottom')) - 9) $btnGender.classList.add('__gender-bottom');
				else $btnGender.classList.remove('__gender-bottom');
			}

		}

		_.forEach(__$scrolls, function (__$scroller) {

			scrollEventHandler(__$scroller);

		});

		mm.event.on(__$scrolls, 'scroll', function (__e) {

			// * 페이지 스크롤 위치 history 저장은 무한스크롤 할 때 보안오류로 mm.link일 때만 저장

			if (gsap.isTweening(this)) return;// mm.scroll.to 로 이동할 때는 제외

			scrollEventHandler(this);
			_scrollBefore = this.scrollTop;

		});

	})((mm._isSide) ? mm.find('.mm_scroller:not(.__scroller_x__', mm.scroll.el) : mm.scroll.el);// 사이드바 구분

	// 상품목록 상단
	mm.event.on('.mm_product-list-head select', 'update change', function (__e) {

		mm.find('.text_selected', this.parentElement)[0].textContent = this.options[this.selectedIndex].text;

	});

	// 단계별 입력(mm_process)
	var $processItems = mm.find('.mm_process-item');
	mm.delegate.on($processItems, '.mm_foot .mm_btn', 'click', function (__e) {

		var $currentItem = __e.target.closest('.mm_process-item');
		var _index = mm.element.index($processItems, $currentItem);

		if (this.tagName !== 'BUTTON' || (_index === $processItems.length - 1 && !this.classList.contains('btn_back'))) return;

		var _classOn = '__process-on';

		$currentItem.classList.remove(_classOn);
		mm.scroll.to(0, { '_time': 0 });

		if (this.classList.contains('btn_back')) $currentItem.previousElementSibling.classList.add(_classOn);
		else $currentItem.nextElementSibling.classList.add(_classOn);

	});

	// SNS 공유 모달 (브랜드샵, 상품상세)
	mm.event.on('.btn_sns-share', 'click', function () {

		var $btnShare = this;
		var $page = mm.find('.mm_page')[0];
		var $snsLayer = mm.find('.mm_sns', $btnShare.parentElement)[0];
		var $snsList = mm.find('.mm_sns-list', $snsLayer)[0];

		$page.append($snsLayer);
		mm.element.style($snsList, { 'top': mm.number.unit(this.getBoundingClientRect().top + 14) });

		mm.event.on('.btn_sns-close', 'click', function () {

			mm.element.after($btnShare, $snsLayer);
			mm.element.style($snsList, { 'top': '' });

		}, { _isOnce: true });

	});

	// 상품 선택 (판매자 문의, 리뷰작성, 체험단 후기 작성)
	var $prodSelect = mm.find('.mm_product-select')[0];
	var $selectComplete = mm.find('.mm_product-select-complete', $prodSelect)[0];
	mm.event.on(mm.find('.mm_product-item', $prodSelect), 'click', function (__e) {

		__e.preventDefault();

		var $this = this;
		var _classComplete = '__select-complete';
		mm.dropdown.close($this.closest('.mm_dropdown'));

		var $selectItem = $this.cloneNode(true);
		$selectItem.classList.add('__item_single_xs__');

		$selectComplete.innerHTML = '';
		$selectComplete.append($selectItem);
		mm.element.append($selectComplete, '<button type="button" class="btn_remove"><i class="mco_remove"></i><b class="mm_ir-blind">삭제하기</b></button>');

		$prodSelect.classList.add(_classComplete);

		mm.delegate.on($selectComplete, '.btn_remove', 'click', function (__e) {

			__e.preventDefault();

			$selectComplete.innerHTML = '';
			$prodSelect.classList.remove(_classComplete);

		});

	});

});
//> 레디

//< 로드
mm.load(function () {

	// 팝업 리사이즈
	if (mm._isPopup) mm.popup.resize();
	else if (mm._isModal) mm.modal.resize({ _isLoad: true });

	// 컨텐츠 아이프레임 리사이즈
	if (mm._isFrame && !mm._isMain) mm.frameResize(null, { _isLoad: true });

	// 익스/엣지 브라우저에서 새로고침 할 때 라디오/체크박스의 기존 선택을 물고있는거나 날려버리는 이슈가 있어 초기화 후 재연결
	if (mm.is.ie()) mm.form.value('[checked]', true);

	// mm을 수정하지 못하도록 적용
	Object.freeze(mm);

});
//> 로드

//< 사이드바
mm.side = (function () {

	// public
	return {
		//- 사이드바 열기
		open(__url) {

			if (mm.history.session.page._pageType === 'side') return;

			// 처음으로 이동(히스토리 액션 없음)
			if (mm.history.state._pageIndex > 0) {
				mm.storage.set('session', 'isCancelPopstate', true);
				mm.storage.set('session', 'isSideOpen', true);// 개발에서 main과 brand 쿠키처리 용도
				mm.link('/');
			}

			mm.popup.open(__url, { onReady: function () {

				mm.storage.remove('session', 'isSideOpen');// 개발에서 값이 삭제가 안될 경우 대비
				mm.delay.on(mm.observer.dispatch, { _time: mm.time._base, _isSec: true, _name: 'DELAY_SIDE_OPEN', _isOverwrite: true, params: [mm.event.type.stage_add, { data: { _isRemove: true } }] });

			} });

		},
		//- 사이드바 닫기
		close() {

            if (mm.history.session.pages[0]._pageUrl.includes(`utm_source=naver`)) mm.link('/', { _isReloadStage: true });
			else mm.history.back();// 메인으로 이동

		},
	};

})();
//> 사이드바

//< 상세검색
mm.filter = (function () {

	// public
	return {
		//- 상세검색 열기
		open(__url) {

			mm.modal.open(__url, { _isFull: true, openEl: document, classes: ['__modal-motion-left'], _isCloseOutside: true });

		},
		//- 상세검색 닫기
		close() {

			mm.modal.close();

		},
	};

})();
//> 상세검색

//< 성별필터
function switchGenderFilter() {

	mm.siblings(this)[0].classList.remove('__switch-on');

}
//> 성별필터

//< 상품목록 스타일변경
function toggleStyleProduct(__is) {

	var $productList = this.closest('.mm_product-list');
	if (!$productList) $productList = mm.find('.mm_product-list')[0];
	var $icon = mm.find('> i', this)[0];

	if (__is) {
		this.setAttribute('title', '1열로 보기');
		$icon.classList.remove('mco_array-card');
		$icon.classList.add('mco_array-wide');
	}
	else {
		this.setAttribute('title', '2열로 보기');
		$icon.classList.remove('mco_array-wide');
		$icon.classList.add('mco_array-card');
	}

}
//> 상품목록 스타일변경

//< 상품 찜하기
function changeLikeProduct(__is, __url, __offCallback, __offParam) {

	var $switch = this;

	// 찜하기
	if (__is) {
		mm.modal.open(__url, { _isFull: true, openEl: $switch, classes: ['__modal-motion-up'], _isCloseOutside: true, onReady: function () {

			mm.event.on(mm.find('.btn_modal-close', mm.find('iframe', this)[0])[0], 'click', function () {

				var data = mm.data.get($switch).switch;
				var onChange = data.onChange;

				data.onChange = null;
				mm.switch.off($switch);
				data.onChange = onChange;

			});

		} });
	}
	// 찜해제
	else mm.apply(__offCallback, $switch, [__offParam]);// goods.wish.delete(this.getAttribute('data-goods_idx')); 개발 적용

}
//> 상품 찜하기

//< 브랜드 찜하기 활성화
function toggleLikeBrand(__is) {

	if (__is) {
		var $likeIcon = this.children[0];

		gsap.to($likeIcon, { alpha: 0.5, scale: 0.5, duration: 0.15, ease: 'sine.out', onComplete: function () {

			gsap.set($likeIcon, { scale: 2 });
			gsap.to($likeIcon, { alpha: 1, scale: 1, duration: 0.2, ease: 'cubic.out' });

		} });
	}

}
//> 브랜드 찜하기 활성화

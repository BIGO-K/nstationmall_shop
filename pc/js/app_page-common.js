'use strict';

/**
 * 페이지 공통
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

	// 로딩 제거(크롬 페이지 뒤로가기 시 이전 링크 이동으로 생긴 로딩 제거)
	mm.event.on(window, 'unload', function (__e) {

		mm.loading.hide();

	});

})();
//< 최초(레디 전)

//< 레디
mm.ready(function () {

	// 아이프레임
	if (frameElement) {
		mm.observer.dispatch(mm.event.type.frame_ready, { data: { this: window } });

		// 컨텐츠 아이프레임 리사이즈
		if (mm._isFrame) mm.frameResize(null, { _isLoad: true });
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

	// 터치이벤트 확인
	mm.event.on(document, 'mousedown mouseup', function (__e) {

		switch (__e.type) {
			case 'mousedown':
				mm._isTouch = true;
				break;
			case 'mouseup':
				mm._isTouch = false;
				break;
		}

	});

	// a 링크
	mm.delegate.on(document, 'a[data-href]', 'click', function (__e) {

		if (this.target.toLowerCase() === 'blank') return;// target blank 제외

		// mm.data에 저장할 기본 값
		var initial = {
			openEl: this,// ? :element - 클릭한 요소
			_type: null,// ? :string - link, popup, modal, anchor, back, forward, reload
			_frameId: null,// ? :string - popup, modal을 iframe으로 노출할 때 id 값
			_frameName: null,// ? :string - popup, modal을 iframe으로 노출할 때 name 값
			// _isCloseBefore: false,// ? :boolean - type 값이 link/popup일 때 현재 팝업 요소를 닫음(교체)
			// _isLinkStage: true,// ? :boolean - type이 link일 때 true(스테이지에서 실행 mm.popup.open), false(현재 창에서 실행 location.href)
			_step: 1,// ? :number - mm.history.back/forward 이동 수
			// * 이 외 mm.link, mm.scroll.to  등에서 사용하는 변수를 추가로 적용하여 사용
		};

		var data = mm.data.get(this, 'data-href', { initial: initial });
		if (mm.is.empty(data)) data = mm.data.set(this, 'data-href', { initial: initial });
		var _attrHref = this.getAttribute('href');
		var _href = this.href;

		if (!data._type) return false;
		if (data._type === 'link') {
			if (_attrHref.replace('#', '').trim().length === 0 || _attrHref.toLowerCase().includes('javascript:')) return false;

			if (_href.split('#')[0] === location.href.split('#')[0]) data._type = 'reload';// 링크가 같으면 reload로 변경
			if (data._type === 'reload' && _href.includes('#')) data._type = 'anchor';// 링크가 같고 #이 있으면 anchor로 변경
		}

		__e.preventDefault();

		// 외부링크
		if (['link', 'popup'].includes(data._type)) {
			if (!_href.includes(location.host)) {
				// 프로토콜이 https 일 때 외부 http 경로의 iframe이 보안상 이유로 연결 안됨
				// mm.popup.open('popup_externalLink.html?url=' + _href);
				window.open(_href);// 새 창 열림
				return false;
			}
		}

		switch (data._type) {
			case 'reload':
				location.reload();// location.reload(true);
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

	// PC 사용 추가
	(function () {

		var $header = mm.find('.mm_header')[0];
		var $footer = mm.find('.mm_footer')[0];

		// flex 수직 정렬이 ie에서 적용되지 않아서 높이값을 강제로 적용 > 컨텐츠를 ajax로 로드 하면 처음 높이를 가져올 수 없어 ie 높이 무시
		// error 레이아웃에서만 적용
		if (mm.is.ie() && mm._isError) {

			var $view = mm.find('.mm_view')[0];
			var _footerHeight = ($footer) ? $footer.offsetHeight : 0;
			var _pageHeight = $view.offsetHeight - _footerHeight - parseFloat(mm.element.style($view, 'padding-top'));
			var _contentHeight = mm.find('.mm_page-content')[0].offsetHeight;

			if (_pageHeight > _contentHeight) mm.element.style('.mm_page', { 'height': '100%' });
		}

		// 이미지 썸네일(썸네일 클릭 시 이미지 변경)
		_.forEach(mm.find('.m_prodetail-thumbnail'), function (__$thumb) {

			var $thumbnail = mm.find('.image_thumbnail', __$thumb)[0];
			var $thumbImage = mm.find('.image_thumbnail img', __$thumb)[0];
			var $btnThumbs = mm.find('.btn_thumbnail', __$thumb);
			var $multiangle = mm.find('.m_prodetail-multiangle', __$thumb)[0];
			var _classOn = '__thumbnail-on';

			mm.event.on($btnThumbs, 'click', function (__e) {

				mm.class.remove($btnThumbs, _classOn);
				mm.element.attribute($btnThumbs, { 'title': '' });
				this.classList.add(_classOn);
				this.setAttribute('title', '선택됨');

				var $video = mm.find('video', $thumbnail)[0];

				if (this.classList.contains('__btn_video__')) {
					$thumbImage.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');

					if (!$video) $thumbnail.append(mm.find('video', this)[0].cloneNode(true));
					else if ($video) {
						mm.element.show($video);
						$video.play();
					}
				}
				else {
					if ($video) {
						$video.pause();
						$video.currentTime = 0;
						mm.element.hide($video);
					}

					$thumbImage.setAttribute('src', mm.data.get(mm.find('i', this)[0]).lazyload._src);
				}

				if ($multiangle && $multiangle.classList.contains('__multiangle-on')) mm.event.dispatch(mm.find('.btn_close', $multiangle)[0], 'click');

			});

			mm.event.dispatch($btnThumbs[0], 'click');

		});

		//< 리뷰상품 선택 (리뷰작성, 상품문의 모달 등에 사용)
		var $prodSelect = mm.find('.mm_product-select')[0];
		var $prodSelected = mm.find('.mm_product-select-complete', $prodSelect)[0];
		mm.event.on(mm.find('.mm_product-item', $prodSelect), 'click', function (__e) {

			__e.preventDefault();

			if (!$prodSelected) return;

			var _classSelected = '__selected-complete';
			mm.dropdown.close(this.closest('.mm_dropdown'));

			var $btnRemove = mm.element.create(mm.string.template([
				'<button type="button" class="btn_remove">',
				'   <i class="mco_remove"></i><b class="mm_ir-blind">삭제하기</b>',
				'</button>'
			]))[0];

			$prodSelected.innerHTML = '';
			$prodSelected.append(this.cloneNode(true));
			$prodSelected.append($btnRemove);

			$prodSelect.classList.add(_classSelected);

			mm.event.on($btnRemove, 'click', function (__e) {

				__e.preventDefault();

				$prodSelected.innerHTML = '';
				$prodSelect.classList.remove(_classSelected);

			});

		});
		//> 리뷰상품 선택

		if (mm._isModal) return;// 아래 스크립트는 모달에서는 사용 안함

		// 스크롤 이벤트
		var $prodList = _.filter(mm.find('.mm_product-list'), function (__$list) { return __$list.parentElement.nextElementSibling && __$list.parentElement.nextElementSibling.classList.contains('mm_filter-gender'); })[0];
		var $genderFilter = mm.find('.mm_filter-gender')[0];
		var $rankingGnb = mm.find('.m_ranking-gnb')[0];
		var $stickies = mm.find('data-horizon');

		var _headerHeight = ($header) ? $header.offsetHeight : null;
		var _classStickyHeader = '__header-sticky';
		var _classHoldFilter = '__filter-hold';
		var _classSticky = '__sticky-on';

		var $side = mm.find('.mm_sidebar')[0];
		var $sideRight = mm.find('.mm_sidebar-rside-inner', $side)[0];
		var $btnAnchors = mm.find('[class*="btn_anchor"]', $side);
		var $btnKakaoplus = mm.find('.btn_kakaoplus', $side);
		var _isShowAnchor = false;

		mm.event.on(mm.scroll.el, 'load scroll', function (__e) {

			var scrollOffset = mm.scroll.offset(this);

			if ($header) {
				if (scrollOffset.top > _headerHeight) $header.classList.add(_classStickyHeader);
				else $header.classList.remove(_classStickyHeader);
			}

			// 성별필터
			if ($genderFilter) {
				if (mm.element.offset($prodList).top > window.innerHeight * 0.5 || mm.element.offset($footer).top < document.documentElement.offsetHeight) $genderFilter.classList.add(_classHoldFilter);
				else $genderFilter.classList.remove(_classHoldFilter);
			}

			// 랭킹 gnb
			if ($rankingGnb) {
				if (mm.element.offset($rankingGnb).top - $header.offsetHeight - mm.element.offset($header).top < 0) $rankingGnb.classList.add(_classSticky);
				else $rankingGnb.classList.remove(_classSticky);
			}

			// fixed 요소 가로 스크롤 할 때 위치 이동
			if ($stickies) mm.element.style($stickies, { 'left': mm.number.unit(-scrollOffset.left) });

			// 사이드바 앵커 버튼 스크롤 할 때 노출
			if ($side) {
				if (scrollOffset.top > _headerHeight && !_isShowAnchor) {
					_isShowAnchor = true;

					gsap.to($sideRight, { height: 214, duration: 0.3, ease: 'sine.out' });
					gsap.to($btnAnchors, { autoAlpha: 1, duration: 0.2, delay: 0.2, ease: 'sine.out' });
					gsap.to($btnKakaoplus, { autoAlpha: 1, duration: 0.2, delay: 0.2, ease: 'sine.out' });
				}
				else if (scrollOffset.top < _headerHeight && _isShowAnchor) {
					_isShowAnchor = false;

					gsap.to($sideRight, { height: 76, duration: 0.3, ease: 'sine.inOut' });
					gsap.to($btnAnchors, { autoAlpha: 0, duration: 0.2, ease: 'sine.out' });
					gsap.to($btnKakaoplus, { autoAlpha: 0, duration: 0.2, ease: 'sine.out' });
				}
			}

		});

		// 화면 리사이즈 이벤트
		var _classSmall = '__sidebar-sm';

		// 사이드바 최소화(화면 최소 사이즈 1360 + 좌측 여백 106)
		if ($side) {
			mm.event.on(window, 'load resize', function (__e) {

				if (window.innerWidth <= 1360 + 106) $side.classList.add(_classSmall);
				else $side.classList.remove(_classSmall);

			});
		}

		// 헤더 검색
		(function (__$search) {

			if (!__$search) return;

			var $searchInput = mm.find('data-text', __$search)[0];// 검색어 입력창
			var $recentWord = mm.find('.mm_header-search-keyword', __$search)[0];// 최근검색어
			var $recommendWord = mm.find('.mm_header-search-auto', __$search)[0];// 추천검색어
			var $btnClose = mm.find('.btn_close', __$search)[0];
			var _classOn = '__search-on';

			// 키보드 방향키 제어
			function keyDownFocus(__e, __$el) {

				if (!__$el) return;

				__e.preventDefault();// 스크롤 움직임 방지

				mm.delay.on(function () {

					mm.class.remove(mm.find('.__over', __$search), '__over');
					__$el.classList.add('__over');

					$searchInput.value = _.last(mm.find('b:not(.text_date)', __$el)).textContent;

				});

			}

			mm.element.attribute(__$search, { 'tabindex': 0, 'style': { 'cursor': 'auto' } });

			mm.event.on($searchInput, 'click change keydown keyup', function (__e) {

				var _isKeyword = this.value.trim().length > 0;
				switch (__e.type) {
					case 'click':
					case 'keydown':
						if (__$search.classList.contains(_classOn)) return;// 이미 열려있으면 리턴

						__$search.classList.add(_classOn);
						gsap.to([$recentWord, $recommendWord], { alpha: 1, height: 550, duration: mm.time._fast, ease: 'cubic.inOut' });

						// break;
					case 'change':
						if (__e.detail && __e.detail._isUpdate === true) return;
					case 'keyup':
						if (__e.type === 'keyup' && __e.keyCode > 36 && __e.keyCode < 41) return;// 방향키

						mm.class.remove([$recommendWord, $recentWord], _classOn);
						if (_isKeyword) $recommendWord.classList.add(_classOn);
						else $recentWord.classList.add(_classOn);
						break;
				}

			});

			mm.event.on(__$search, 'keydown mouseover mouseenter mouseleave focusin focusout', function (__e) {

				var $searchOn = mm.find(mm.selector(_classOn, '.'), __$search);
				mm.delay.off('DELAY_SEARCH_CLOSE');

				switch (__e.type) {
					case 'keydown':
						if ($searchOn.length === 0) return;

						var $active = mm.find('.__over', __$search)[0] || document.activeElement;
						var $items = mm.find('li > a', $searchOn);
						var _itemIndex = mm.element.index($items, $active);
						var _isText = $active.matches('[data-text]');

						// 방향키 상
						if (__e.keyCode === 38) {
							if (_isText) return;

							if ($active.tagName !== 'A' || _itemIndex === 0) keyDownFocus(__e, $items[$items.length - 1]);
							else keyDownFocus(__e, $items[_itemIndex - 1]);
						}
						// 방향키 하
						else if (__e.keyCode === 40) {
							if ($active.tagName === 'A' && _itemIndex === $items.length - 1) keyDownFocus(__e, $items[0]);
							else keyDownFocus(__e, $items[_itemIndex + 1]);
						}
						break;
					case 'mouseover':// 리스트 아이템에 hover시 포커스
						mm.class.remove(mm.find('.__over', __$search), '__over');
						if (document.activeElement.tagName === 'A') mm.focus.in($searchInput);

						var $searchItem = __e.target.closest('a');
						if ($searchItem) $searchItem.classList.add('__over');
						break;
					// case 'mouseenter':
					// case 'focusin':
					// 	break;
					case 'mouseleave':
					case 'focusout':
						mm.delay.on(function () {

							mm.event.dispatch($btnClose, 'click');

						}, { _time: (__e.type === 'mouseleave') ? 1 : 0, _isSec: true, _name: 'DELAY_SEARCH_CLOSE', _isOverwrite: true });
						break;
				}

			});

			// 검색창 닫기
			mm.event.on($btnClose, 'click', function (__e) {

				gsap.to([$recentWord, $recommendWord], { alpha: 0, height: 0, duration: mm.time._faster, ease: 'quart.out',
					onComplete: function () {

						mm.class.remove([__$search, $recentWord, $recommendWord], _classOn);

					},
				});

			});

		})(mm.find('.mm_header-search')[0]);

		// 헤더 인기 검색어 자동 롤링
		(function (__$popular) {

			if (!__$popular) return;

			var $popularItems = mm.find('ol > li', __$popular);
			var _index = 0;
			var popularInterval;

			function popularAutoPlay() {

				popularInterval = setInterval(function () {

					gsap.fromTo($popularItems[_index], { y: '0%' }, { y: '-100%', duration: 0.3, ease: 'sine.inOut' });

					_index = (_index === $popularItems.length - 1) ? 0 : _index + 1;
					gsap.fromTo($popularItems[_index], { y: '100%' }, { y: '0', duration: 0.3, ease: 'sine.inOut' });

				}, 4000);

			}

			popularAutoPlay();

			mm.observer.on(__$popular, 'SEARCH_POPULAR_CHANGE', function (__e) {

				if (__e.detail._is) {
					gsap.killTweensOf($popularItems);
					clearInterval(popularInterval);
					mm.element.style($popularItems, { 'transform': '' });
				}
				else {
					_index = 0;
					popularAutoPlay();
				}

			});

		})(mm.find('.mm_header-popular')[0]);

		// 헤더 카테고리 메뉴 컨트롤
		var $cate = mm.find('.mm_catemenu')[0]
		var $cateBox = mm.find('.mm_catemenu-item > nav', $cate)[0];
		var $cateList = mm.find('> ul', $cateBox)[0];
		var $cateItems = mm.find('> li', $cateList);
		var _classCateOn = '__catemenu-on';
		var _cateMoveHeight;
		var _cateLimit;

		mm.event.on($cateBox, 'mouseenter mouseleave', function (__e) {

			switch (__e.type) {
				case 'mouseenter':
					_cateLimit = $cateList.children[0].offsetHeight;
					_cateMoveHeight = $cateList.offsetHeight - $cateBox.offsetHeight;

					if (_cateMoveHeight > 0 && !__e.target.closest('.mm_catemenu-item-depth')) {
						mm.event.on($cateBox, 'mousemove', function cateMouseMoveHandler(__e) {

							if (__e.target.closest('.mm_catemenu-item-depth')) return;

							var _ratioY = (__e.clientY - mm.element.offset($cateBox).top - _cateLimit) / ($cateBox.offsetHeight - _cateLimit * 2);
							_ratioY = Math.max(0, Math.min(_ratioY, 1));
							gsap.to($cateList, { 'margin-top': -_cateMoveHeight * _ratioY, duration: 0.4, ease: 'quad.out' });

						});
					}
					break;
				case 'mouseleave':
					mm.event.off($cateBox, 'mousemove', 'cateMouseMoveHandler');
					break;
			}

		});

		mm.event.on($cateItems, 'mouseenter mouseleave', function (__e) {

			var $btn = mm.find('> a', this)[0];
			var $subBox = mm.find('> .mm_catemenu-item-depth', this)[0];

			if ($subBox.contains(__e.target)) return;

			switch (__e.type) {
				case 'mouseenter':
					$btn.classList.add(_classCateOn);
					gsap.to($cateBox, { width: $btn.offsetWidth + $subBox.offsetWidth, duration: mm.time._base, ease: 'sine.inOut', overwrite: true });
					break;
				case 'mouseleave':
					$btn.classList.remove(_classCateOn);
					gsap.to($cateBox, { width: $btn.offsetWidth, duration: mm.time._fast, delay: 0.1, ease: 'sine.inOut', overwrite: true });
					break;
			}

		});

		// 카테고리 메뉴 마우스 컨트롤(숨김)
		mm.observer.on($cate, 'CATE_MENU_SWITCH', function (__e) {

			if ($cate.classList.contains('__switch-on')) {
				mm.event.on($cate, 'mouseenter mouseleave', function cateMouseHandler(__e) {

					switch (__e.type) {
						case 'mouseenter':
							mm.delay.off('DELAY_CATE_OFF');
							break;
						case 'mouseleave':
							mm.delay.on(function () {

								mm.switch.off(mm.find('.btn_catemenu', $cate));
								mm.event.off($cate, 'mouseenter mouseleave', cateMouseHandler);

							}, { _time: 500, _name: 'DELAY_CATE_OFF', _isOverwrite: true });
							break;
					}

				});
			}
			else mm.event.off($cate, 'mouseenter mouseleave', 'cateMouseHandler');

		});

		// 최근본상품 마우스 컨트롤(숨김)
		var $recent = mm.find('.mm_header-quick-recent')[0];
		mm.observer.on($recent, 'RECENT_SWITCH', function (__e) {

			if ($recent.classList.contains('__switch-on')) {
				mm.event.on($recent, 'mouseenter mouseleave', function cateMouseHandler(__e) {

					switch (__e.type) {
						case 'mouseenter':
							mm.delay.off('DELAY_RECENT_OFF');
							break;
						case 'mouseleave':
							mm.delay.on(function () {

								mm.switch.off(mm.find('.btn_recent', $recent));
								mm.event.off($recent, 'mouseenter mouseleave', cateMouseHandler);

							}, { _time: 500, _name: 'DELAY_RECENT_OFF', _isOverwrite: true });
							break;
					}

				});
			}
			else mm.event.off($recent, 'mouseenter mouseleave', 'cateMouseHandler');

		});

	})();

});
//> 레디

//< 로드
mm.load(function () {

	// 팝업 리사이즈
	if (mm._isPopup) mm.popup.resize();
	else if (mm._isModal) mm.modal.resize({ _isLoad: true });

	// 컨텐츠 아이프레임 리사이즈
	if (mm._isFrame) mm.frameResize(null, { _isLoad: true });

	// 익스/엣지 브라우저에서 새로고침 할 때 라디오/체크박스의 기존 선택을 물고있는거나 날려버리는 이슈가 있어 초기화 후 재연결
	if (mm.is.ie()) {
		var $checked = mm.find('[checked]');
		_.forEach($checked, function (__$check) {

			__$check.checked = true;

		});

		mm.form.update($checked);// mm.delay 필요?
	}

	// mm을 수정하지 못하도록 적용
	Object.freeze(mm);

});
//> 로드

//< 상품 찜하기
function changeLikeProduct(__is, __url, __offCallback, __offParam) {

	var $switch = this;

	// 찜하기
	if (__is) {
		mm.modal.open(__url, { openEl: $switch, onReady: function () {

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

		gsap.to($likeIcon, { alpha: 0.3, scale: 0.3, duration: 0.15, ease: 'sine.out', onComplete: function () {

			gsap.set($likeIcon, { scale: 1.5 });
			gsap.to($likeIcon, { alpha: 1, scale: 1, duration: 0.2, ease: 'cubic.out' });

		} });
	}

}
//> 브랜드 찜하기 활성화

//< 성별필터
function switchGenderFilter() {

	mm.siblings(this)[0].classList.remove('__switch-on');

}
//> 성별필터

//< 인기검색어 스위칭
function searchPopularChange(__is) {

	mm.observer.dispatch('SEARCH_POPULAR_CHANGE', { _isLocal: true, data: { _is: __is } });

}
//> 인기검색어 스위칭
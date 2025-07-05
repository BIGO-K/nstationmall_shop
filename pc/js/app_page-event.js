/**
 * 기획전, 콜라보
 * * vue 실행 시점 이슈로 외부에서 실행할 수 있게 object 구조로 적용
**/

//< 기획전
mm.pageEvent = (function () {

	// UI 고유 객체
	var base = {
		// 연결
		init: function () {

			// 유튜브 동영상을 소스로 등록하면 구조 변경
			_.forEach(mm.find('iframe'), function(__$iframe) {

				if (!(__$iframe.getAttribute('src'))) return;

				if (__$iframe.getAttribute('src').includes('youtube') && __$iframe.closest('.image_banner') && !__$iframe.parentElement.classList.contains('m__detail-media')) {
					mm.element.wrap(__$iframe, 'div');
					__$iframe.parentElement.classList.add('m__detail-media');
				}

			});

			// 리스트 앵커
			var $lists = mm.find('.mm_event-list');
			var $anchor = mm.find('.mm_event-anchor')[0];
			if ($lists.length === 0 || !$anchor) return;

			var $header = mm.find('.mm_header')[0];
			var $btnAnchors = mm.find('a', $anchor);
			var _classSticky = '__anchor-sticky';
			var _classOn = '__anchor-on';
			var _anchorHeight = parseFloat(mm.element.style(mm.find('ul', $anchor)[0], 'height'));

			// 상품 앵커 메뉴 높이값 셋팅
			mm.element.style($anchor, { 'height': mm.number.unit(_anchorHeight) });

			function scrollEventHandler() {

				if (mm.element.offset($anchor).top - $header.offsetHeight - mm.element.offset($header).top < 0) $anchor.classList.add(_classSticky);
				else $anchor.classList.remove(_classSticky);

			}

			mm.event.off(mm.scroll.el, 'scroll', scrollEventHandler);
			mm.event.on(mm.scroll.el, 'scroll', scrollEventHandler);
			scrollEventHandler();

			// 스크롤 구간 상품섹션 변경
			mm.intersection.on($lists, function (__entry, __is) {

				if (__is) {
					mm.class.remove($btnAnchors, _classOn);
					mm.element.attribute($btnAnchors, { 'title': '' });

					var $btn = $btnAnchors[mm.element.index($lists, __entry.target)];
					mm.class.add($btn, _classOn);
					mm.element.attribute($btn, { 'title': '선택됨' });
				}

			}, {
				config: {
					rootMargin: '-35% 0px -65% 0px',// 요소의 상단이 스크롤 높이의 35%
					threshold: [0, 1],// 요소의 시작과 끝 모두 감지
				}
			});

			// 상품 앵커 이동
			mm.event.off($btnAnchors, 'click', 'clickInlineHandler');
			mm.event.on($btnAnchors, 'click', function clickInlineHandler(__e) {

				__e.preventDefault();

				mm.scroll.to(this.getAttribute('href'), { _margin: _anchorHeight });

			});

		},
	};

	// private
	(function () {

		base.init();

	})();

	// public
	return {
		// 이벤트 연결
		update: function () {

			base.init();

		},
	};

})();
//> 기획전
'use strict';

/**
 * 스테이지
**/

mm.stage = (function () {

	// UI 고유 객체
	var base = {
		pages: [],// 생성된 페이지(팝업) 목록
		// 아이프레임 링크 변경
		replaceIframe() {

			var state = mm.history.state;
			var $window = mm.find('iframe', base.pages[state._pageIndex - state._keepIndex])[0].contentWindow;

			$window.mm.history.replace(mm.history.states, top.location.href, { _isTop: false });
			// $window.location.reload();// 미들웨어에서 새로고침 되면서 스테이지를 하나 더 불러오는 이슈로 replace로 변경
			$window.location.replace(top.location.href.split('#')[0]);

		},
		// 페이지 추가
		addStage(__sessionPage, __option) {

			mm.popup.open(__sessionPage._pageUrl, mm.extend({ _isHistorySave: false }, __option));

		},
		// 페이지 삭제
		removeStage() {

			var $removePages = base.pages.splice(mm.history.state._pageIndex + 1);
			mm.element.remove($removePages);

			// base.pages에 없는 찌꺼기 요소 삭제
			var $items = Object.values(mm.find('.mm_popup-item'));
			var $pages = _.compact(base.pages);
			_.forEach($items, function (__$item) {

				if (!$pages.includes(__$item)) __$item.remove();

			});

		},
		// 페이지 정렬(페이지 숨김)
		sortStage(__isAdd) {

			mm.delay.on(function () {

				var state = mm.history.state;

				mm.element.remove('.m_product-clone');
				mm.element.hide(_.reject(base.pages, function (__$page, __index) { return __index >= state._pageIndex - state._keepIndex; }));

				mm.element.show(base.pages[state._pageIndex - state._keepIndex]);// 현재 페이지 노출

			}, { _time: (__isAdd) ? mm.time._base : 0, _isSec: true, _name: 'DELAY_SORT_HIDE', _isOverwrite: true });// 상품 이미지 클론 삭제(링크, 뒤로가기)

		},
		// keep을 제외한 pageType을 가진 가까운 sessionPage 찾기
		findNotKeepIndex(__sessionPage, __index) {

			var takePages = _.take(mm.history.session.pages, __index + 1);
			return _.findLastIndex(takePages, function (__page) { return __page._pageType !== 'keep'; });

		},
	};

	// private
	(function () {

		mm._isStage = true;

		var _directUrl = mm.storage.get('session', 'directPage');
		if (!_directUrl) _directUrl = mm._mainUrl;

		mm.storage.remove('session', 'directPage');

		// 첫 페이지
		// * 모든 페이지는 stage를 통해 노출되고, 페이지로 직접 접속하면 세션에 담아 스테이지로 보냅니다.
		var stateBackup = mm.storage.get('session', 'stateBackup');
		var _sessionIndex = (stateBackup) ? stateBackup._sessionIndex : null;
		var _isNewSession = true;

		// 이전 세션으로 연결
		var session = mm.history.session;
		var sessionHistory = (mm.is.empty(session)) ? null : session.histories[_sessionIndex];
		if (Number.isFinite(_sessionIndex) && sessionHistory && _directUrl === sessionHistory.pages[sessionHistory._stageIndex]._pageUrl) {
			_isNewSession = false;
			mm.history.state = stateBackup;
			mm.history.replace(stateBackup, _directUrl);
		}
		// 새로운 세션으로 연결
		else {
			// 새로운 세션으로 연결
			if (!session.histories) session.histories = [];
			session.histories.push({});

			_sessionIndex = session.histories.length - 1;
			session.histories[_sessionIndex] = {
				_stageIndex: 0,// ? :number - _pageIndex와 비교하여 히스토리 이동 방향 확인(popstate back/forward)
				_isReloadStage: false,// ? :boolean - 홈으로 이동 시 새로고침
				pages: [{
					changes: [],// ? :array - iframe 내부에서 서브밋 등으로 변경되는 url 배열
					_pageUrl: mm._mainUrl,// ? :string - 페이지 url
					_pageType: 'main',// ? :string - main(x), sub(<), side(>), product(o), popup(^), search(^), keep(x)
				}],
			};

			mm.history.session = session;
			mm.history.replace({ _isNew: true, _sessionIndex: _sessionIndex, _pageIndex: 0, _keepIndex: 0 }, mm._mainUrl);

			if (_directUrl === mm._mainUrl) _isNewSession = false;
		}

		mm.popup.open(_directUrl, { _isHistorySave: _isNewSession, onReady: () => {
            setTimeout(() => {
                if (location.search.includes(`utm_source=naver`)) {
                    const session = mm.history.session;
                    if (mm.history.state._pageIndex === 1 && _isNewSession) top.history.back();
                    else mm.history.state._pageIndex = 0;
                    session.pages[0] = session.page;
                    top.mm.history.session = session;
                }
            }, 500);
        } });

		// 히스토리 변경
		mm.event.on(window, 'popstate', function (__e) {

			var state = mm.history.state;
			var session = mm.history.session;
			var sessionHistory = session.history;
			var _beforeIndex = sessionHistory._stageIndex;// 히스토리 이동 전 페이지 인덱스
			var _isReloadStage = sessionHistory._isReloadStage;// 메인 뒤로가기 시 새로고침
			var currentSessionPage = session.pages[state._pageIndex];
			var beforeSessionPage = session.pages[_beforeIndex];

            if (beforeSessionPage._pageUrl.includes(`utm_source=naver`) && mm.history.state._pageIndex === 0) {
                mm.history.replace(state, beforeSessionPage._pageUrl);
                return;
            }

			// 세션 값 초기화
			sessionHistory._stageIndex = state._pageIndex;
			sessionHistory._isReloadStage = false;
			mm.history.session = session;

			mm.storage.set('session', 'stateBackup', state);// 새로고침 비교를 위한 세션 저장

			// popstate 적용 안함
			// 팝업 닫기와 삭제는 직접 적용 필요
			if (mm.storage.get('session', 'isCancelPopstate') === true) {
				mm.storage.remove('session', 'isCancelPopstate');
				return;
			}

			mm.modal.close();

			// back
			if (state._pageIndex < _beforeIndex) {
				// pageType keep으로 변경
				if (beforeSessionPage._pageType === 'keep' && base.findNotKeepIndex(currentSessionPage, state._pageIndex) === base.findNotKeepIndex(beforeSessionPage, _beforeIndex)) {
					base.replaceIframe();
				}
				else {
					// 저장된 요소가 있으면 노출
					if (base.pages[state._pageIndex - state._keepIndex]) {
						base.sortStage();
						mm.popup.close({ _isHistoryBack: true });
						mm.loading.hide();// 안드로이드 물리키 뒤로가기 이슈로 로딩 삭제

						if (session.pages[state._pageIndex + 1]._pageType === 'keep') base.replaceIframe();// 현재 다음 pagetype이 keep 일 때 화면전환 적용
					}
					// 저장된 요소가 없으면 생성
					else {
						// 현재 pageType이 keep 일 때 히스토리가 여러 단계(mm.history.back(2))로 건너뛰어 생성되면 모션 방향은 현재 페이지 기준으로 적용(keep은 같은 레이아웃끼리 이동해야 함)
						// 만약 keep이 sub > popup 레이아웃으로 바뀌는 구조에서는 뒤로가기 시 sub여도 생성된 popup기준으로 적용되어 아래로 사라짐에 주의
						base.addStage(currentSessionPage, { _isHistoryBack: true });
					}
				}

				if (_isReloadStage && session.page._pageType === 'main') location.reload();// 전체 새로고침
			}
			// forward
			else {
				// pageType keep 변경
				if (currentSessionPage._pageType === 'keep' && base.findNotKeepIndex(currentSessionPage, state._pageIndex) === base.findNotKeepIndex(beforeSessionPage, _beforeIndex)) {
					base.replaceIframe();
				}
				else {
					// 현재 pageType이 keep 일 때 히스토리가 여러 단계(mm.history.forward(2))로 건너뛰어 생성되면 모션 방향은 현재 페이지 기준으로 적용(keep은 같은 레이아웃끼리 이동해야 함)
					// 만약 keep이 sub > popup 레이아웃으로 바뀌는 구조에서는 뒤로가기 시 sub여도 생성된 popup기준으로 적용되어 아래로 사라짐에 주의
					base.addStage(currentSessionPage);
				}
			}

		});

		// 커스텀이벤트
		mm.observer.on(window, mm.event.type.stage_add, function (__e) {

			mm.delay.on(function () {

				var $page = mm.find('.mm_popup-item.__popup-on')[0];
				if ($page) {
					// ~ 퍼포먼스에 따라 생성된 페이지를 추가 후 n개 이전 요소를 숨기는 방법 변경(현재 display none 적용)
					base.pages[mm.history.state._pageIndex] = $page;
					base.sortStage(true);

					if (__e.detail._isRemove === true) base.removeStage();
				}

			}, { _name: 'DELAY_STAGE_ADD', _isOverwrite: true });

		});
		mm.observer.on(window, mm.event.type.stage_remove, function (__e) {

			base.removeStage();

		});

	})();

	// public
	return {
		//- 스테이지에 저장된 페이지 전체
		get pages() {

			return base.pages;

		},
		//- 현재 활성화된 페이지
		get activePage() {

			var state = mm.history.state;
			return base.pages[state._pageIndex - state._keepIndex];

		},
	};

})();

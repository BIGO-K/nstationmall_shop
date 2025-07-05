'use strict';

/**
 * 상품상세
 * (프레임)
**/

//< 레디
mm.ready(function () {

	// 상품 상세정보 태그/속성 정리
	_.forEach(mm.find('.m_prodetail-frame-info'), function (__$el) {

		// 불필요한 태그 삭제
		mm.element.remove(mm.find('link', __$el));
		// mm.element.unwrap(mm.find('a', __$el));// a링크 내부 링크 연결을 위해 허용, data-href 속성은 개발에서 내부 경로에만 적용

		// 이미지에 사용자가 등록한 이미지 속성 제거
		_.forEach(mm.find('img'), function (__$img) {

			var attr = { style: { 'width': 'auto', 'max-width': '100%' } };
			_.forEach(__$img.attributes, function (__key) {

				if (!['id', 'class', 'src', 'alt', 'usemap'].includes(__key.name) && !__key.name.startsWith('data-')) attr[__key.name] = '';// usemap은 pc에서만 허용

			});
			mm.element.attribute(__$img, attr);

		});

		// 이미지를 제외한 width 속성 제거(style 제외)
		_.forEach(mm.find('[width]'), function (__$item) {

			mm.element.attribute('[width]', { 'width': '' });

		});

		// 유튜브 가변 사이즈 구조 적용
		_.forEach(mm.find('iframe'), function(__$iframe) {

			if (__$iframe.getAttribute('src').includes('youtube') && !__$iframe.parentElement.classList.contains('m__info-media')) {
				mm.element.wrap(__$iframe, 'div');
				__$iframe.parentElement.classList.add('m__info-media');
			}

		});

		// ERP에서 삽입된 font, center 태그를 P태그로 변경
		_.forEach(mm.find(mm.selector(['font', 'center']), __$el), function (__$tag) {

			mm.element.wrap(__$tag, 'p');
			mm.element.unwrap(__$tag);

		});

		// 프리로드(오류 이미지 삭제)
		_.forEach(mm.find('[data-lazyload], [data-preload]'), function (__$loader) {

			var _isLazy = __$loader.hasAttribute('data-lazyload');
			var data = mm.data.get(__$loader);
			data = (_isLazy) ? data.lazyload : data.preload;

			data._isPass = false;
			data._isErrorImage = false;
			data.onComplete = mm.frameResize;
			data.onError = function () {

				mm.element.remove([this.closest('figure, li, i'), this]);
				mm.frameResize();

			}

			mm.apply(mm.string.template('mm.${UI}.update', { UI: (_isLazy) ? 'lazyload' : 'preload' }), null, [__$loader]);

		});


	});

});

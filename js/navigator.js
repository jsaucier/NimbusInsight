// <reference path="_references.js" />

window.nimins.navigator = (function (nimins, $, undefined) {
	/// <param name="nimins" type="nimins"></param>
	/// <param name="$" type="jQuery"></param>
	/// <param name="undefined" type="undefined"></param>
	/// <returns type="nimins.navigator"></returns>

	var me = {
		/// <field name="isMobile" type="Boolean">Gets or sets whether this is a mobile device.</var>
		isMobile: false,
		/// <field name="click" type="String">Gets or sets the event type for user interactions.</var>
		click: 'click',
		/// <field name="mousedown" type="String">Gets or sets the event type for user interactions.</var>
		mousedown: 'mousedown',
		/// <field name="mouseup" type="String">Gets or sets the event type for user interactions.</var>
		mouseup: 'mouseup',
		/// <field name="type" type="String">Gets or sets the navigator type.</field>
		type: 'desktop',

		initialize: function () {
			/// <summary>Initializes the navigator settings.</summary>
			if ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) === true) {
				me.isMobile = true;
				me.click = 'touchstart';
				me.mousedown = 'touchstart';
				me.mouseup = 'touchend';

				if ((/iPhone/i.test(navigator.userAgent)) === true) {
					me.type = 'iPhone';
				}
				else if ((/iPad/i.test(navigator.userAgent)) === true) {
					me.type = 'iPad';
				}

				/// Turn off jQuery animations.
				$.fx.off = true;
			}

			$('body').addClass(me.type);
		},

		action: function (selectors, callback) {
			/// <summary>Creates event handlers for either click or touch depending on the machines capabilities.</summary>
			/// <param name="selectors" type="String">The jQuery selectors to apply the events towards.</param>
			/// <param name="callback" type="Function">The callback function.</param>
			$(document).on('click touchstart', selectors, function (e) {
				if (me.isMobile !== true && e.type === 'click') {
					callback.call($(this), e);
				}

				if ('ontouchstart' in window && e.type === 'touchstart') {
					$(this).tap(e, callback);
				}
			});
		},

		actionDown: function (selectors, callback) {
			/// <summary>Creates event handlers for either click or touch depending on the machines capabilities.</summary>
			/// <param name="selectors" type="String">The jQuery selectors to apply the events towards.</param>
			/// <param name="callback" type="Function">The callback function.</param>
			$(document).on('mousedown touchstart', selectors, function (e) {
				e.preventDefault();
				
				if (me.isMobile !== true && e.type === 'mousedown') {
					callback.call($(this), e);
				}

				if ('ontouchstart' in window && e.type === 'touchstart') {
					$(this).tap(e, callback);
				}
			});
		}
	};

	$(function () {
		
		$(document).on('focus blur', 'div[contenteditable="true"], input, textarea', function () {
			if (me.isMobile === true) {
				setTimeout(function () {
					$(window).scrollTop(1);

					var hasKeyboard = $(window).scrollTop() > 0;

					if (hasKeyboard === true) {
						// Add the class to the body
						$('body').addClass('keyboard');
					}
					else {
						// Remove the class from the body
						$('body').removeClass('keyboard');
					}

					$(window).scrollTop(0);
				});
			}
		});
	});

	return me;

})(window.nimins, window.jQuery);
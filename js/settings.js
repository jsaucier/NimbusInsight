// <reference path="_references.js" />

window.nimins.settings = (function (nimins, $, undefined) {
	/// <param name="nimins" type="nimins"></param>
	/// <param name="$" type="jQuery"></param>
	/// <param name="undefined" type="undefined"></param>
	/// <returns type="nimins.settings"></returns>

	var me = {
		
		/// <field name="defaults" type="Object">The default settings.</field>
		defaults: {
			study: {
				side0: {
					value: 'One',
					values: ['One', 'Two', 'Three']
				},
				side1: {
					value: 'Two',
					values: ['One', 'Two', 'Three']
				},
				side2: {
					value: 'Three',
					values: ['One', 'Two', 'Three']
				},
				order: {
					value: 'Ordered',
					values: ['Ordered', 'Random']
				},
				animation: {
					value: 'Fade',
					values: ['Fade', 'Flip', 'None']
				},
				progressDisplay: {
					value: 'Visible',
					values: ['Visible', 'Hidden', 'Fade']
				},
				progressSide: {
					value: 'Top',
					values: ['Left', 'Right', 'Top', 'Bottom']
				},
				progressFill: {
					value: 'None',
					values: ['None', 'Color']
				},
			}
		},
		
		load: function () {
			/// <summary>Loads the settings from the local storage.</summary>

			var settings = JSON.parse(localStorage.getItem('nimins.settings')) || {
				study: {}
			};

			$.each(me.defaults, function (modKey, module) {
				$.each(module, function (key, setting) {
					me[modKey][key] = settings[modKey][key] || setting.value;

					$('#settings button.' + key)
						.removeClass(setting.values.join(' ').toLowerCase())
						.addClass(me[modKey][key].toLowerCase())
						.text(me[modKey][key]);
				});
			});
		},

		save: function () {
			/// <summary>Saves the settings.</summary>

			var settings = {};

			$.each(me.defaults, function (key) {
				settings[key] = me[key];
			});

			localStorage.setItem('nimins.settings', JSON.stringify(settings));
		},

		set: function (button, module, key) {
			/// <summary>Sets the setting value.</summary>
			/// <param name="button" type="jQuery">The button to set the value.</param>
			/// <param name="module" type="String">The module to set the setting.</param>
			/// <param name="key" type="String">The setting key to set.</param>
			/// <param name="value" type="String">The value of the setting.</param>

			// Animate the button.
			nimins.animate(button, 'animate-flash-gray', 500);

			/// <var name="values" type="Array"/>
			var values = me.defaults[module][key].values;

			// Get the current value
			var index = values.indexOf(me[module][key]) + 1;

			if (index >= values.length) {
				index = 0;
			}

			var value = me.defaults[module][key].values[index];

			button.removeClass(values.join(' ').toLowerCase()).addClass(value.toLowerCase()).text(value);
			me[module][key] = value;
			
			if (module === 'study') {
				if (key === 'order') {
					nimins.study.shuffle();
					nimins.study.showCard();
				}
				else {
					nimins.study.loadSettings();
				}
			}

			// Save the settings.
			me.save();
			
			// Load the settings into study mode
			nimins.study.loadSettings();
		},

		study: {}
	};

	$(function () {
		// Load the settings
		me.load();
		
		nimins.navigator.action('#study #settings button.confirm', function () {
			nimins.animate($('#study #settings'), 'animate-fade-out', 500, {
				after: function () {
					$('#study #settings').hide();
				}
			});
		});
	
		// Order Button Click Handler.
		nimins.navigator.action('#study #settings button.order', function () {
			me.set($(this), 'study', 'order');
		});
	
		// Animation Button Click Handler.
		nimins.navigator.action('#study #settings button.animation', function () {
			me.set($(this), 'study', 'animation');
		});
		
		// Side One Button Click Handler.
		nimins.navigator.action('#study #settings button.side0', function () {
			me.set($(this), 'study', 'side0');
		});
		
		// Side Two Button Click Handler.
		nimins.navigator.action('#study #settings button.side1', function () {
			me.set($(this), 'study', 'side1');
		});
		
		// Side Three Button Click Handler.
		nimins.navigator.action('#study #settings button.side2', function () {
			me.set($(this), 'study', 'side2');
		});
		
		// Progress Display Button Click Handler.
		nimins.navigator.action('#study #settings button.progressDisplay', function () {
			me.set($(this), 'study', 'progressDisplay');
		});
		
		// Progress Align Button Click Handler.
		nimins.navigator.action('#study #settings button.progressSide', function () {
			me.set($(this), 'study', 'progressSide');
		});
		
		// Progress Fill Button Click Handler.
		nimins.navigator.action('#study #settings button.progressFill', function () {
			me.set($(this), 'study', 'progressFill');
		});
	});

	return me;
})(window.nimins, window.jQuery);
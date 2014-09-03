/// <reference path="../scripts/_references.js" />

/*
	Allow user to save a 'session' which can be picked on any device to load stats for every card
	Move / Copy cards to different sets
	Combine sets into one
	Make a copy of a set.
	Resume study mode
	Import and export from dropbox using saver and chooser
	Import and export as .txt or .json
	auto scroll cards when added, if they are local, or if the remote user is scrolled to the bottom already
	scroll to card being editted
*/

// #region Object extensions.

(function ($) {
	$.fn.swipe = function (event, callback) {
		return $(this).each(function () {
			var element = $(this);

			event = event.originalEvent || event;

			var startX = event.targetTouches[0].pageX;
			var startY = event.targetTouches[0].pageY;
			var endX = startX;
			var endY = startY;
			
			element.bind('touchmove', function (event) {
				event = event.originalEvent || event;

				endX = event.targetTouches[0].pageX;
				endY = event.targetTouches[0].pageY;
			});

			element.bind('touchend', function () {
				var direction;

				if (startX - 40 > endX) {
					direction = 'left';
				}
				else if (startX + 40 < endX) {
					direction = 'right';
				}
				else if (startY - 40 > endY) {
					direction = 'up';
				}
				else if (startY + 40 < endY) {
					direction = 'down';
				}

				if (direction !== undefined && typeof (callback) === 'function') {
					// Turn off the event listeners.
					element.unbind('touchstart');
					element.unbind('touchmove');
					element.unbind('touchend');

					event.direction = direction;

					// Run the callback.
					callback.call(element, event);
				}
			});
		});
	};
}(jQuery));

(function ($) {
	$.fn.tap = function (event, callback) {
		return $(this).each(function () {
			var element = $(this), isTouch = true;

			element.bind('touchmove', function () {
				isTouch = false;
			});

			element.bind('touchend', function () {
				if (isTouch === true &&	typeof (callback) === 'function') {
					// Turn off the event listeners.
					element.unbind('touchstart');
					element.unbind('touchmove');
					element.unbind('touchend');

					// Run the callback.
					callback.call(element, event);
				}
			});
		});
	};
}(jQuery));

(function ($) {
    $.fn.cssFade = function (fadeType, callback) {
        
        var timers = $.fn.cssFade.timers || {};
        
        return $(this).each(function () {
            
            var element = $(this);
            var timer = timers[element.selector];
            var css = 'animate-fade-' + fadeType;
            
            // Clear the animation timer.
            clearTimeout(timer);
            
            // Ensure the antimation isn't currently on the element.
            element.remove(css);
            
            // Add the animation to the element with a slight delay so the browser
            // can have a chance to register if we had to remove it beforehand.
            setTimeout(function () {
                // Add the css class to the element.
                element.addClass(css);
                
                if (fadeType === 'in') {
                    // Ensures the element is visible and ready to fade in.
                    element.css('opacity', 0).show();
                }
            });
            
            timer = setTimeout(function () {
                element.removeClass(css);
                
                if (fadeType === 'in') {
                    // Removes the opacity setting after fade in has finished.
                    element.css('opacity', '');
                }
                else if (fadeType === 'out') {
                    // Ensures the element is hidden after the fade out has finished.
                    element.hide();
                }
                
                if (typeof(callback) === 'function') {
                    // Call our callback.
                    callback.call(element);
                }
            }, 500);
        });
    };
}(jQuery));
   
jQuery.fn.removeAttributes = function () {
	return this.each(function () {
		var attributes = $.map(this.attributes, function (item) {
			return item.name;
		});

		var element = $(this);
		$.each(attributes, function (i, item) {
			element.removeAttr(item);
		});
	});
};

String.prototype.format = function () {
	var args = arguments;
	return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
		if (m === "{{") {
			return "{";
		}
		if (m === "}}") {
			return "}";
		}
		return args[n];
	});
};

// #endregion

window.nimins = (function () {

	/// <var name='me' type='nimins'/>
	var me = {
		/// <field name='appName' type='String'>Gets or sets the name of the application.</field>
		appName: 'Nimbus Insight',
		/// <field name='showHint' type='Boolean'>Gets or sets whether to show the cards hint side.</field>
		showHint: false,
		/// <field name='dropbox' type="Dropbox.Client">The Dropbox client.</field>
		dropbox: new Dropbox.Client({ key: 'q19ghh8b1mlg8bz' }),
		/// <field name='animationTimers', type='Object'>The animation timers object.</field>
		animationTimers: {},

		animate: function (element, className, duration, callbacks) {

			/// Clear the animation timer
			clearTimeout(me.animationTimers[element.selector]);

			/// Ensure the animation isn't currently on the element.
			element.removeClass(className);

			/// Add the animation to the element with a slight delay so the
			/// browser can have a chance to register if we had to remove it
			/// previously.
			setTimeout(function () {
				element.addClass(className);

				/// Call our before callback.
				if (callbacks !== undefined &&
					typeof (callbacks.before) === 'function') {
					callbacks.before();
				}
			});

			/// Remove the animation after the set duration.
			me.animationTimers[element.selector] = setTimeout(function () {
				/// Call the after callback before we remove the class.
				if (callbacks !== undefined &&
					typeof (callbacks.after) === 'function') {
					callbacks.after();
				}

				/// Remove the animation.
				element.removeClass(className);
			}, duration);
		},

		animateFadeInSimple: function (element) {
			console.trace('animateFadeInSimple has been depreciated - use .cssFade("in")');
			element.cssFade('in');
		},

		animateFadeOutSimple: function (element) {
			console.trace('animateFadeOutSimple has been depreciated - use .cssFade("out")');
			element.cssFade('out');
		},

		dialog: function (options) {
			/// <summary>Shows a dialog window.</summary>
			/// <param name="options" type="Object">The options to configure the dialog window.</param>

			// Default undefined type as an alert.
			options.type = options.type || 'alert';

			// Default undefined input type as input.
			options.input = options.input || 'input';

			// Set the dialog title
			$('#dialog .title').html(options.title);

			// Set the dialog message
			$('#dialog .message').html(options.message);

			// Hide the inputs.
			$('#dialog input').hide();
			$('#dialog textarea').hide();

			// Show the dialog input
			if (options.type === 'prompt') {
				$('#dialog ' + options.input).val(options.value);
				$('#dialog ' + options.input).show();
			}

			// Hide the buttons and only show them if we need to.
			$('#dialog .button').hide();

			// Unbind the click event.
			$('#dialog .button').off(me.navigator.click);

			// Display the confirm button if confirmCallback is defined.
			if (options.confirm !== undefined) {
				// Show the confirm button.
				$('#dialog .confirm').show();

				// Confirm click handler
				$('#dialog .confirm').one(me.navigator.click, function () {
					// <summary>The confirm callback function.</summary>

					// Set the return value
					var ret = true;

					// Return undefined if not a prompt
					if (options.type === 'prompt') {
						ret = $('#dialog ' + options.input).val();
					}

					// Delay the click handler slightly to allow for dialogs to pop up one after another.
					setTimeout(function () {
						// Hide the dialog
						$('#dialog').cssFade('out');

						if (typeof (options.confirm) === 'function') {
							// Execute the callback
							options.confirm(ret);
						}
					});
				});
			}

			// Display the cancel button if cancelCallback is defined.
			if (options.cancel !== undefined) {
				// Show the confirm button.
				$('#dialog .cancel').show();

				// Confirm click handler
				$('#dialog .cancel').one(me.navigator.click, function () {
					// Delay the click handler slightly to allow for dialogs to pop up one after another.
					setTimeout(function () {
						// Hide the dialog
						$('#dialog').cssFade('out');

						if (typeof (options.cancel) === 'function') {
							// Execute the callback
							options.cancel();
						}
					});
				});
			}

			// Show the dialog window
			$('#dialog').cssFade('in', function () {
				// Focus the prompt
				if (options.type === 'prompt') {
					setTimeout(function () {
						$('#dialog ' + options.input).focus();
					});
				}
			});
		},

		toggleHint: function () {
			/// Update the showHint value.
			me.showHint = !me.showHint;
			
			var hintIndex = me.card.numSides - 1;

			if (me.showHint === true) {
				$('#cards .card .sides').each(function () {
					$(this).find('.side').show();
				});

				/// Update the tooltip
				$(this).find('.tooltip').text('Hide Hint');
			}
			else {
				$('#cards .card .sides').each(function () {
					$(this).find('.side').eq(hintIndex).hide();
				});

				/// Update the tooltip
				$(this).find('.tooltip').text('Show Hint');
			}
		},

		initDropbox: function (callback) {
			/// <summary>Initializes the Dropbox client.</summary>
			/// <param name="callback" type="Function" optional="true">The callback function.</param>

			me.dropbox.authenticate({ interactive: false }, function (error) {
				if (error) {
					me.dropboxError(error);
				}
			});

			if (me.dropbox.isAuthenticated() === true) {
				// Hide the dropbox login
				$('#dropbox').hide();

				// Show the main body content
				$('#nimins').show();

				me.dropbox.getDatastoreManager().openDefaultDatastore(
					function (error, datastore) {
						/// <summary></summary>
						/// <param name="error" type=""></param>
						/// <param name="datastore" type="Dropbox.Datastore"></param>

						if (error) {
							me.dropboxError(error);
							return;
						}

						me.tables.decks = datastore.getTable('sets');
						me.tables.cards = datastore.getTable('cards');

						// Update the deck load dialog.
						me.deck.updateDialog(true);

						// Hide the loading window.
						$('#loading').hide();

						datastore.recordsChanged.addListener(function (records) {
							/// <summary></summary>
							/// <param name="records" type="Dropbox.Datastore.RecordsChanged"></param>
							
							var recs = records.affectedRecordsByTable();

							// Update the cards.
							if (recs.cards !== undefined &&
								recs.cards.length !== 0) {
								$.each(recs.cards, function (i, card) {
									/// <summary>Iterates the records.</summary>
									/// <param name="i" type="Number" interger="true">The index of the card.</param>
									/// <param name="card" type="Dropbox.Datastore.Record">The card record.</param>
									if (card.isDeleted()) {
										// Handle the card deletion.
										$('#cards .card[_id="' + card.getId() + '"]').remove();
									}
									else {
										// Handle the card creation.
										if (card.get('set') === me.deck.id) {
											// Scroll only if the update is a local update.
											me.card.load(card, records.isLocal());
										}
									}
								});
							}

							// Update the sets.
							if (recs.decks !== undefined &&
								recs.decks.length !== 0) {

								// Update the deck load dialog.
								console.warn('Decks not properly updatig in load dialog');
								me.deck.updateDialog();

								$.each(recs.decks, function (i, deck) {
									/// <summary>Iterates the records.</summary>
									/// <param name="i" type="Number" interger="true">The index of the card.</param>
									/// <param name="card" type="Dropbox.Datastore.Record">The card record.</param>

									// Handle the set update.
									if (deck.getId() === me.deck.id) {
										$('#title').val(deck.get('title'));
										$('#subject').val(deck.get('subject'));
										$('#folder').val(deck.get('folder'));
									}
								});
							}
						});

						if (typeof (callback) === 'function') {
							callback();
						}
					});
			}
			else {
				// Fade in the login window
				me.animate($('#dropbox'), 'animate-fade-in', 500, {
					before: function () {
						$('#dropbox').css({
							opacity: 0,
							display: 'inline'
						});
					},
					after: function () {
						$('#dropbox').css({
							opacity: 1,
							display: 'inline'
						});
					}
				});

				// Hide the loading window
				$('#loading').hide();

				// Hide the main body.
				$('#nimins').hide();
			}
		},

		dropboxError: function (error) {
			/// <summary>Handles Dropbox errors.</summary>
			/// <param name="error" type="Dropbox.ApiError">The Dropbox error to handle.</param>
			console.error(error);
			me.dialog({
				title: 'Dropbox Error',
				message: error.responseText,
				confirm: true
			});
		},

		exportFile: function () {
			/// <summary>Exports a txt file in the tsv format.</summary>

			/// <var type="Array">The lines to export.
			var lines = [];

			/// Set the set name.
			lines.push(['*', 'name', $('#title').val()].join('\t'));

			/// Set the tsv value.
			lines.push(['*', 'tsv', 'true'].join('\t'));

			/// Set the header
			lines.push(['Text 1', 'Text 2', 'Text 3', 'Picture 1', 'Picture 2', 'Picture 3'].join('\t'));

			/// Iterate the cards.
			$('#cards .card').each(function () {
				var line = [
					/// Set the card front text.
					$(this).find('.side[side="0"] .text').html(),

					/// Set the card back text.
					$(this).find('.side[side="1"] .text').html(),

					/// Set the card hint text.
					$(this).find('.side[side="2"] .text').html(),

					/// Set the card front image.
					$(this).find('.side[side="0"] .image.real .img').attr('src'),

					/// Set the card back image.
					$(this).find('.side[side="1"] .image.real .img').attr('src'),

					/// Set the card hint image.
					$(this).find('.side[side="2"] .image.real .img').attr('src'),
				].join('\t');

				if (line !== '') {
					lines.push(line);
				}
			});

			/// Confirm file read
			me.dialog({
				title: 'Export File',
				message: 'Select and copy the exported file below.',
				type: 'prompt',
				confirm: true,
				input: 'textarea',
				value: $.trim(lines.join('\n'))
			});

			$('.dialog textarea').select();

			var textfile = '{0}/{1}/{2}.export.txt'.format('Flashcards Deluxe', $('#subject').val(), $('#title').val());
			me.dropbox.writeFile(textfile, $.trim(lines.join('\n')));
		},

		convertImage: function (image, uri, callback) {
			/// <summary>Converts an image to a data string image.</summary>
			/// <param name="image" type="jQuery">The jQuerry image element.</param>
			/// <param name="uri" type="String">The location of the image.</param>
			/// <param name="callback" type="Function">The callback function.</param>

			var xhr = new XMLHttpRequest();

			xhr.open('GET', uri, true);

			xhr.responseType = 'arraybuffer';

			xhr.onload = function () {
				if (this.status === 200) {
					var reader = new FileReader();
					reader.onload = function (event) {
						var ext = uri.split('.');
						ext = ext[ext.length - 1];

						if (typeof (callback) === 'function') {
							var data = event.target.result.replace('data:', 'data:image/' + ext);
							callback(image, data);
						}
					};

					var blob = new Blob([this.response]);

					reader.readAsDataURL(blob);
				}
			};

			xhr.onerror = function (e) {
				console.error(e);
				console.log("Error " + e.target.status + " occurred while receiving the document.");
			};

			xhr.send();
		},

		sort: function (parent, child, sort) {
			/// <summary>Sorts the child elements.</summary>
			/// <param name="parent" type="jQuery">The parent element.</param>
			/// <param name="child" type="jQuery">The child element.</param>
			var items = parent.children(child).get();

			function alphanum(a, b) {
				var x;

				function chunkify(t) {
					var tz = [], x = 0, y = -1, n = 0, i, j;

					while (i = (j = t.charAt(x++)).charCodeAt(0)) {
						var m = (i == 46 || (i >= 48 && i <= 57));
						if (m != n) {
							tz[++y] = "";
							n = m;
						}
						tz[y] += j;
					}
					return tz;
				}

				if (sort !== null) {
					a = $(a).find(sort);
					b = $(b).find(sort);
				}

				a = $(a).text();
				b = $(b).text();

				var aa = chunkify(a);
				var bb = chunkify(b);

				for (x = 0; aa[x] && bb[x]; x++) {
					if (aa[x] !== bb[x]) {
						var c = Number(aa[x]), d = Number(bb[x]);
						if (c == aa[x] && d == bb[x]) {
							return c - d;
						}
						else {
							return (aa[x] > bb[x]) ? 1 : -1;
						}
					}
				}
				return aa.length - bb.length;
			}

			items.sort(alphanum);

			/// Reorders the items in the parent.
			$.each(items, function (index, item) {
				parent.append(item);
			});
		},

		sides: ['front', 'back', 'hint'],

		tables: {
			/// <field type="Dropbox.Datastore.Table">The sets table.</field>
			decks: undefined,
			/// <field type="Dropbox.Datastore.Table">The sets table.</field>
			cards: undefined,
		},
		
		/// <field name='card' type='nimins.tools'>The Nimins.Card namespace.</field>
		card: { _isNamespace: true },
		/// <field name='card' type='nimins.tools'>The Nimins.Deck namespace.</field>
		deck: { _isNamespace: true },
		/// <field name='card' type='nimins.tools'>The Nimins.Editor namespace.</field>
		editor: { _isNamespace: true },
		/// <field type="Nimins.Navigator">The Nimins.Navigator namespace.</field>
		navigator: { _isNamespace: true },
		/// <field name='card' type='nimins.settings'>The Nimins.Settings namespace.</field>
		settings: { _isNamespace: true },
		/// <field name='card' type='nimins.study'>The Nimins.Study namespace.</field>
		study: { _isNamespace: true },
	};

	
	$(function () {
		me.navigator.initialize();

		me.initDropbox(function () {
			var _id = localStorage.getItem('_id');

			if (_id === null) {
				// Update the load deck dialog.
				me.deck.updateDialog();
				
				// Show the load deck window.
				$('#loadDeck').cssFade('in');
			}
			else {
				me.deck.load(_id);
			}
	
			$('#loading').cssFade('out');
		});

		// #region Event handlers

		// #region Application button event handlers

		// New button click handler.
		me.navigator.action('#top button.new', function () {
			if ($('#newDeck').is(':visible') === true) {
				// Close the new dialog.
				$('#newDeck').cssFade('out');
			}
			else {
				// Show the new dialog.
				$('#newDeck').cssFade('in');
			}
		});

		// Load button click handler.
		me.navigator.action('#top button.load', function () {

			if ($('#loadDeck').is(':visible') === true) {
				// Close the load dialog.
				$('#loadDeck').cssFade('out');
			}
			else {
				// Show the load dialog.
				$('#loadDeck').cssFade('in');
			}
		});

		// Refresh button click handler.
		me.navigator.action('#top button.refresh', function () {
			// Refresh the page.
			window.location.reload();
		});

		/// Sides button click handler.
		me.navigator.action('#top button.sides', function () {
			me.toggleHint();
		});

		/// Study button click handler
		me.navigator.action('#top button.study', function () {
			/// Start the study mode.
			me.study.start([me.deck.id]);
		});

		/// Export button click handler.
		me.navigator.action('#top li.export', function () {
			/// Export the current set.
			me.exportFile();
		});

		/// Import button click handler.
		me.navigator.action('#top li.import', function () {
			me.dialog({
				title: 'Import File',
				message: 'Paste the file text to import below.',
				type: 'prompt',
				input: 'textarea',
				confirm: me.set.importFile,
				cancel: true,
			});
		});

		/// Remove button click handler.
		me.navigator.action('#top li.remove', function () {
			/// Confirm the action
			me.dialog({
				title: 'Remove set',
				message: 'Are you sure you wish to remove this set?  This can not be undone',
				type: 'confirm',
				confirm: function () {
					/// Retrieve the cards for the set.
					var cards = me.tables.cards.query({ set: me.deck.id });

					/// Iterate and delete the cards.
					for (var i = 0; i < cards.length; i++) {
						/// Delete the card.
						cards[i].deleteRecord();
					}

					/// Delete the set.
					me.tables.decks.get(me.deck.id).deleteRecord();

					me.deck.id = undefined;
					localStorage.removeItem('_id');
					
					// Update the deck dialog
					me.deck.updateDialog();;
					
					// Show the load set dialog
					$('#loadDeck').cssFade('in');
				},
				cancel: true,
			});
		});

		/// Signout button click handler.
		me.navigator.action('#top li.signout', function () {
			/// Sign the user out
			me.dropbox.signOut();

			/// Reload the window
			window.location.reload(true);
		});

		// #endregion

		// #region Set information event handlers.

		/// Title change handlers
		$(document).on('blur', '#title', function () {
			/// Get the set record
			var deck = me.tables.decks.get(me.deck.id);

			/// Update the deck information.
			deck.set('title', $('#title').val());
		});

		/// Title, Subject, and Folder change handlers
		$(document).on('blur', '#subject', function () {
			/// Get the set record
			var deck = me.tables.decks.get(me.deck.id);

			/// Update the deck information.
			deck.set('subject', $('#subject').val());
		});

		/// Title, Subject, and Folder change handlers
		$(document).on('blur', '#folder', function () {
			/// Get the set record
			var deck = me.tables.decks.get(me.deck.id);

			/// Update the deck information.
			deck.set('folder', $('#folder').val());
		});

		// #endregion

		// Dropbox button click handler.
		me.navigator.action('#dropbox button.login', function () {
			// Redirect brower to OAuth login.
			me.dropbox.authenticate({ interactive: true }, function (error) {
				if (error) {
					alert('Dropbox Authentication error: ' + error);
				}
			});
		});

		// Launch Firebug event handler
		me.navigator.action('#top .header .text', function () {
			me.dialog({
				title: 'Launch Firebug',
				message: 'Are you sure  you want to open Firebug?',
				type: 'confirm',
				confirm: function () {
					(function (F, i, r, e, b, u, g, L, I, T, E) {
						if (F.getElementById(b)) return; E = F[i + 'NS'] && F.documentElement.namespaceURI; E = E ? F[i + 'NS'](E, 'script') : F[i]('script'); E[r]('id', b); E[r]('src', I + g + T); E[r](b, u); (F[e]('head')[0] || F[e]('body')[0]).appendChild(E); E = new Image; E[r]('src', I + L);
					})(document, 'createElement', 'setAttribute', 'getElementsByTagName', 'FirebugLite', '4', 'firebug-lite.js', 'releases/lite/latest/skin/xp/sprite.png', 'https://getfirebug.com/', '#startOpened');
				},
				cancel: null
			});
		});
		
		// Window Resize Event Handler
		$(window).on('resize load', function () {
			var top = $('#top').outerHeight(true);
			$('#content').css('margin-top', top + 'px');
		});

		// #endregion

	});

	return me;
})();
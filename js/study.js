// <reference path="_references.js" />

window.nimins.study = (function (nimins, $, undefined) {
	/// <param name="nimins" type="nimins"></param>
	/// <param name="$" type="jQuery"></param>
	/// <param name="undefined" type="undefined"></param>
	/// <returns type="nimins.study"></returns>

	var me = {
		/// <field name="cards" type="Object">The cards object.</field>
		cards: {
			studying: [],
			known: [],
			unknown: [],
			undo: []
		},
		/// <field name="cards" type="Object">The deck ids for the study mode.</field>
		decks: [],
		/// <field name="stats" type="Object">The stats for the cards.</field>
		stats: {},
		/// <field name="touch" type="Object">The touch object.</field>
		touch: {
			x: undefined,
			y: undefined,
			isTouching: false,
			isTouch: false,
		},

		load: function () {
			/// <summary>Loads the cards from the datastore.</summary>
			/// <returns type="Array" elementType="Dropbox.Datastore.Record"></returns>

			// Clear the preloaded images.
			$('#study .preload').empty();

			var cards = [];

			var num = 0;
			
			$.each(me.decks, function (i, set) {
				// Get the cards in each set
				var cs = nimins.tables.cards.query({
					set: set
				});
				// Sort the cards by order
				cs.sort(function (a, b) {
					if (a.get('number') < b.get('number')) {
						return -1;
					}

					if (a.get('number') > b.get('number')) {
						return 1;
					}
					return 0;
				});
				$.each(cs, function (j, c) {
					// Add a sequential number based on the combined desks so we can sort on this number
					c.number = num++;
					cards.push(c);

					// Preload the deck images.
					$.each(nimins.sides, function (k, side) {
						if (c.get('image' + k) !== null) {
							$('<img/>').attr({
								card: c.getId(),
								side: side,
								src: c.get('image' + k)
							}).appendTo($('#study .preload'));
						}
					});
				});
			});

			return cards;
		},

		shuffle: function () {
			/// <summary>Shuffles the deck.</summary>

			var cards = me.cards.studying;

			if (nimins.settings.study.order === 'Random') {
				// Randomly shuffle the deck.
				var randomized = [];

				while (cards.length > 0) {
					var index = Math.floor(Math.random() * cards.length);
					randomized.push(cards.splice(index, 1)[0]);
				}

				cards = randomized;
			} else if (nimins.settings.study.order === 'Ordered') {
				// Sort the cards back in order.
				cards.sort(function (a, b) {
					if (a.number < b.number) {
						return -1;
					}

					if (a.number > b.number) {
						return 1;
					}

					return 0;
				});
			}

			me.cards.studying = cards;
		},

		flip: function (side2) {
			/// <summary>Flips the currently shown card.</summary>
			/// <param name="side2" type="Boolean">Sets whether to show the third side.</param>

			// Clear any selections made.
			window.getSelection().removeAllRanges();

			// Notification is shown, show next card.
			if ($('#study .notification').length !== 0) {
				me.showCard();

				return;
			}

			if (side2 === undefined) {
				// Check to see if we are viewing the side2
				if ($('#study > .card').hasClass('side2')) {
					// Remove side2.
					$('#study > .card').removeClass('side2');
				} else {
					// Animates the card between side0 and side 1.
					$('#study > .card')
						.removeClass('instant')
						.toggleClass('side1');
				}
			} else if (me.cards.studying[0].get('text2') !== null ||
				me.cards.studying[0].get('image2') !== null) {
				// Animates the card between side2 and whatever side was showing.
				$('#study > .card')
					.removeClass('instant')
					.toggleClass('side2');
			}
		},

		undo: function () {
			/// <summary>Undoes the previous action.</summary>

			// Notification is shown, show next card.
			if ($('#study .notification').length !== 0) {
				me.showCard();

				return;
			}

			// Make sure we can undo.
			if (me.cards.undo.length > 0) {
				// Get the last undo object in the undo list.
				var undo = me.cards.undo.pop();

				// Pop the last card out of the undo
				var card = me.cards[undo.status].pop();

				// Reset the card stats.
				me.stats[card.getId()] = undo.stats;

				// Splice the card back into the deck.
				me.cards.studying.splice(0, 0, card);

				// Add the flash css animation.
				nimins.animate($('#study .bar.studying'), 'flash', 1000);

				// Show the card.
				me.showCard();
			}
		},

		updateDeckStats: function () {
			/// <summary>Updates the deck statistics.</summary>

			var cards = me.cards;

			// Update the set status.
			$('#study .status .set').html('{0} / {1} / {2}'.format(
				cards.known.length,
				cards.studying.length,
				cards.unknown.length));
		},

		updateProgressBar: function () {
			/// <summary>Updates the progress bar.</summary>

			var cards = me.cards;
			var total = cards.known.length + cards.studying.length + cards.unknown.length;
			var settings = nimins.settings.study;

			if (settings.progressDisplay === 'Hidden') {
				$('#study .progress').hide();
			} else {
				// Update the progress bars.
				var bars = ['known', 'studying', 'unknown'];

				var layout = 'width';

				if (settings.progressSide === 'Left' ||
					settings.progressSide === 'Right') {
					layout = 'height';
				}

				$.each(bars, function (i, bar) {
					$('#study .progress .' + bar).css({
						width: '',
						height: ''
					});

					$('#study .progress .' + bar).css(layout, (cards[bar].length / total * 100) + '%');
				});

				if (settings.progressDisplay === 'Fade') {
					nimins.animate($('#study .progress'), 'animate-fade-out-slow', 1000);
				}
			}
		},

		updateCardStats: function (card) {
			// <summary>Updates the card statistics.</summary>
			// <param name="card" type="jQuery">The card for which the stats will be updated.</param>

			var stats = me.stats[card.getId()];

			$('#study .status .streak').html('Streak: {0}'.format(stats.streak));
			$('#study .status .known').html('Known: {0}'.format(stats.known));
			$('#study .status .unknown').html('Unknown: {0}'.format(stats.unknown));
		},

		showCard: function () {
			/// <summary>Shows the next card in the deck.</summary>

			// Disable the back button.
			if (me.cards.undo.length === 0) {
				$('#study button.undo').addClass('disabled');
			} else {
				$('#study button.undo').removeClass('disabled');
			}

			// Instantly flip the card back to the first side
			$('#study > .card').addClass('instant').removeClass('side1 side2');

			// Update the deck statistics.
			me.updateDeckStats();

			// Update the progress bar.
			me.updateProgressBar();

			if (me.cards.studying.length === 0) {
				// Copy any images back to the preload
				$('#study .card .middle img').appendTo($('#study .preload'));

				// Empty the card side.
				$('#study .card .middle').empty();

				if (me.cards.unknown.length === 0) {
					$('#study .card .middle').addClass('notification').html('Streak Completed');

					// Get a new deck of cards.
					me.cards.studying = me.load();
				} else {
					$('#study .card .middle').addClass('notification').html('Repeating Skipped Cards');

					// Copy the unknown deck to the studying deck.
					me.cards.studying = me.cards.unknown;
				}

				// Reset the deck
				me.reset();

				// Shuffle the deck
				me.shuffle();

				return;
			}

			// Clear the notification
			$('#study .card .middle').removeClass('notification');

			// <var type="Object">The first card in the array.</var>
			var card = me.cards.studying[0];

			// Update the card statistics.
			me.updateCardStats(card);

			// Copy any images back to the preload
			$('#study .card .middle img').appendTo($('#study .preload'));

			// Empty the card side.
			$('#study .card .middle').empty();

			// Iterate the card sides.
			$.each(nimins.sides, function (i, side) {
				// Get the side setting.
				var s = nimins.settings.study['side' + i];

				if (s === 'One') {
					s = 'side0';
				} else if (s === 'Two') {
					s = 'side1';
				} else if (s === 'Three') {
					s = 'side2';
				}

				// Set the side text if it exists.
				if (card.get('text' + i) !== null) {
					$('#study .card .' + s + ' .middle').append(card.get('text' + i));
				}

				// Check to see if a preloaded image exists and append it.
				$('#study .preload img[card="' + card.getId() + '"]')
					.filter('[side="' + side + '"]')
					.appendTo($('#study .card .' + s + ' .middle'));
			});

			// Enable or disable the hint button if there is no hint side.
			if (card.get('text2') !== null || card.get('image2') !== null) {
				$('#study button.hint').removeClass('disabled');
			} else {
				$('#study button.hint').addClass('disabled');
			}

			$('#study .card .side').flowtype({
				minFont: 10,
				maxFont: 30,
			});
		},

		close: function () {
			/// <summary>Closes the study mode.</summary>

			// Scroll back to the top.
			$('body').scrollTop(0);

			// Clear the preloaded images.
			$('#study .preload').empty();

			// Animate the study window.
			nimins.animate($('#study'), 'animate-fade-out', 500, {
				before: function () {
					// Show the rest of nimins
					$('#top').show();
					$('#cards').show();
				},
				after: function () {
					// Clear the card.
					$('#study .card .middle').empty();

					// Hide the study window
					$('#study').hide();
				}
			});
		},

		reset: function () {
			/// <summary>Resets the decks.</summary>

			// Reset the undo deck.
			me.cards.undo = [];

			// Reset the unknown deck.
			me.cards.unknown = [];

			// Reset the known deck.
			me.cards.known = [];
		},

		loadSettings: function () {
			/// <summary>Loads the study settings.</summary>

			// Set the card animation
			$('#study .card .side')
				.removeClass(nimins.settings.defaults.study.animation.values.join(' ').toLowerCase())
				.addClass(nimins.settings.study.animation.toLowerCase());

			// Load the default progress bar settings.
			$('#study .progress')
				.removeClass(nimins.settings.defaults.study.progressDisplay.values.join(' ').toLowerCase())
				.removeClass(nimins.settings.defaults.study.progressSide.values.join(' ').toLowerCase())
				.removeClass(nimins.settings.defaults.study.progressFill.values.join(' ').toLowerCase())
				.addClass(nimins.settings.study.progressDisplay.toLowerCase())
				.addClass(nimins.settings.study.progressSide.toLowerCase())
				.addClass(nimins.settings.study.progressFill.toLowerCase());

			// Update the progress bar with the new settings.
			me.updateProgressBar();
		},

		start: function (decks) {
			/// <summary>Starts the study mode.</summary>
			/// <param name="decks" type="Array" elementType="String"></param>

			// Set the deck ids.
			me.decks = decks;

			// Load the cards.
			me.cards.studying = me.load();

			// Load the settings
			me.loadSettings();

			// Reset the deck
			me.reset();

			// Shuffle the deck
			me.shuffle();

			// Default the card stats.
			$.each(me.cards.studying, function (i, card) {
				me.stats[card.getId()] = {
					streak: 0,
					known: 0,
					unknown: 0
				};
			});

			$('#top').cssFade('out');
			$('#cards').cssFade('out');
			
			// Animate the study window.
			$('#study').cssFade('in', function () {
				me.showCard();
			});
		},

		status: function (status) {
			/// <summary>Sets the status of the current card.</summary>
			/// <param name="status" type="String">The status to set. (known, unknown)</param>

			// Notification is shown, show next card.
			if ($('#study .notification').length !== 0) {
				me.showCard();

				return;
			}

			if (me.cards.studying.length !== 0) {
				// Shift the card out of the array.
				var card = me.cards.studying.shift();

				var stats = me.stats[card.getId()];

				// Add the card to the undo array.
				me.cards.undo.push({
					stats: {
						known: stats.known,
						unknown: stats.unknown,
						streak: stats.streak
					},
					status: status
				});

				// Push the card to the end of the status array.
				me.cards[status].push(card);

				if (status === 'known') {
					// Increase the known count.
					me.stats[card.getId()].known++;

					// Increase the streak.
					me.stats[card.getId()].streak++;
				} else if (status === 'unknown') {
					// Increase the unknown count.
					me.stats[card.getId()].unknown++;

					// Reset the streak.
					me.stats[card.getId()].streak = 0;
				}

				// Animation bar
				nimins.animate($('#study .bar.' + status), 'flash', 1000);

				// Show the next card in the array.
				me.showCard();
			}
		}
	};

	$(function () {
		// Study known/unknown click handler
		nimins.navigator.action('#study button.known', function () {
			// Animate the button
			nimins.animate($(this), 'animate-flash-green', 1000);
	
			// Set the card status
			me.status('known');
		});
	
		// Study known click handler
		nimins.navigator.action('#study button.unknown', function () {
			// Animate the button
			nimins.animate($(this), 'animate-flash-red', 1000);
	
			// Set the card status
			me.status('unknown');
		});
	
		// Back click handler
		nimins.navigator.action('#study button.undo', function () {
			if (me.cards.undo.length !== 0) {
				// Animate the button
				nimins.animate($(this), 'animate-flash-blue', 1000);
		
				// Undo the previous action
				me.undo();
			}
		});
	   
		// Show hint click handler 
		nimins.navigator.action('#study button.hint', function () {
			if ($('#study .actions .hint').hasClass('disabled') === false) {
				// Animate the button
				nimins.animate($(this), 'animate-flash-gray', 1000);
	
				// Show the side2.
				me.flip(true);
			}
		});
	
		// Study close click handler
		nimins.navigator.action('#study button.close', function () {
			// Close study mode.
			me.close();
		});
	
		// Edit card click handler
		nimins.navigator.action('#study button.edit', function () {
			// Close study mode.
			me.close();
	
			// Edit the card.
			nimins.card.edit(me.cards.studying[0].getId());
		});
	
		// Settings Button Click Handler
		nimins.navigator.action('#study button.settings', function () {
			nimins.animate($(this), 'animate-flash-gray', 500);
			
			$('#study #settings').cssFade('in');
		});
	
		// Keypress
		$(document).on('keyup', function (e) {
			if ($('#study').is(':visible')) {
				// We are in study mode, prevent all button actions.
				e.preventDefault();
	
				if (e.which === 37) {
					// Left arrow
					me.status('known');
				} else if (e.which === 38) {
					// Up arrow
					me.flip();
				} else if (e.which === 39) {
					// Right arrow
					me.undo();
				} else if (e.which === 40) {
					// Down arrow
					me.status('unknown');
				} else if (e.which === 96) {
					// Enter key
					me.flip(true);
				}
			}
		});
	 
		// Study card click handler
		nimins.navigator.action('#study .card', function () {
			me.flip();
		});
		
	});

	return me;

}(window.nimins, window.jQuery));
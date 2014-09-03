/// <reference path="../scripts/_references.js" />
window.nimins.card = (function (nimins, $, undefined) {
	/// <param name="nimins" type="nimins"></param>
	/// <param name="$" type="jQuery"></param>
	/// <param name="undefined" type="undefined"></param>
	/// <returns type="nimins.card"></returns>

	var me = {
		/// <field type="Boolean">Gets or sets if a card is being edited.</field>
		editing: false,

		/// <field type="Array" elementType="String">Gets the name of the card sides as an aray.</field>
		//sides: ['side0', 'side1', 'side2'],

		/// <field type="Number" integer="true">Gets or sets the number of sides the card has.</field>
		numSides: 3,

		move: function (card, index) {
			/// <summary>Moves the card before the selected index.</summary>
			/// <param name="card" type="jQuery">Accepts a jQuery element.</param>
			/// <param name="index" type="Number">Accepts a number to move the card in front of.</param>

			// The number of cards.
			var count = $('#cards .card').length;

			// Make sure the index is not out of range.
			index = (index < 0) ? index = 0 : index;
			index = (index > count) ? count : index;

			// Get an array of the cards.
			var cards = $('#cards .card').not('[new="true"]').get();

			// Get the index of the card to move.
			var idx = cards.indexOf(card[0]);

			// Splice out the card to move
			var temp = cards.splice(idx, 1);

			// Splice it back into the desired position.
			cards.splice(index, 0, temp);

			// Iterate the cards
			$.each(cards, function (i, card) {
				var c = nimins.tables.cards.get($(card).attr('_id'));
				// Update the number of cards that need it.
				if (c.get('number') !== i) {
					c.set('number', i);
				}
			});
		},

		remove: function (card) {
			/// <summary>Removes the selected from a card.</summary>
			/// <param name="card" type="jQuery">Accepts a jQuery element.</param>

			// Remove the selected card.
			card.remove();

			// Renumber the cards.
			$('#cards .card').each(function (index) {
				$(this).find('.header .title').html('Card #' + (index + 1));
			});
		},

		load: function (record, scroll) {
			/// <summary>Loads a card.</summary>
			/// <param name="record" type="Dropbox.Datastore.Record">The datastore record of the card.</param>
			/// <param name="scroll" type="Boolean" optional="true">Sets whether the cards list will scroll as cards are added.</param>
			/// <returns type="jQuery">Returns the generated jQuery element.</returns>

			var onImageLoaded = function (img) {
				// Show the image.
				img.show();

				// Show the image parents.
				img.parents('.card').find('.image')
					.addClass('fake');

				// Add a real class
				img.parent()
					.removeClass('fake')
					.addClass('real');

				// Show the remove button.
				img.parent().find('.remove').show();
			};

			var isEdit = false;
			var hasImage = false;
			var isFocused = false;
			
			// Get the card being edited or a new card.
			var card = $('#cards .card[_id="' + record.getId() + '"]');

			if (card.length !== 0) {
				isEdit = true;
				
				// Determine if we have the card currently focused.
				isFocused = (record.getId() === $('#cards .card .text:focus').parents('.card'));
			}
			else {
				/// Create a new card.
				card = $($('#card').html());

				// Set the card id.
				card.attr('_id', record.getId());

				// Append the card to the set.
				card.insertBefore($('#cards .card[new="true"]'));
			}

			// Add the card title to the header.
			card.find('.title').html('Card #' + (record.get('number') + 1));

			var hasHint = false;

			// Iterate and create the sides for the card.
			for (var i = 0; i < me.numSides; i++) {
				var txt = record.get('text' + i);
				var uri = record.get('image' + i);

				// Get the current text element
				var text = card.find('.text').eq(i);
				var img = card.find('.img').eq(i);

				// Determine if we are editing the card or not.
				if (isEdit === true) {
					// Check to make sure we actually have changes.
					if (txt !== text.html()) {
						// Update the text.
						text.html(txt || '');
					}

					// Check to make sure the image has actually changed.
					if (uri !== encodeURI(img.attr('uri'))) {
						// Determine if the uri has been set.
						if (uri !== null) {
							// Decode the uri
							uri = decodeURI(uri);

							// Update the image
							img.attr({ uri: uri, src: uri })
								.on('load', function () {
									onImageLoaded($(this));
								});
						}
						else {
							// Remove the uri and hide the image.
							card.find('.img').eq(i)
								.removeAttr('uri')
								.removeAttr('src').hide();
						}
					}
				}
				else {
					// Set the text value.
					text.html(txt || '');

					// Set the image
					if (uri !== null) {
						// Decode the uri
						uri = decodeURI(uri);

						img.attr({ uri: uri, src: uri })
							.on('load', function () {
								onImageLoaded($(this));
							});
					}
				}

				if (i === 2) {
					if (txt !== null || uri !== null) {
						hasHint = true;
					}
				}
			}

			// Determine if we can hide the parent containers
			card.find('.img').each(function () {
				if ($(this).attr('uri') !== undefined) {
					hasImage = true;
				}
			});

			if (hasImage === false) {
				// Hide the image containers since no images exist.
				card.find('.image')
					.removeClass('real fake');
			}

			if (hasHint && nimins.showHint === true) {
				// This side is the hint and we are allowed to show it.
				card.find('.sides .side').eq(2).show();
			}

			// Scroll the cards.
			if (scroll === true && isEdit === false) {
				$('#cards .card[new="true"]').scrollTop(card.scrollHeight);
			}
			
			// Refocus the card if needed.
			if (isFocused === true) {
				// Move the caret to the end on focus.
				nimins.editor.focusEnd = true;
				
				// Focus the card.
				card.find('.text:eq(1)').focus();
			}

			// Sort the cards by number
			nimins.sort($('#cards'), $('.card'), '.title', true);

			// Move the new card back to the bottom
			$('#cards .card[new="true"]').appendTo('#cards');

			return { card: card, hasHint: hasHint };
		},

		create: function () {
			/// <summary>Creates a new card and inserts it into the data store.</summary>

			var card = $('#cards .card[new="true"]');

			// The object data for the card.
			var data = { set: nimins.deck.id };

			for (var i = 0; i < me.numSides; i++) {
				// Clean the card html.
				nimins.editor.clean(card.find('.text').eq(i));

				if (card.find('.text').eq(i).text() !== '') {
					data['text' + i] = card.find('.text').eq(i).html();
				}

				if (card.find('.img').eq(i).attr('src') !== undefined) {
					data['image' + i] = card.find('.img').eq(i).attr('src')
				}
			}

			// Check to see if side two has no text or image set.
			if (data.text1 === undefined && data.image1 === undefined) {
				// Determine if side one has text if so, copy side one to side two
				// otherwise focus side one.
				if (data.text0 !== undefined) {
					// Format the card.
					data.text1 = nimins.editor.format(false, card);
				}
				else {
					// Focus side one
					card.find('.text:eq(0)').focus();

					return;
				}
			}
			else if ((data.text0 === undefined && data.image0 === undefined) ||
					 (data.text1 === undefined && data.image1 === undefined)) {
				// Focus side one
				card.find('.text:eq(0)').focus();

				return;
			}

			// Set the card number, subtracting one to account for the new card.
			data.number = $('#cards .card').length - 1;

			// Insert the card into the table.
			nimins.tables.cards.insert(data);

			/// Clear the editors
			nimins.editor.clear();

			/// Focus the new card
			card.find('.text:eq(0)').focus();
		},
	};

	$(function () {

		// #region Card Event Handlers

		$(document).on('blur', '#cards .card .text', function () {
			// Get the card.
			var card = $(this).parents('.card');

			// Make sure this isnt the new card.
			if (card.attr('data-new-card') === undefined) {

				// Get the text index.
				var index = $(this).parent().attr('data-side');

				// Edit the card text.
				var record = nimins.tables.cards.get(card.attr('_id'));

				// Get the html of the side.
				var html = nimins.editor.clean($(this));

				// If the text is empty then pass null which will delete the key.
				if (html === '') {
					html = null;
				}
				//var txt = record.get('text' + index);

				if (record.get('text' + index) !== html) {
					// Update the text
					record.set('text' + index, html);
				}
			}
		});

		// Remove button click handler.
		nimins.navigator.action('#cards .header button.remove', function (event) {
			//nimins.navigator.action('#cards .header button.remove', function (event) {
			/// <var type='jQuery'>The parent jQuery context for the card.</var>
			var parent = $(this).parents('.card');

			var removeCard = function () {
				/// <summary>Removes the selected card.</summary>
				/// Get the card id.
				var id = parent.attr('_id');
				/// Remove the card.
				nimins.tables.cards.get(id).deleteRecord();
			};

			/// If the user holds the shift key down, we do not not need to confirm the remove.
			if (event.shiftKey === false) {
				/// Confirm the remove with the user.
				nimins.dialog({
					title: 'Remove Card',
					message: 'Are you sure you want to remove this card?  It cannot be undone.',
					type: 'confirm',
					confirm: function () {
						/// Remove the card.
						removeCard();
					},
					cancel: true
				});
			}
			else {
				/// Remove the card.
				removeCard();
			}
		});

		// Move button click handler.
		nimins.navigator.action('#cards .card button.move', function () {
			//nimins.navigator.action('#cards .card button.move', function () {
			/// <var type='jQuery'>The parent jQuery context for the card.</var>
			var parent = $(this).parents('#cards .card');

			/// Prompt the user for an index to move to.
			nimins.dialog({
				title: 'Move Card',
				message: 'What card number do you wish to insert this card before?',
				type: 'prompt',
				confirm: function (index) {
					/// Move the card.
					me.move(parent, index - 1);
				},
				cancel: true
			});
		});

		// #endregion
	});

	return me;

}(window.nimins, window.jQuery));
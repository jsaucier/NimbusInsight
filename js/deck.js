/// <reference path="../scripts/_references.js" />

window.nimins.deck = (function (nimins, $, undefined) {
	/// <param name="nimins" type="nimins"></param>
	/// <param name="$" type="jQuery"></param>
	/// <param name="undefined" type="undefined"></param>
	/// <returns type="nimins.deck"></returns>
	
	var me = {
		// <field type="String">The id of the deck loaded.</field>
		id: undefined,

		create: function (title, subject, folder) {
			/// <summary>Creates a new card set.</summary>
			/// <param name="title" type="String">The title of the set.</param>
			/// <param name="subject" type="String">The subject of the set.</param>
			/// <param name="folder" type="String" optional="true>The folder for the set.</param>

			// Make sure the title and subject are set.
			if (title === '' || subject === '') {
				me.dialog({
					title: 'Error',
					message: 'Could not create new set.  Please enter a title and subject.',
					confirm: true
				});

				return;
			}

			// Create a new deck
			var record = nimins.tables.decks.insert({
				title: title,
				subject: subject,
				folder: folder,
				created: new Date(),
				modified: new Date()
			});
			
			/// Loads the created set.
			me.load(record.getId());
		},
		
		load: function (id) {
			/// <summary>Loads the cards.</summary>
			/// <param name="id" type="String">The id for the set to load.</param>
			
			// Get the set information from the datastore.
			var deck = nimins.tables.decks.get(id);
			
			if (deck === null) {
				// Clear the storage id.
				localStorage.removeItem('_id');

				// Show the load dialog.
				me.dialog();

				return;
			}

			// Get the cards for the set from the datastore.
			var cards = nimins.tables.cards.query({ set: id });

			// Sort the cards
			cards.sort(function (a, b) {
				if (a.get('number') < b.get('number')) {
					return -1;
				}

				if (a.get('number') > b.get('number')) {
					return 1;
				}
				return 0;
			});

			// Set the loaded set id
			me.id = id;

			// Scroll the cards div to the top
			$('#cards .cards').scrollTop(0);

			// Remove all of the cards.
			$('#cards .card').not('.new').remove();

			// Set title.
			$('#title').val(deck.get('title'));

			// Set subject
			$('#subject').val(deck.get('subject'));

			// Set folder
			$('#folder').val(deck.get('folder'));

			var hasHint = false;

			$.each(cards, function (i, card) {
				// Load the card.
				var c = nimins.card.load(card);

				// Check to see if the card has a hint side
				if (c.hasHint === true) {
					hasHint = true;
				}
			});

			// Toggle hints if a card had a hint.
			if (hasHint !== nimins.showHint) {
				nimins.toggleHint();
			}

			// Store the id to the local storage.
			localStorage.setItem('_id', id);
		},
		
		updateDialog: function () {
			/// <summary>Updates the decks dialog.</summary>

			var decks = nimins.tables.decks.query();

			$('#loadDeck .subjects').empty();
			$('#loadDeck .folders').empty();
			$('#loadDeck .decks').empty();

			$.each(decks, function (i, deck) {
				var subject = deck.get('subject');
				var folder = deck.get('folder') || 'Unsorted';
				var title = deck.get('title');

				if ($('#loadDeck .subject[subject="' + subject + '"]').length === 0) {
					$('<button/>')
						.attr({
							class: 'subject',
							subject: subject
						})
						.html(subject)
						.appendTo($('#loadDeck .subjects'));
				}

				if ($('#loadDeck .folder')
						.filter('[subject="' + subject + '"]')
						.filter('[folder="' + folder + '"]').length === 0) {
					$('<button/>')
						.attr({
							class: 'folder',
							subject: subject,
							folder: folder
						})
						.html(folder)
						.appendTo($('#loadDeck .folders'))
						.hide();
				}

				if ($('#loadDeck .deck')
						.filter('[subject="' + subject + '"]')
						.filter('[folder="' + folder + '"]')
						.filter('[_="' + deck.getId() + '"]').length === 0) {
					$('<button/>')
						.attr({
							class: 'deck',
							subject: subject,
							folder: folder,
							_id: deck.getId()
						})
						.html(title)
						.appendTo($('#loadDeck .decks'))
						.hide();
				}
			});

			/// Sorts the lists.
			nimins.sort($('#loadDeck .subjects'), $('.subject'), null);
			nimins.sort($('#loadDeck .folders'), $('.folder'), null);
			nimins.sort($('#loadDeck .decks'), $('.deck'), null);
			
			/*nimins.navigator.clickHanler(
			$('#loadDeck button.deck, #loadDeck button.folder, #loadDeck button .subject').on('touchstart', function (e) {
				//alert('touch');
				$(this).tap(e, function (e) {
					$(this).toggleClass('selected');
				});
			});*/
			

		},
		
		importFile: function (importText) {
			/// <summary>Imports a txt file in the tsv format.</summary>
			/// <param name="importText" type="String">The text from the file to import.</param>

			/// Attempt to parse the text as json.
			var set = JSON.parse(importText);

			var setData = { title: set.title, subject: set.subject };

			if (set.folder !== undefined) {
				setData.folder = set.folder;
			}

			/// Create a new set.
			var record = me.tables.sets.insert(setData);

			/// Load the set.
			me.set.load(record.getId());

			var count = 1;

			$.each(set.cards, function (i, card) {
				var data = {
					set: record.getId(),
					number: count++
				};

				$.each(me.card.sides, function (s, side) {
					if (card.texts !== undefined &&
						card.texts[side] !== undefined) {
						data['text' + (s + 1)] = card.texts[side];
					}
					if (card.images !== undefined &&
						card.images[side] !== undefined) {
						data['image' + (s + 1)] = encodeURI(card.images[side]);
					}
				});

				me.tables.cards.insert(data);
			});
		}
	};

	$(function () {

		// #region Load Set dialog event handlers

		/// Load Deck New button click handler
		nimins.navigator.action('#loadDeck button.new', function () {
			// Hide the load dialog.
			$('#loadDeck').cssFade('out');

			// Show the new dialog.
			$('#newDeck').cssFade('in');
		});

		/// Import button click handler.
		nimins.navigator.action('#loadDeck button.import', function () {
			me.dialog({
				title: 'Import File',
				message: 'Paste the file text to import below.',
				type: 'prompt',
				input: 'textarea',
				confirm: function (text) {
					$('#loadDeck').cssFade('in');
					me.importFile(text);
				},
				cancel: true,
			});
		});
		nimins.navigator.action('#loadDeck button .deck', function (e) {
				$(this).tap(e, function () {
					$(this).toggleClass('selected');
				});
			});
			
		/// Subject click handler.
		nimins.navigator.action('#loadDeck button.subject', function () {
			// The selected subject.
			var subject = $(this).attr('subject');

			// Select the subject.
			$('#loadDeck button.subject').removeClass('selected');
			$(this).addClass('selected');

			// Filter the folders.
			$('#loadDeck button.folder').hide();
			$('#loadDeck button.folder').filter('[subject="' + subject + '"]').show();
			$('#loadDeck button.folder').removeClass('selected');

			// Filter the files.
			$('#loadDeck button.deck').hide();
			$('#loadDeck button.deck').filter('[subject="' + subject + '"]').show();
			$('#loadDeck button.deck').removeClass('selected');
		});

		// Folder click handler.
		nimins.navigator.action('#loadDeck button.folder', function () {
			// The selected subject.
			var subject = $(this).attr('subject');

			// The selected folder.
			var folder = $(this).attr('folder');

			// Select the subject.
			$('#loadDeck button.folder').removeClass('selected');
			$(this).addClass('selected');

			// Filter the files.
			$('#loadDeck button.deck').hide();
			$('#loadDeck button.deck').filter('[folder="' + folder + '"]').filter('[subject="' + subject + '"]').show();
			$('#loadDeck button.deck').removeClass('selected');
		});

		// File click handler.
		nimins.navigator.action('#loadDeck button.deck', function () {
			// Select the file
			$(this).toggleClass('selected');
		});
		
		/// Cancel click handler.
		nimins.navigator.action('#loadDeck button.cancel', function () {
			// Hide the dialog
			$('#loadDeck').cssFade('out');

			if (me.id === undefined) {
				// Show the new dialog
				$('#newDeck').cssFade('in');
			}
		});

		// Confirm click handler.
		nimins.navigator.action('#loadDeck button.confirm', function () {
			// Make sure we have a file selected
			if ($('#loadDeck button.deck.selected').length !== 0) {
				// The path to the selected file.
				var _id = $('#loadDeck button.deck.selected:eq(0)').attr('_id');

				// Load the selected file
				me.load(_id);

				// Hide the dialog
				$('#loadDeck').cssFade('out');
			}
		});

		// Study click handler
		nimins.navigator.action('#loadDeck button.study', function () {
			// Make sure we have a file selected
			if ($('#loadDeck button.deck.selected').length !== 0) {
				var decks = [];

				$('#loadDeck button.deck.selected').each(function () {
					decks.push($(this).attr('_id'));
				});

				// Hide the dialog
				$('#loadDeck').cssFade('out');

				// Start the study mode.
				nimins.study.start(decks);
			}
		});

		// File double click handler.
		$(document).on('dblclick', '#loadDeck button.deck', function () {
			// Load the selected file.
			me.load($(this).attr('_id'));

			// Hide the dialog
			$('#loadDeck').cssFade('out');
		});

		// #endregion

		// #region New Set window event handlers.
		
		// New Deck Confirm Button Click Event Handler
		nimins.navigator.action('#newDeck button.confirm', function () {
			var title = $('#newTitle').val();
			var subject = $('#newSubject').val();
			var folder = $('#newFolder').val();

			if (title === '') {
				me.dialog({
					title: 'New Deck',
					message: 'Please enter a title',
					confirm: function () { $('#newTitle').focus(); }
				});
			}
			else if (subject === '') {
				me.dialog({
					title: 'New Deck',
					message: 'Please enter a subject',
					confirm: function () { $('#newSubject').focus(); }
				});
			}
			else {
				// Create a new set
				me.create(title, subject, folder);
				
				// Clear the values
				$('#newTitle').val('');
				$('#newSubject').val('');
				$('#newFolder').val('');
				
				/// Hide the window.
				$('#newDeck').cssFade('out');
			}
		});

		// New Deck Cancel Button Click Event Handler
		nimins.navigator.action('#newDeck button.cancel', function () {
			// Hide the window.
			$('#newDeck').cssFade('out');

			if (me.id === undefined) {
				// Show the load deck window.
				$('#newDeck').cssFade('in');
			}
		});

		// #endregion

	});

	return me;

}(window.nimins, window.jQuery));
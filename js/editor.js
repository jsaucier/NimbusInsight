/// <reference path="../scripts/_references.js" />

window.nimins.editor = (function (nimins, $, undefined) {
	var me = {
		focusEnd: false,
		timer: undefined,
		editing: undefined,

		cleanHtml: function (text) {
			console.trace('cleanHtml() has been depreciated, use clean() instead.');
			return me.clean(text);
		},

		clean: function (element) {
			// Get the currently selected element.
			element = element || $('#cards .card .text:focus');
			
			// Make sure there is actual text.
			if (element.text() === '') {
				// Clear the element html
				element.html('');
				
				return '';
			}
			
			// Unwrap the font tags and remove attributes.
			element.find('font').contents().unwrap();
			element.find('u').removeAttributes();
			element.find('b').removeAttributes();
			element.find('i').removeAttributes();

			// Clean up the style attributes
			element.find('*[style]').each(function () {
				var style = $(this).attr('style');

				style = style.replace(/font-size: .*px;/, '');
				style = $.trim(style);

				if (style === '') {
					$(this).removeAttr('style');
				} 
				else {
					$(this).attr('style', style);
				}
			});

			// Check for our empty div
			element.find('div').each(function () {
				if ($(this).html() === '&nbsp;') {
					// Remove the empty div
					$(this).remove();
				}
			});

			// Removes the trailing br from list items.
			element.find('li br').remove();

			// Final dom cleanup
			element.find('*').each(function () {
				// Trim the whitespaces from elements, could cause issues
				var html = $.trim($(this).html());
				$(this).html(html);
			});

			// Removes any empty div tags
			element.find('div:empty').remove();

			// Gets the html from the element.
			var html = element.html();

			// More cleanup
			html = html.replace(/&nbsp;/g, ' ');

			// Remove any linebreaks
			html = html.replace(/(\r\n|\n|\r)/gmi, '');

			// Remove any connecting underlines
			html = html.replace(/<\/u><u>/igm, '');

			// Reduce whitespace
			html = html.replace(/\s+/g, ' ');

			// Run this three times to ensure all three types are cleared
			for (var i = 0; i <= 2; i++) {
				/// Remove underlined/itatic/bold <br>
				html = html.replace(/<[biu]><br><\/[biu]>/igm, '<br>');
			}

			// Trim the whitespace
			html = $.trim(html);

			// Finally set the cleaned html back to the editor.
			element.html(html);

			return html;
		},

		clear: function () {
			// Get the new card.
			var card = $('#cards .card[new="true"]');
			
			// Clear the card.
			card.find('.text').html('');
			
			// Hide the image and remove the src
			card.find('.img').removeAttr('src').removeAttr('uri').hide();
			
			// Deal with the image container.
			card.find('.image').removeClass('fake real');
		},

		execute: function (args) {
			// The currently focused editor.
			var editor = $('#cards .card .text:focus');
			
			// Make sure we have an editor focused.
			if (editor.length !== 0) {
				// The selected command to execute.
				var cmd = args.command; //$(button).attr('data-cmd') ||

				switch (cmd) {
					case 'clear':
						// Confirm the command.
						nimins.dialog({
							title: 'Clear Card',
							message: 'Are you sure you want to erase this side of the card?',
							type: 'confirm',
							confirm: function () {
								// Clear the card side
								editor.html('');

								// Refocus the editor.
								editor.focus();
							},
							cancel: true
						});

						break;

					case 'create':
						// Create a new card.
						nimins.card.create();

						break;

					case 'format':
						// Format the answer and copy it to the question side.
						me.format(true);

						// Refocusing allows the content to retain focus, but not show the cursor.
						//$('#cards .card .text:focus').focus();

						break;

					case 'character':
						document.execCommand('insertText', false, args.character);
						
						break;
						
					case 'upload':
						$('<input/>')
							.attr('type', 'file')
							.addClass('upload')
							.appendTo(editor.parents('.side'))
							.click();

						break;

					case 'source':
						console.warn('View Source not working properly.')
						// Clean the html first.
						/*me.cleanHtml(editor);

						if (editor.attr('data-source') === true) {
							// Convert the text source back to html.
							editor.html(editor.text());

							// Remove the attribute.
							editor.removeAttr('data-source');
						}
						else {
							// Convert the html to text source.
							editor.text(editor.html());

							// Add the attribute.
							editor.attr('data-source', true);
						}

						// Clears the buggy caret.
						me.updateCaret(editor);

						// Update the tool buttons
						me.updateTools(editor);*/

						break;

					case 'removeFormat':
						editor.html(editor.text());
						//document.execCommand(cmd, false, null);

						//var selection = window.getSelection().toString();
						//document.execCommand('insertText', false, selection);

						break;

					default:
						document.execCommand(cmd, false, null);

						break;
				}
			}
		},
		
		format: function (ignoreImage, card) {
			// Get the card being formated.
			card = card || $('#cards .card .text:focus').parents('.card');

			// Get side one and two.
			var sideOne = card.find('.text:eq(0)');
			var sideTwo = card.find('.text:eq(1)');
			
			// Determine if side two has an image
			var hasImage = sideTwo.find('.img').attr('src') !== undefined;

			if (hasImage !== true || ignoreImage === true) {
				// Clean the html
				var html = me.clean(sideOne);
				
				if (html !== '') {
					// Format the html
					//var side1 = side0.replace(/<u>/igm, '<u class="underline">');
					//var side1 = $(side0).find('u').addClass('side1');
					
					if (card.attr('new') === undefined) {
						// Get the card id.
						var id = card.attr('_id');
						
						// Get the card record.
						var record = nimins.tables.cards.get(id);
						
						record.update({text0: html, text1: html});
					}
					else {
						// Set side two.
						sideTwo.html(html);
						
						return html;
					}
				}
			}
			
			return '';
		},

		removeImage: function (img) {
			var hasImage = false;
			
			var src = img.attr('src');

			if (src !== undefined) {
				// Split the src uri.
				var split = src.split('/');
				var file = split[split.length - 1];
				
				// Get the uri to the image in dropbox
				var uri = encodeURI('/Public/{0}/{1}/{2}'.format(nimins.appName, nimins.deck.id, file));
				
				// Delete the file from Dropbox.
				//nimins.dropbox.remove(uri);
			}

			// Hide the image and remove the src attribute.
			img.removeAttr('src').removeAttr('uri').hide();
			
			// Set the container as fake
			img.parent().removeClass('real').addClass('fake');
			
			// Hide the remove button
			img.parent().find('.remove').hide();
			
			// Determine if we can hide the parent containers
			img.parents('.card').find('.img').each(function () {
				if ($(this).attr('uri') !== undefined) {
					hasImage = true;
				}
			});

			if (hasImage === false) {
				// Hide the image containers since no images exist.
				img.parents('.card').find('.image').removeClass('real fake');
			}
		},

		tab: function (e) {
			e.preventDefault();

			// Gets or sets if the user is tabbing in reverse.
			var isBackwards = false;

			// Control key is down, do an indent or outdent.
			if (e.ctrlKey === true) {
				var command  = 'indent';

				if (e.shiftKey === true) {
					command = 'outdent';
				}

				// Execute the command
				me.execute({command: command});
			}
			else if (e.shiftKey === true) {
				isBackwards = true;
			}

			// Get an array of the visible card contents.
			var elements = $('#cards .card .text:visible');

			// Get the index of the currently focused content.
			var index = elements.index($('#cards .card .text:focus'));

			if (isBackwards === true) {
				if (index === 0) {
					return;
				}

				// Decrease our index.
				index = (index > 0) ? index - 1 : 0;
			}
			else {
				// Check to see if we are at the end of the deck.
				if (index === elements.length - 1) {
					// Create a new card.
					nimins.card.create();

					return;
				}
				else {
					// Increase our index.
					index++;
				}
			}
			
			// Moves the caret to the end on focus.
			me.focusEnd = true;

			// Focus the correct editor.
			$(elements[index]).focus();
		},

		updateCaret: function () {
			// Get the currently selected element.
			var element = $('#cards .card .text:focus');

			var selection = window.getSelection();
			var range = document.createRange();

			if (element.text() === '') {
				// Clear the div
				element.empty();

				// Call on a timeout with no delay.
				setTimeout(function () {
					// Editor is empty, add a starting div.
					element.append($('<div/>').html('&nbsp;'));

					// Select the empty div.
					range.selectNodeContents(element.find('div')[0]);

					// Remove and add our own range.
					selection.removeAllRanges();
					selection.addRange(range);
				});
			}
			else if (me.focusEnd === true) {
				// Move caret to end of the text.
				range.selectNodeContents(element[0]);
				range.collapse(false);
				selection.removeAllRanges();
				selection.addRange(range);
			}
		},

		updateTools: function () {
			// Get the focused element
			var element = $('#cards .card .text:focus');

			// Get the tools container
			var tools = $('#tools');

			// Check to see if the tools still exist.
			if (tools.length === 0) {
				// Recreate the tools.
				tools = $($('#tools-template').html()).appendTo('body').hide();
			}

			// No element is focused
			if (element.length === 0) {
				// Hide the tools
				tools.hide();

				// Hide the tools containers
				return tools.parents('.card').find('.tools').hide();
			}

			var top;

			var pParent = $('#tools').parents('.card');
			var cParent = element.parents('.card');

			// Determine if we moved to a new card.
			if (pParent.attr('_id') !== cParent.attr('_id')) {
				// Hide the .tools container.
				pParent.find('.tools').hide();
			}

			if (nimins.navigator.type === 'iPhone') {
				tools.appendTo('#top').show();
				
				// Card top position
				top = $('#content').scrollTop() + cParent.position().top - 80;
			}
			else {
				var parent = element.parents('.side').find('.tools');
				tools.appendTo(parent).show();
				// Show the .tools container.
				cParent.find('.tools').show();
				
				// Card top position
				top = $('#content').scrollTop() + cParent.position().top - 40;
			}
			
			// Scroll to the top.	
			setTimeout(function () {
				// Scroll the card to the top
				$('#content').scrollTop(top);
			});
		},

		upload: function (file, side, input) {
			/// <summary>Uploads an image to the user's public Dropbox directory.</summary>
			/// <param name="file" type="File">The file to upload.</param>
			/// <param name="side" type="jQuery">The side that is uploading the file.</param>
			/// <param name="input" type="jQuery" optional="true">The file upload containing the file.</param>

			var xhrListener;

			var S4 = function () {
				/// <summary>Generates random bytes for our name.</summary>
				/// <returns type="String">Random bytes</returns>
				return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
			};

			var onCompleted = function (side, src, path) {
				// Get the card the side is a part of.
				var card = side.parents('.card');

				// Get the id of the card the side belong to.
				var id = card.attr('_id');

				// Get the side index of the card.
				var index = side.attr('data-side');

				if (card.attr('data-new-card') === 'true') {
					// Set the image for the new card.
					side.find('.img')
						.attr({ uri: src, src: src })
						.on('load', function () {
							$(this).show();
							
							card.find('.image')
								.addClass('fake');
								
							$(this).parent()
								.removeClass('fake')
								.addClass('real');
								
							// Show the remove button
							$(this).parent().find('.remove').show();
							
							// Scroll the card up to be on screen.
							$(window).scrollTop($('#cards .card[data-new-card="true"]').position().top);
						});
					
				}
				else {
					// Update the record
					var record = nimins.tables.cards.get(id);
					record.set('image' + index, encodeURI(src));
				}
				/// Remove the xhr listener.
				nimins.dropbox.onXhr.removeListener(xhrListener);
				
				// Remove the progress bar.
				$('#progress .fill[path="' + path + '"]').remove();
				
				if ($('#progress .fill').length === 0) {
					// All uploads are finished, hide the container.
					$('#progress').hide();
				}				
			};

			// The file extension.
			var ext = file.type.match('image\/(.*)')[1];

			// Generate some random numbers and encode to Base 64 and add the extension
			var randomName = btoa((S4() + S4() + S4()).toLowerCase()) + '.' + ext;

			// Get the upload path
			var path = 'Public/{0}/{1}/{2}'.format(nimins.appName, nimins.deck.id, randomName);

			// Get the public image url
			var src = 'https://dl.dropboxusercontent.com/u/{0}/{1}/{2}/{3}'.format(
				nimins.dropbox.dropboxUid(),
				nimins.appName,
				nimins.deck.id,
				randomName);

			// Show the progress bar.
			$('#progress').show();

			$('<div/>')
				.attr('path', path)
				.addClass('fill')
				.css('width', '0%')
				.appendTo('#progress');		

			// Setup our progress listener.
			xhrListener = nimins.dropbox.onXhr.addListener(function (dbXhr) {				
				(function (dbXhr, path) {
					dbXhr.xhr.upload.onprogress = function (e) {
						// Get the fill bar.
						var fill = $('#progress .fill[path="' + path + '"]');

						// Set the width.
						fill.css('width', ((e.loaded / e.total) * 100) + '%');
					};
				}(dbXhr, path));

				return true;
			});
			
			// Upload the file to Dropbox.
			nimins.dropbox.writeFile(path, file, function () {
				onCompleted(side, src, path); 
			});

			// Remove the input.
			if (input !== undefined) {
				input.remove();
			}
		},
	};

	$(function () {

		// #region Editor Event Handlers

		// Editor Upload Change Event Handler
		$(document).on('change', '#cards .card input.upload', function (e) {
			/// Prevent further actions
			e.preventDefault();

			/// Card side
			var side = $(this).parent('.side');

			/// Remove any images uploaded to the editor.
			me.removeImage(side.find('.img'));

			/// File to upload
			var file = this.files[0];

			/// Upload the file.
			me.upload(file, side, $(this));
		});

		// Editor Upload Button Event Handler
		nimins.navigator.action('#tools button.upload', function () {
			// Trigger the file uploader.
			$(this).parents('#editor').find('input').trigger('click');
		});

		// Editor Remove Button Event Handler
		nimins.navigator.action('#cards .image button.remove', function () {
			
			// Get the card for this event
			var card = $(this).parents('.card');		

			if (card.attr('data-new-card') === 'true') {
				// Remove any images uploaded to the editor.
				me.removeImage($(this).parent().find('.img'));
			}
			else {
				var side = $(this).parents('.side').attr('data-side');
				var record = nimins.tables.cards.get(card.attr('_id'));
				record.set('image' + side, null);
			}
		});

		// Editor DragEnter Event Handler
		$(document).on('dragenter', '#cards .card .text', function () {
			// Remove the css class
			$(this).addClass('drag');
		});

		// Editor DragLeave Event Handler
		$(document).on('dragleave', '#cards .card .text', function () {
			// Remove the css class
			$(this).removeClass('drag');
		});

		// Editor Drop Event Handler
		$(document).on('drop', '#cards .card .text', function (e) {
			// Prevent further actions
			event.preventDefault();
			event.stopPropagation();
		
			// Card side
			var side = $(this).parent('.side');			
			
			// Remove the css class
			$(this).removeClass('drag');

			// Remove any images uploaded to the editor.
			me.removeImage(side.find('.img'));

			// File to upload
			var file = e.originalEvent.dataTransfer.files[0];
			
			// Upload the file.
			me.upload(file, side);
		});

		// Editor Paste Event Handler
		$(document).on('paste', '#cards .card .text', function (e) {
			// Card side
			var side = $(this).parent('.side');			
			
			// Gets the clipboard items.
			var items = e.originalEvent.clipboardData.items;

			// Iterate the items.
			for (var i = 0; i < items.length; i++) {
				var type = items[i].type;

				// Get the first item of an image type.
				if (type.indexOf('image') !== -1) {
					// Remove any images uploaded to the editor.
					me.removeImage(side.find('.img'));

					// The image blob.
					var file = items[i].getAsFile();

					// Upload the file.
					me.upload(file, side);

					break;
				}
			}
		});

		// Editor Keydown Event Handler
		$(document).on('keydown', '#cards .card .text', function (e) {
			if (e.which === 9) {
				me.tab(e);
			}
			else if (e.which === 13 &&
				e.ctrlKey === true) {
				me.format(true);	
			}
			else if (e.which === 188 &&
				e.ctrlKey === true) {
				// Subscript
				me.execute({command: 'subscript'});
			}
			else if (e.which === 190 &&
				e.ctrlKey === true) {
				// Superscript
				me.execute({command: 'superscript'});
			}
		});

		// Editor Focus Event Handler
		$(document).on('focus', '#cards .text', function () {
			var text = $(this);

			// Clear the current timer.
			clearTimeout(me.timer);

			// Set the side as focused as well
			$(this).parents('.side').attr('focused', true);

			$('body').attr('focused', true);

			// Set a new timer, this reduces the flashing needed when focusing and bluring the editors.
			me.timer = setTimeout(function () {
				// Update the tools
				me.updateTools();

				// Update the caret.
				me.updateCaret();
			}, 10);
			
		});

		// Editor Blur Event Handler
		$(document).on('blur', '#cards .text', function () {
			var text = $(this);

			// Check to see if we are in source mode
			if ($(this).attr('data-source') === true) {
				// Return to html mode.
				$(this).html($(this).text());

				// Remove the attribute.
				$(this).removeAttr('data-source');
			}

			// Clean up the html
			me.clean($(this));

			// Clear the current timer.
			clearTimeout(me.timer);

			/// Set a new timer, this reduces the flashing needed when focusing and bluring the editors of the same card.
			me.timer = setTimeout(function () {
				// Update the tools
				me.updateTools();
			}, 10);
		});

		/// Mousedown event handler for the tool buttons.
		nimins.navigator.actionDown('#tools button.button', function (e) {
			if ($(this).attr('data-cmd') !== undefined &&
				$(this).hasClass('disabled') !== true) {
				/// Execute the button.
				me.execute({
					command: $(this).attr('data-cmd'), 
					character: $(this).attr('data-char')
				});
			}
		});

		// Tab Click Handlers
		nimins.navigator.actionDown('#tools button.tab', function (e) {
			// Remove any active classes.
			$('#tools .tab.active').removeClass('active');
			$('#tools .tool-tab.active').removeClass('active');

			// Set the clicked tab as active.
			$(this).addClass('active');

			// Get the selected tab data-id.
			var id = $(this).attr('data-tab');

			// Set the tool-tab as active.
			$('#tools .tool-tab[data-tab="' + id + '"]').addClass('active');
		});
		
		/// Editor dblclick event handler.
		$(document).on('dblclick', '#cards .card .text', function () {
			var selection = window.getSelection();
			var str = selection.toString();
	
			/// Check to see if we have the trailing space selected.
			if (str.substring(str.length - 1) === ' ') {
				/// Collapse the selection one character to get rid of the space.
				selection.modify('extend', 'left', 'character');
			}
		});

		// #endregion

	});

	return me;

}(window.nimins, window.jQuery));
var Tesseract;
Tesseract = window.Tesseract || {};
Tesseract.Util = Tesseract.Util || {};
Tesseract.Util.Selection = {

	// Various class names that will be applied programmatically to elements as a
	// widget's selection state changes.
	ClassName: Object.freeze({

		// Denotes an element as containing selectable elements.
		selectable: "ui-selectable",

		// Denotes a selectable element.
		selected: "ui-selectee",

		// Denotes a selectee element that has focus. Note that only the selectable
		// element itself will receive the :focus pseudo-class; individual
		// selectable items are not given a tabindex, and therefore cannot receive
		// native focusing.
		focused: "ui-focused",

		// Denotes a selectee element as being the anchor, used when applying
		// changes to the selection with the SHIFT key when multiple selection mode
		// is active.
		anchor: "ui-anchor"
	}),

	// Event names and methods.
	Event: Object.freeze({

		// The activate event fires when the user activates one or more selected
		// items, either by double-clicking with the mouse or by hitting the enter
		// key with the keyboard.
		activate: 'activate',

		// The beforeChangeSelection event fires immediately before the selection
		// state changes. This event can be cancelled, thus preventing the
		// selection state from changing. Subscribers are given the proposed
		// newSelection as an argument, and may alter it at this time.
		beforeChangeSelection: 'beforeChangeSelection',

		// The afterChangeSelection event fires immediately after the selection
		// state changes. This event cannot be cancelled.
		afterChangeSelection: 'afterChangeSelection',

		// The changeFocus event fires when the focus changes. This cannot be
		// cancelled.
		changeFocus: 'changeFocus'

	}),

	// A list of possible selection mode settings.
	Mode: Object.freeze({

		// No selection is permitted.
		None: "None",

		// Only one item may be selected at a time.
		Single: "Single",

		// The CTRL and SHIFT keys may be used to select multiple items.
		Multiple: "Multiple"
	}),

	// Directions that can be passed into Selection.prototype.peek.
	Direction: Object.freeze({

		// Locate the element above the focused element.
		Above: 'above',

		// Locate the element below the focused element.
		Below: 'below',

		// Locate the element to the left of the focused element.
		Left:  'left',

		// Locate the element to the right of the focused element.
		Right: 'right'
	})
};

Tesseract.Util.Selection.InterfaceBase = (function () {
	"use strict";

	function InterfaceBase(selection) {
		/// <summary>Abstract interface definition.</summary>
		/// <param name="selection" type="Tesseract.Util.Selection.Selection">
		///   Selection instance.
		/// </param>

		if (selection instanceof Tesseract.Util.Selection.Selection === false) {
			throw new TypeError("Invalid constructor.");
		}

		this.between = function between(target) {
			/// <summary>
			///   Get a list of all items between the anchor and the target item.
			/// </summary>
			/// <param name="target" type="Object">Selectable item.</param>
			/// <returns type="Array" />

			var a = selection.anchor || selection.firstItem,
				b = target || selection.firstItem;

			if (!a || !b) {
				return [];
			}

			if (a === b) {
				return [ a ];
			}

			return selection.between(a, b).filter(Boolean);
		};
	}


	InterfaceBase.prototype.attach = function attach() {
		throw new Error("Not implemented.");
	};

	InterfaceBase.prototype.detach = function detach() {
		throw new Error("Not implemented.");
	};

	return InterfaceBase;
}());

Tesseract.Util.Selection.KeyboardInterface = (function () {
	"use strict";

	var ns = Tesseract.Util.Selection,
		keys = {
			SpaceBar:   32,
			UpArrow:    38,
			LeftArrow:  37,
			RightArrow: 39,
			DownArrow:  40,
			Enter:      13
		};

	function KeyboardInterface(selection) {
		/// <summary>Provide and respond to keyboard interaction events.</summary>
		/// <param name="selection" type="Tesseract.Util.Selection.Selection">
		///   Selection container.
		/// </param>

		Tesseract.Util.Selection.InterfaceBase.apply(this, arguments);

		var self = this;

		function spaceBar(event) {
			/// <summary>React to the user pressing the spacebar.</summary>
			/// <param name="event" type="jQuery.Event">A jQuery Event.</param>

			if (
				selection.mode === ns.Mode.None ||
					selection.normalizeFocus() === false
			) {
				return false;
			}

			if (selection.mode === ns.Mode.Single) {
				return spaceBar.single(event);
			}

			return spaceBar.multiple(event);
		}

		spaceBar.single = function (event) {
			/// <summary>
			///   React to the user pressing the spacebar in single selection mode.
			/// </summary>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			var item = selection.focused,
				unselect = selection.selected;

			if (
				unselect.indexOf(item) === -1 &&
					selection.trySetSelection(unselect, [ item ], event)
			) {
				selection.anchor = item;
				return true;
			}

			return false;
		};

		spaceBar.multiple = function (event) {
			/// <summary>React to the spacebar in multiple selection mode.</summary>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			if (event.ctrlKey && event.shiftKey) {
				return spaceBar.multiple.ctrlShift(event);
			}

			if (event.ctrlKey) {
				return spaceBar.multiple.ctrl(event);
			}

			if (event.shiftKey) {
				return spaceBar.multiple.shift(event);
			}

			return spaceBar.multiple.noModifier(event);
		};

		spaceBar.multiple.ctrlShift = function (event) {
			/// <summary>React to the Ctrl + Shift + Space Bar combination.</summary>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			var unselect = [],
				select = self.between(selection.focused);

			return selection.trySetSelection(unselect, select, event);
		};

		spaceBar.multiple.ctrl = function (event) {
			/// <summary>React to the Ctrl + Space Bar combination.</summary>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			var select, unselect,
				item = selection.focused;

			if (selection.selected.indexOf(item) === -1) {
				select = [ item ];
				unselect = [];
			} else {
				select = [];
				unselect = [ item ];
			}

			if (selection.trySetSelection(unselect, select, event)) {
				selection.anchor = selection.focused;
				return true;
			}

			return false;
		};

		spaceBar.multiple.shift = function (event) {
			/// <summary>React to the Shift + Space Bar combination.</summary>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			var unselect = selection.selected,
				select = self.between(selection.focused);

			return selection.trySetSelection(unselect, select, event);
		};

		spaceBar.multiple.noModifier = function (event) {
			/// <summary>React to the Space Bar without modifiers.</summary>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			var unselect = selection.selected,
				select = [ selection.focused ];

			if (selection.trySetSelection(unselect, select, event)) {
				selection.anchor = selection.focused;
				return true;
			}

			return false;
		};

		function move(direction, event) {
			/// <summary>React to the user pressing a directional key.</summary>
			/// <param name="direction" type="String">
			///   Tesseract.Util.Selection.Direction that was pressed by the user.
			/// </param>
			/// <param name="event" type="jQuery.Event">
			///   A jQuery event object.
			/// </param>
			/// <returns type="Boolean" />

			var next = selection.peek(direction);

			if (!next) {
				return false;
			}

			switch (selection.mode) {
			case ns.Mode.None:
				selection.anchor = selection.focused = next;
				return true;

			case ns.Mode.Single:
				return move.single(next, event);

			case ns.Mode.Multiple:
				return move.multiple(next, event);
			}

			return false;
		}

		move.single = function (next, event) {
			/// <summary>
			///   React to the user moving the cursor when single selection mode is
			///   active.
			/// </summary>
			/// <param name="next" type="Object">
			///   The next item that will receive focus.
			/// </param>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>
			/// <returns type="Boolean" />

			var unselect = selection.selected,
				select = [ next ];

			if (event.ctrlKey || selection.trySetSelection(unselect, select, event)) {
				selection.anchor = selection.focused = next;
				return true;
			}

			return false;
		};

		move.multiple = function (next, event) {
			/// <summary>
			///   React to the user moving the cursor when multiple selection mode is
			///   active.
			/// </summary>
			/// <param name="next" type="Object">
			///   The next item that will be moved to.
			/// </param>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>
			/// <returns type="Boolean" />

			if (event.ctrlKey && event.shiftKey) {
				return move.multiple.ctrlShift(next, event);
			}

			if (event.ctrlKey) {
				return move.multiple.ctrl(next, event);
			}

			if (event.shiftKey) {
				return move.multiple.shift(next, event);
			}

			return move.multiple.noModifier(next, event);
		};

		move.multiple.ctrlShift = function (next, event) {
			/// <summary>React to the Ctrl + Shift + Arrow combination.</summary>
			/// <param name="next" type="Object">The next item.</param>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			var unselect = [],
				select = self.between(next);

			if (selection.trySetSelection(unselect, select, event)) {
				selection.focused = next;
				return true;
			}

			return false;
		};

		move.multiple.ctrl = function (next) {
			/// <summary>React to the Ctrl + Arrow combination.</summary>
			/// <param name="next" type="Object">The next item.</param>
			selection.focused = next;
			return true;
		};

		move.multiple.shift = function (next, event) {
			/// <summary>React to the Shift + Arrow combination.</summary>
			/// <param name="next" type="Object">The next item.</param>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			var unselect = selection.selected,
				select = self.between(next);

			if (selection.trySetSelection(unselect, select, event)) {
				selection.focused = next;
				return true;
			}

			return false;
		};

		move.multiple.noModifier = function (next, event) {
			/// <summary>React to an Arrow key with no modifier.</summary>
			/// <param name="next" type="Object">The next item.</param>
			/// <param name="event" type="jQuery.Event">A jQuery event.</param>

			var unselect = selection.selected,
				select = [ next ];

			if (selection.trySetSelection(unselect, select, event)) {
				selection.anchor = selection.focused = next;
				return true;
			}

			return false;
		};

		function keyDown(event) {
			/// <summary>
			///   React to the user pushing a key while the widget has focus.
			/// </summary>
			/// <param name="event" type="jQuery.Event">
			///   A jQuery event corresponding to the keypress.
			/// </param>

			switch (event.which) {
			case keys.SpaceBar:
				spaceBar(event);
				break;

			case keys.UpArrow:
				move(ns.Direction.Above, event);
				break;

			case keys.DownArrow:
				move(ns.Direction.Below, event);
				break;

			case keys.LeftArrow:
				move(ns.Direction.Left, event);
				break;

			case keys.RightArrow:
				move(ns.Direction.Right, event);
				break;

			case keys.Enter:
				selection.activate(event);
				break;

			default:
				return;
			}

			event.preventDefault();
			event.stopPropagation();
		}

		this.attach = function () {
			var map = {};
			map["keydown.Selection" + selection.id] = keyDown;
			$(selection.parentElement).on(map);
		};
	}

	KeyboardInterface.prototype =
		Object.create(Tesseract.Util.Selection.InterfaceBase.prototype);

	return KeyboardInterface;
}());

Tesseract.Util.Selection.MouseInterface = (function () {
	"use strict";

	var ns = Tesseract.Util.Selection;

	function MouseInterface(selection) {
		/// <summary>Provide and react to mouse interaction events.</summary>
		/// <param name="selection" type="Tesseract.Util.Selection.Selection">
		///   Selection container.
		/// </param>

		Tesseract.Util.Selection.InterfaceBase.apply(this, arguments);

		var self = this;

		function single(event, item) {
			/// <summary>React to a mouse click in single selection mode.</summary>
			/// <param name="event" type="jQuery.Event">A mouse click.</param>
			/// <param name="item" type="Object">The item to select.</param>
			/// <returns type="Boolean" />

			if (item === undefined) {
				item = selection.getItemByElement(event.currentTarget);
			}

			var unselect = selection.selected,
				select = [ item ];

			if (selection.trySetSelection(unselect, select, event)) {
				selection.anchor = selection.focused = item;
				return true;
			}

			return false;
		}

		function multiple(event) {
			/// <summary>React to a mouse click in multiple selection mode.</summary>
			/// <param name="event" type="jQuery.Event">
			///   A jQuery event corresponding to the mouse click.
			/// </param>
			/// <returns type="Boolean" />

			if (event.ctrlKey && event.shiftKey) {
				return multiple.ctrlShift(event);
			}

			if (event.ctrlKey) {
				return multiple.ctrl(event);
			}

			if (event.shiftKey) {
				return multiple.shift(event);
			}

			return multiple.noModifier(event);
		}

		multiple.ctrlShift = function (event) {
			/// <summary>
			///   React to a mouse click in multiple selection mode when the control
			///   and shift modifier are active.
			/// </summary>
			/// <param name="event" type="jQuery.Event">
			///   A jQuery event corresponding to the mouse click.
			/// </param>
			/// <returns type="Boolean" />

			var element = event.currentTarget,
				item = selection.getItemByElement(element),
				unselect = [],
				select = self.between(item);

			if (selection.trySetSelection(unselect, select, event)) {
				selection.focused = item;
				return true;
			}

			return false;
		};

		multiple.ctrl = function (event) {
			/// <summary>
			///   React to a mouse click in multiple selection mode when the control
			///   modifier is active.
			/// </summary>
			/// <param name="event" type="jQuery.Event">
			///   A jQuery event corresponding to the mouse click.
			/// </param>
			/// <returns type="Boolean" />

			var select, unselect,
				element = event.currentTarget,
				item = selection.getItemByElement(element);

			if (selection.selected.indexOf(item) === -1) {
				select = [ item ];
				unselect = [];
			} else {
				select = [];
				unselect = [ item ];
			}

			if (selection.trySetSelection(unselect, select, event)) {
				selection.anchor = selection.focused = item;
				return true;
			}

			return false;
		};

		multiple.shift = function (event) {
			/// <summary>
			///   React to a mouse click in multiple selection mode when the shift
			///   modifier is active.
			/// </summary>
			/// <param name="event" type="jQuery.Event">
			///   A jQuery event corresponding to the mouse click.
			/// </param>
			/// <returns type="Boolean" />

			var element = event.currentTarget,
				item = selection.getItemByElement(element),
				unselect = selection.selected,
				select = self.between(item);

			// Try to select all items between this item and the anchor.
			if (selection.trySetSelection(unselect, select, event)) {
				selection.focused = item;
				return true;
			}

			return false;
		};

		multiple.noModifier = function (event) {
			/// <summary>
			///   React to a mouse click in multiple selection mode when no modifier
			///   is active.
			/// </summary>
			/// <param name="event" type="jQuery.Event">
			///   A jQuery event corresponding to the mouse click.
			/// </param>
			/// <returns type="Boolean" />

			var element = event.currentTarget,
				item = selection.getItemByElement(element),
				unselect = selection.selected,
				select = [ item ];

			if (selection.trySetSelection(unselect, select, event)) {
				selection.anchor = selection.focused = item;
				return true;
			}

			return false;
		};

		function select(event) {
			/// <summary>React to the user selecting an item.</summary>
			/// <param name="event" type="jQuery.Event">
			///   A jQuery event corresponding to the mouse selection event.
			/// </param>

			if (event.which !== 1) {
				return;
			}

			switch (selection.mode) {
			case ns.Mode.None:
				return;

			case ns.Mode.Single:
				single(event);
				break;

			case ns.Mode.Multiple:
				multiple(event);
				break;
			}

			event.preventDefault();
			event.stopPropagation();
		}

		function focus(event) {
			/// <summary>
			///   When the mouse hovers over an element, move focus to that element.
			/// </summary>
			/// <param name="event" type="jQuery.Event">jQuery Event object.</param>
			selection.focused = selection.getItemByElement(event.currentTarget);
			selection.focusInHandled = true;
			selection.parentElement.focus();
			selection.focusInHandled = false;
			event.stopPropagation();
		}

		function blur(event) {
			/// <summary>When the mouse leaves the widget, clear the focus.</summary>
			/// <param name="event" type="jQuery.Event">jQuery event object.</param>
			selection.focused = null;
			event.stopPropagation();
		}

		function down(event) {
			/// <summary>Respond to the mouse button's "down" event.</summary>
			/// <param name="event" type="jQuery.Event">jQuery event object.</param>
			select(event);
		}

		function dblClick(event) {
			/// <param name="event" type="jQuery.Event">Mouse click</param>
			focus(event);

			var element = event.currentTarget,
				item = selection.getItemByElement(element);

			// In most browsers, the order of events leading to a double-click is:
			// down, up, click, down, up, click, dblClick.
			//
			// In IE, the order is: down, up, click, down, up, dblClick.
			//
			// If selection mode is single, then make sure this item is selected
			// before firing the activate event.
			//
			// Note: in "multiple" mode, we permit any selection or deselection to
			// stand. This mirrors how Windows 7 explorer handles it.
			if (
				selection.mode === ns.Mode.Single &&
					selection.selected.indexOf(item) === -1 &&
					single(event, item) === false
			) {
				return;
			}

			selection.activate(event);
		}

		this.attach = function attach() {

			var parent = $(selection.parentElement),
				map = {};

			if (selection.focusFollowsMouse) {
				map["mouseenter.Selection" + selection.id] = focus;
				map["mouseleave.Selection" + selection.id] = blur;
			}

			map["mousedown.Selection" + selection.id] = down;
			map["dblclick.Selection" + selection.id] = dblClick;
			parent.on(map, selection.elementSelector);
		};

	}

	MouseInterface.prototype =
		Object.create(Tesseract.Util.Selection.InterfaceBase.prototype);

	return MouseInterface;

}());

Tesseract.Util.Selection.Config = (function () {
	"use strict";

	// The selection namespace.
	var ns = Tesseract.Util.Selection,
		validate = Tesseract.Util.Validation,
		isFunction = validate.isOfType(Function, "Function");

	function validateElementSelector(value) {
		/// <summary>Validate a value as being a required string.</summary>
		/// <param name="value" type="String">The value to validate.</param>
		/// <returns type="String" />

		if (value === null || value === undefined) {
			throw new RangeError("The element selector is required.");
		}

		value = String(value).trim();
		if (!value) {
			throw new TypeError("The element selector may not be blank.");
		}

		return value;
	}


	return Tesseract.Util.Validation.createValidator({
		mode:              [ validate.isRequired, validate.isKeyOf(ns.Mode) ],
		parentElement:     validate.isOfType(Element, "DOM Element"),
		firstItem:         validate.isRequired,
		getElementByItem:  isFunction,
		getItemByElement:  isFunction,
		getItemAbove:      isFunction,
		getItemBelow:      isFunction,
		getItemLeft:       isFunction,
		getItemRight:      isFunction,
		between:           isFunction,
		focusFollowsMouse: Boolean,
		elementSelector:   validateElementSelector
	}, {
		mode:              ns.Mode.Multiple,
		focusFollowsMouse: true
	});
}());

Tesseract.Util.Selection.Selection = (function () {
	"use strict";

	var selectionId = 1,
		property = { enumerable: true, configurable: true },
		ns = Tesseract.Util.Selection,
		util = {};

	util.get = function (prop) {
		return this[prop];
	};

	util.set = function (prop, value) {
		this[prop] = value;
	};

	util.wrapEvent = function (event, type) {
		/// <summary>
		///   Wrap a provided event in a new event.  If the provided event is not
		///   present, create a new event from scratch.
		/// </summary>
		/// <param name="event" type="jQuery.Event">A jQuery event.</param>
		/// <param name="type" type="String">The new event type.</param>
		/// <returns type="jQuery.Event" />
		return event ?
				new $.Event(event, { type: type }) :
				new $.Event(type);
	};

	function Selection(config) {

		// Break the relationship here.
		config = new ns.Config(config);

		var instance = {
			self:           this,
			id:             selectionId++,
			focusInHandled: false,
			anchor:         null,
			focused:        null,
			config:         config,
			selected:       [],
			interfaces:     []
		};

		function saveAnchorOrFocused(type, item) {
			/// <summary>
			///   Remember the state of the "anchor" or "focused" items, both of
			///   which require DOM modification when they change.
			/// </summary>
			/// <param name="type" type="String">Either "anchor" or "focused"</param>
			/// <param name="item" type="Object" optional="true">
			///   The new value for this item.
			/// </param>

			var parent, newElement, oldElement;

			if (item === undefined) {
				item = null;
			}

			if (item !== null) {
				newElement = instance.self.getElementByItem(item);
				parent = instance.self.parentElement;
				if (parent && $.contains(parent, newElement) === false) {
					throw new RangeError("Item is not in widget.");
				}
			}

			if (instance[type]) {
				oldElement = instance.self.getElementByItem(instance[type]);
				$(oldElement).removeClass(ns.ClassName[type]);
				instance[type] = null;
			}

			if (newElement) {
				$(newElement).addClass(ns.ClassName[type]);
				instance[type] = item;
			}
		}

		function focusIn() {
			if (instance.focusInHandled !== true) {
				instance.self.focused =
					instance.self.anchor || instance.self.firstItem;
			}
		}

		function focusOut() {
			instance.self.focused = null;
		}

		instance.interfaces.push(new ns.KeyboardInterface(this));
		instance.interfaces.push(new ns.MouseInterface(this));

		[
			"getElementByItem", "getItemByElement", "getItemAbove", "getItemBelow",
			"getItemLeft", "getItemRight", "between"
		].forEach(function (name) {

			Object.defineProperty(this, name, $.extend({
				get: Object.getOwnPropertyDescriptor(instance.config, name).get,
				set: Object.getOwnPropertyDescriptor(instance.config, name).set
			}, property));

		}, this);

		Object.defineProperties(this, {

			id: $.extend({ get: util.get.bind(instance, "id") }, property),

			anchor: $.extend({
				get: util.get.bind(instance, "anchor"),
				set: saveAnchorOrFocused.bind(instance, "anchor")
			}, property),

			focused: $.extend({
				get: util.get.bind(instance, "focused"),
				set: function (value) {
					var oldValue = instance.self.focused;
					saveAnchorOrFocused.call(instance, "focused", value);

					if (value !== oldValue) {
						$(instance.self).triggerHandler(ns.Event.changeFocus, {
							oldValue: oldValue,
							newValue: value
						});
					}
				}
			}, property),

			focusInHandled: $.extend({
				get: util.get.bind(instance, "focusInHandled"),
				set: function (value) {
					instance.focusInHandled = Boolean(value);
				}
			}, property),

			mode: $.extend({
				get: Object.getOwnPropertyDescriptor(instance.config, "mode").get,
				set: function (value) {

					if (value !== instance.self.mode) {
						if (value === ns.Mode.None) {
							if (!instance.self.trySetSelection(instance.selected, [])) {
								return;
							}
						} else if (value === ns.Mode.Single) {
							if (instance.selected.length > 0) {
								if (
									instance.self.trySetSelection(
										instance.selected,
										[ instance.selected[0] ]
									) === false
								) {
									return;
								}
							} else if (
								!instance.self.trySetSelection(instance.selected, [])
							) {
								return;
							}
						}

						instance.self.detach();
						instance.config.mode = value;
						instance.self.attach();
					}
				}
			}, property),

			parentElement: $.extend({
				get: Object.getOwnPropertyDescriptor(
					instance.config,
					"parentElement"
				).get,
				set: function (value) {
					if (value !== instance.self.parentElement) {
						instance.self.anchor = instance.self.focused = null;
						instance.self.detach();
						instance.config.parentElement = value;
						instance.self.attach();
					}
				}
			}, property),

			firstItem: $.extend({
				set: Object.getOwnPropertyDescriptor(instance.config, "firstItem").set,
				get: function () {
					var value = instance.config.firstItem;
					if (typeof value === "function") {
						value = value();
					}

					return value || null;
				}
			}, property),

			elementSelector: $.extend({
				get: Object.getOwnPropertyDescriptor(
					instance.config,
					"elementSelector"
				).get,
				set: function (value) {
					if (value !== instance.self.elementSelector) {
						instance.self.detach();
						instance.config.elementSelector = value;
						instance.self.attach();
					}
				}
			}, property),

			selected: $.extend({
				get: util.get.bind(instance, "selected"),
				set: function (value) {
					instance.self.trySetSelection(instance.selected, value);
				}
			}, property),

			focusFollowsMouse: $.extend({
				get: Object.getOwnPropertyDescriptor(
					instance.config,
					"focusFollowsMouse"
				).get,
				set: function (value) {
					if (value !== instance.self.focusFollowsMouse) {
						instance.self.detach();
						instance.config.focusFollowsMouse = value;
						instance.self.attach();
					}
				}
			}, property)

		});

		this.trySetSelection = function trySetSelection(unselect, select, event) {
			/// <summary>
			///   Change the current state of the selection. Fires and responds to
			///   the necessary events.
			/// </summary>
			/// <param name="unselect" type="Array" elementType="Object">
			///   A list of items to be unselected.
			/// </param>
			/// <param name="select" type="Array" elementType="Object">
			///   A list of items to be selected.
			/// </param>
			/// <param name="event" type="jQuery.Event" optional="true">
			///   An optional event that prompted this change. If provided, this will
			///   be used to construct the new events that fire as a result of
			///   selection changing.
			/// </param>
			/// <returns type="Boolean" />

			var newSelection, eventArgs, oldSelection = this.selected;

			select = (select || []).distinct();
			unselect =
				(unselect || []).distinct().except(select).intersect(oldSelection);

			select = select.except(oldSelection);

			if (this.mode === ns.Mode.None && select.length > 0) {
				throw new RangeError("Selection mode is None.");
			}

			if (this.mode === ns.Mode.Single && select.length > 1) {
				throw new RangeError("Selection mode is Single.");
			}

			newSelection = oldSelection.except(unselect).concat(select);

			eventArgs = {
				unselect:     unselect,
				select:       select,
				oldSelection: oldSelection,
				newSelection: newSelection
			};

			if (
				oldSelection.length === newSelection.length &&
					oldSelection.intersect(newSelection).length === oldSelection.length
			) {
				return true;
			}

			[ unselect, select, eventArgs ].forEach(Object.freeze, Object);

			if (
				$(this).triggerHandler(
					util.wrapEvent(event, ns.Event.beforeChangeSelection),
					eventArgs
				) === false
			) {
				return false;
			}

			$(unselect.map(this.getElementByItem).filter(Boolean))
				.removeClass(ns.ClassName.selected);

			$(select.map(this.getElementByItem).filter(Boolean))
				.addClass(ns.ClassName.selected);

			instance.selected = newSelection;

			$(this).triggerHandler(
				util.wrapEvent(event, ns.Event.afterChangeSelection),
				eventArgs
			);

			return true;
		};

		this.attach = function () {
			var map,
				eventNs = ".Selection" + instance.id,
				parent = this.parentElement;

			if (!parent) {
				return;
			}

			if (this.mode === ns.Mode.None) {
				return;
			}

			parent = $(parent);
			map = {};
			map["focusin"  + eventNs] = focusIn;
			map["focusout" + eventNs] = focusOut;
			parent.on(map);

			instance.interfaces.forEach(function (i) {
				i.attach();
			});

			parent.addClass(ns.ClassName.selectable);
			parent[0].tabIndex = 0;
		};

		this.destroy = function destroy() {
			this.anchor = this.focused = null;
			this.selected = [];
			this.detach();
			$(this).off();
			this.parentElement = null;
		};
	}

	Selection.prototype.activate = function activate(event) {
		/// <summary>Activate the selected items.</summary>
		/// <param name="event" type="jQuery.Event" optional="true">
		///   An optional jQuery event object that started the activation process.
		/// </param>
		/// <returns type="Object" />
		return $(this).triggerHandler(
			util.wrapEvent(event, ns.Event.activate),
			{ selected: this.selected }
		);
	};

	Selection.prototype.normalizeFocus = function normalizeFocus() {
		if (this.focused === null) {
			this.focused = this.firstItem;
		}

		return this.focused !== null;
	};

	Selection.prototype.peek = function peek(direction) {
		if (this.normalizeFocus() === false) {
			return null;
		}

		switch (direction) {
		case ns.Direction.Above:
			return this.getItemAbove(this.focused);

		case ns.Direction.Below:
			return this.getItemBelow(this.focused);

		case ns.Direction.Left:
			return this.getItemLeft(this.focused);

		case ns.Direction.Right:
			return this.getItemRight(this.focused);
		}

		throw new RangeError("Unrecognized direction.");
	};

	Selection.prototype.detach = function detach() {
		var eventNs = ".Selection" + this.id,
			element = this.parentElement;

		if (!element) {
			return;
		}

		$(element)
			.undelegate(eventNs)
			.unbind(eventNs)
			.removeClass(ns.ClassName.selectable);
	};

	Selection.prototype.tryRemove = function tryRemove(items) {
		/// <summary>
		///   Attempt to remove a set of items from the selected items. Since
		///   item deselection can be cancelled by events, this operation may
		///   fail.
		/// </summary>
		/// <param name="items" type="Array" />
		/// <returns type="Boolean" />

		if (this.trySetSelection(items) !== true) {
			return false;
		}

		var x, k, cursor, foundFocus, foundAnchor;

		foundFocus = false;
		foundAnchor = false;
		for (
			x = 0, k = items.length;
			x < k && foundFocus === false && foundAnchor === false;
			x += 1
		) {
			cursor = items[x];
			if (foundFocus === false && this.focused === cursor) {
				this.focused = null;
				foundFocus = true;
			}

			if (foundAnchor === false && this.anchor === cursor) {
				this.anchor = null;
				foundAnchor = true;
			}
		}

		return true;
	};

	return Selection;

}());

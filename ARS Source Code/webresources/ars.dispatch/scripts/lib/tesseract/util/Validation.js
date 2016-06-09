
var Tesseract;
Tesseract = window.Tesseract || {};
Tesseract.Util = Tesseract.Util || {};
Tesseract.Util.Validation = (function () {
	"use strict";

	var validation = {};

	function or(other) {
		var fn = this;

		function hodor(value, key) {
			var msg;
			try {
				return fn(value, key);
			} catch (e1) {
				msg = e1.message;
			}

			try {
				return other(value, key);
			} catch (e2) {
				e2.message = msg + " OR " + e2.message;
				throw e2;
			}
		}

		hodor.or = or; // hodor
		return hodor;
	}

	validation.isKeyOf = function isKeyOf(obj) {
		/// <summary>
		///   Produce a validation function that validates a value as being equal
		///   to one of the keys in the given object.
		/// </summary>
		/// <param name="obj" type="Object">
		///   Object containing potential key values.
		/// </param>
		/// <returns type="Function" />

		function isKey(value, key) {
			/// <summary>Validate a value as being equal to an object key.</summary>
			/// <param name="value" type="Object">The value to validate.</param>
			/// <param name="key" type="String">The name of the property</param>
			/// <returns type="String" />

			if (value === null || value === undefined) {
				return null;
			}

			if (Object.keys(obj).indexOf(value) !== -1) {
				return value;
			}

			throw new TypeError(
				key + " must be one of: " + Object.keys(obj).join(", ")
			);
		}

		isKey.or = or;
		return isKey;
	};

	validation.isArray = function isArray(value, key) {
		/// <summary>Validate a value as being an array.</summary>
		/// <param name="value" type="Object">The value to validate.</param>
		/// <param name="key" type="String">The name of the property</param>
		/// <returns type="Array" />

		if (value === null || value === undefined) {
			return null;
		}

		if (Array.isArray(value)) {
			return value.slice(0); // break reference
		}

		throw new TypeError(key + " must be an array.");
	};

	validation.isArray.or = or;

	validation.isOfType = function (type, typeName) {
		/// <param name="type" type="Function">Constructor function</param>
		/// <param name="typeName" type="String">Name of type</param>
		function isOfType(value, key) {
			if (value === null || value === undefined) {
				return null;
			}

			if (type === undefined) {
				throw new TypeError("type is not defined");
			}

			if (value instanceof type) {
				return value;
			}

			throw new TypeError(key + " must be of type " + typeName);
		}

		isOfType.or = or;
		return isOfType;
	};

	validation.isTypedArray = function isTypedArray() {
		/// <summary>
		///   Produce a validation function that validates a value as an array, and
		///   ensures that all elements in the array are of a specific type, as
		///   defined by the function(s) passed in as arguments.
		/// </summary>

		var args = $.makeArray(arguments);

		function isTypedArrayInner(value, key) {
			/// <summary>Validate all items in an array.</summary>
			/// <param name="value" type="Array">Array to validate</param>
			/// <param name="key" type="String">Name of the property.</param>
			var a = validation.isArray(value, key);

			if (a === null) {
				return null;
			}

			return a.map(function (el, idx) {
				return args.reduce(function (prev, cur) {
					return cur(el, key + "[" + idx + "]");
				}, null);
			});
		}

		isTypedArrayInner.or = or;
		return isTypedArrayInner;
	};

	validation.isRequired = function isRequired(value, key) {
		/// <summary>Validate a value as being required.</summary>
		/// <param name="value" type="Object">The value to validate.</param>
		/// <param name="key" type="String">The name of the property.</param>

		if (value === null || value === undefined) {
			throw new RangeError(key + " is required.");
		}

		return value;
	};

	validation.isRequired.or = or;

	validation.isString = function isString(value) {
		if (value === null || value === undefined) {
			return null;
		}

		return String(value).trim();
	};

	validation.isInteger = function isInteger(value, key) {
		if (value === null || value === undefined) {
			return null;
		}

		if (!isNaN(value) && parseInt(value, 10) === value) {
			return value;
		}

		throw new RangeError(key + " must be an integer.");
	};

	validation.isInteger.or = or;

	validation.inRange = function (min, max) {
		/// <summary>Produce a validation function for a range of numbers.</summary>
		/// <param name="min" type="Number">The range start limit.</param>
		/// <param name="max" type="Number">The range end limit.</param>
		/// <returns type="Function" />

		if (typeof min !== "number" || typeof max !== "number") {
			throw new TypeError("min and max values must be numeric (or Infinity)");
		}

		if (min >= max) {
			throw new RangeError("min value must be less than max value");
		}

		function inRange(value, key) {
			/// <summary>Validate a value as being a number.</summary>
			/// <param name="value" type="Object">The value to validate.</param>
			/// <param name="key" type="String">The name of the property</param>
			/// <returns type="Number" />

			if (value === null || value === undefined) {
				return null;
			}

			if (typeof value !== "number") {
				throw new TypeError(key + " must be a numeric value");
			}

			if (value < min || value > max) {
				throw new RangeError(key + " is not inside the specified range.");
			}

			return value;
		}

		inRange.or = or;
		return inRange;
	};

	validation.isNumber = function isNumber(value, key) {
		if (value === null || value === undefined) {
			return null;
		}

		if (!isNaN(value) && parseFloat(value) === value) {
			return value;
		}

		throw new TypeError(key + " must be numeric.");
	};

	validation.isNumber.or = or;

	validation.isDate = function isDate(value, key) {
		/// <summary>Validate a value as being a date.</summary>
		/// <param name="value" type="Object">The value to validate.</param>
		/// <param name="key" type="String">The name of the property.</param>

		if (value === null || value === undefined) {
			return null;
		}

		// valid dates are also numbers
		if (!isNaN(value) && value instanceof Date) {
			return value;
		}

		throw new TypeError(key + " must be a date.");
	};

	validation.isDate.or = or;

	validation.isCSSMeasurement = function isCSSMeasurement(value, key) {
		if (value === null || value === undefined) {
			return null;
		}

		value = String(value).trim().toLowerCase();

		if (value === "" || value === "auto") {
			return value;
		}

		var re = /^\d+(?:%|e[mx]|ch|rem|v[whm]|[cm]m|in|p[tcx])$/;

		if (re.test(value) === false) {
			throw new RangeError(key + " must be a valid CSS value.");
		}

		return value;
	};

	validation.isCSSMeasurement.or = or;

	validation.isJQuery = function isJQuery(value, key) {
		if (value === null || value === undefined) {
			return null;
		}

		if (value instanceof $) {
			return value;
		}

		throw new TypeError(key + " must be a jQuery object.");
	};


	validation.satisfiesRegEx = function (re) {
		var flags;

		if (re instanceof RegExp === false) {
			throw new TypeError("Invalid regular expression.");
		}

		flags =
			(re.ignoreCase ? "i" : "") +
			(re.global     ? "g" : "") +
			(re.multiline  ? "m" : "") +
			(re.sticky     ? "y" : "");

		re = new RegExp(re.source, flags);

		function satisfiesRegEx(value, key) {
			if (value === null || value === undefined) {
				return null;
			}

			if (re.test(value)) {
				return value;
			}

			throw new RangeError(key + " must satisfy " + re.toString());
		}

		satisfiesRegEx.or = or;
		return satisfiesRegEx;
	};

	function LazyLoad(func, args) {
		Object.defineProperties(this, {
			func: { value: func },
			args: { value: args }
		});
	}

	LazyLoad.prototype.load = function () {
		var Ctor = Function.prototype.bind.apply(this.func, [{}].concat(this.args));
		return new Ctor();
	};

	validation.lazyLoad = function (func, args) {
		if (typeof func !== "function") {
			throw new TypeError("can only lazy load a function");
		}

		if (args !== undefined && $.isArray(args) === false) {
			throw new TypeError("args to lazy function must be an array");
		}

		return new LazyLoad(func, args);
	};

	validation.createValidator = function createValidator(properties, defaults) {

		if (!properties) {
			throw new RangeError();
		}

		return function Validator(config) {

			var raw, state = {}, util = {};

			util.get = function () {
				return state[this];
			};

			util.set = function (value) {
				state[this] = value;
			};

			util.setFn = function (validate, value) {
				state[this] = validate(value, this);
			};

			util.setArray = function (validateList, value) {
				var x, val = value;
				for (x = 0; x < validateList.length; x += 1) {
					val = validateList[x](value, this);
				}

				state[this] = val;
			};

			Object.keys(properties).forEach(function (key) {

				var setter, validator = properties[key];

				if (Array.isArray(validator)) {
					setter = util.setArray.bind(key, validator);
				} else if (typeof validator === "function") {
					setter = util.setFn.bind(key, validator);
				} else {
					setter = util.set.bind(key);
				}

				Object.defineProperty(this, key, {
					configurable: true,
					enumerable: true,
					get: util.get.bind(key),
					set: setter
				});
			}, this);

			// Set defaults
			raw = {};
			$.extend(true, raw, defaults || {});

			// Lazy load defaults, if needed
			$.each(raw, function (key, value) {
				if (config !== undefined && config.hasOwnProperty(key) === false &&
						value instanceof LazyLoad) {
					raw[key] = value.load();
				}
			});

			$.extend(raw, config || {});

			Object.keys(properties).forEach(function (key) {
				this[key] = raw[key];
			}, this);
		};
	};

	return validation;
}());

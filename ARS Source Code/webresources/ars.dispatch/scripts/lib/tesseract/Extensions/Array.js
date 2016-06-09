/*global $ */
/*skip minimize*/

(function () {
	"use strict";

	/*jslint regexp: true */
	var jsPathRe = /(?:([^\.\[]+?)(?=[\.\[]|$)|(?:\[(["']))([\s\S]+?)\2\])/g;
	/*jslint regexp: false */

	function strictEquality(a, b) {
		return a === b;
	}

	function compareArrays(a, b, comparer, thisp, intersect) {
		/// <summary>
		///   Internal implementation of except and intersect, which differ only by
		///   a single flag.
		/// </summary>
		/// <param name="a" type="Array">First array to compare.</param>
		/// <param name="b" type="Array">Second array to compare.</param>
		/// <param name="comparer" type="Function">Comparison function.</param>
		/// <param name="thisp" type="Object">Comparison function scope.</param>
		/// <param name="intersect" type="Boolean">
		///   True for intersection. False for exception.
		/// </param>

		var x, y, isFound, lenX = a.length, lenY, res = [];

		if (Array.isArray(b) === false) {
			b = $.makeArray(b);
		}

		lenY = b.length;

		for (x = 0; x < lenX; x += 1) {
			if (a.hasOwnProperty(x)) {
				isFound = false;

				for (y = 0; y < lenY; y += 1) {
					if (comparer.call(thisp, a[x], b[y], x, y, a, b)) {
						isFound = true;
						break;
					}
				}

				if (isFound === intersect) {
					res.push(a[x]);
				}
			}
		}

		return res;
	}

	if (!Array.prototype.first) {

		Array.prototype.first = function (fun, thisp) {
			/// <summary>
			///   Returns the first element in the array for which the provided
			///   comparison function returns truthy.
			/// </summary>
			/// <param name="fun" type="Function" optional="true">
			///   A comparison function.
			/// </param>
			/// <param name="thisp" type="Object" optional="true">
			///   A scope for the comparison function.
			/// </param>

			var i, val, len = this.length;
			if (typeof fun !== 'function') {
				return this[0];
			}

			for (i = 0; i < len; i += 1) {
				if (this.hasOwnProperty(i)) {
					val = this[i];
					if (fun.call(thisp, val, i, this)) {
						return val;
					}
				}
			}

			return undefined;
		};
	}

	if (!Array.prototype.last) {

		Array.prototype.last = function (fun, thisp) {
			/// <summary>
			///   Returns the last element in the array for which the provided
			///   comparison function returns truthy.
			/// </summary>
			/// <param name="fun" type="Function" optional="true">
			///   A comparison function
			/// </param>
			/// <param name="thisp" type="Object" optional="true">
			///   A scope for the comparison function.
			/// </param>

			var i, val;
			if (typeof fun !== "function") {
				return this[this.length - 1];
			}

			i = this.length;
			while (i--) {
				if (this.hasOwnProperty(i)) {
					val = this[i];
					if (fun.call(thisp, val, i, this)) {
						return val;
					}
				}
			}

			return undefined;
		};

	}

	if (!Array.prototype.remove) {
		Array.prototype.remove = function () {
			/// <signature>
			///   <summary>Remove items from the array.</summary>
			///   <param name="e" optional="true">Item to remove.</param>
			///   <param name="e..." optional="true">Item to remove.</param>
			///   <returns type="Array">The removed elements.</returns>
			/// </signature>
			/// <signature>
			///   <summary>Remove matching elements from the array.</summary>
			///   <param name="fn">Comparison function</param>
			///   <returns type="Array">The removed elements.</returns>
			/// </signature>

			var fn, idx, out, args, val;
			args = $.makeArray(arguments);

			function def(e) {
				return args.indexOf(e) !== -1;
			}

			fn = args.length === 1 && typeof args[0] === "function" ? args[0] : def;
			out = [];
			idx = this.length;
			while (idx--) {
				if (this.hasOwnProperty(idx)) {
					val = this[idx];
					if (fn.call(null, val, idx, this)) {
						out.push(this.splice(idx, 1)[0]);
					}
				}
			}

			return out.reverse();
		};
	}

	if (!Array.range) {
		Array.range = function (start, stop, step) {
			/// <signature>
			///   <summary>
			///     Produce an array of numbers starting at zero and ending before
			///     the stopping number.
			///   </summary>
			///   <param name="count" type="Number" optional="true">
			///     Number of numbers to include in the range. Defaults to zero
			///     (thus producing an empty array).
			///   </param>
			///   <returns type="Array" elementType="Number" />
			/// </signature>
			/// <signature>
			///   <summary>
			///     Produce an array of numbers between the specified starting and
			///     stopping numbers, inclusive of the start and exclusive of the
			///     stop. Optionally increment by the provided stepping number.
			///   </summary>
			///   <param name="start" type="Number">
			///     The number at which to begin the range.
			///   </param>
			///   <param name="stop" type="Number">
			///     Stop the range just before it reaches this number.
			///   </param>
			///   <param name="step" type="Number" optional="true">
			///     Stepping number by which to increment.
			///   </param>
			///   <returns type="Array" elementType="Number" />
			/// </signature>

			var result = [],
				startNum = start,
				stopNum = stop,
				stepNum = step;

			if (arguments.length < 3) {
				stepNum = 1;
			}

			if (arguments.length < 2) {
				stopNum = startNum || 0;
				startNum = 0;
			}

			if (
				typeof startNum !== 'number' ||
					typeof stopNum !== 'number' ||
					typeof stepNum !== 'number'
			) {
				throw new TypeError();
			}

			if (stepNum === 0) {
				throw new RangeError();
			}

			if (stepNum > 0) {
				while (startNum < stopNum) {
					result.push(startNum);
					startNum += stepNum;
				}
			} else {
				while (startNum > stopNum) {
					result.push(startNum);
					startNum += stepNum;
				}
			}

			return result;
		};
	}

	if (!Array.prototype.distinct) {
		Array.prototype.distinct = function (comparer, thisp) {
			/// <summary>Reduce an array to a list of distinct elements.</summary>
			/// <param name="comparer" type="Function" optional="true">
			///   An optional comparison function.
			/// </param>
			/// <param name="thisp" type="Object" optional="true">
			///   An optional scope in which to execute the comparison function.
			/// </param>
			/// <returns type="Array" elementType="Object" />

			var x, y, isFound, compFn = comparer,
				res = [],
				len = this.length;

			if (arguments.length > 0) {
				if (typeof compFn !== 'function') {
					throw new TypeError();
				}
			} else {
				compFn = strictEquality;
			}

			for (x = 0; x < len; x += 1) {
				if (this.hasOwnProperty(x)) {
					isFound = false;
					for (y = 0; y < res.length; y += 1) {
						if (
							compFn.call(thisp, this[x], res[y],
								x, y, this, res)
						) {
							isFound = true;
							break;
						}
					}

					if (isFound === false) {
						res.push(this[x]);
					}
				}
			}

			return res;
		};
	}

	if (!Array.prototype.except) {
		Array.prototype.except = function (values, comparer, thisp) {
			/// <summary>
			///   Returns a copy of the array with all instances of items in the
			///   second array removed. Optionally uses a provided comparison
			///   function.
			/// </summary>
			/// <param name="values" type="Array">
			///   Array with values to compare against.
			/// </param>
			/// <param name="comparer" type="Function" optional="true">
			///   Optional comparison function.
			/// </param>
			/// <param name="thisp" type="Object" optional="true">
			///   Optional comparison function scope.
			/// </param>

			var compFn = comparer;

			if (arguments.length > 1) {
				if (typeof compFn !== 'function') {
					throw new TypeError();
				}
			} else {
				compFn = strictEquality;
			}

			return compareArrays(this, values, compFn, thisp, false);
		};
	}

	if (!Array.prototype.intersect) {
		Array.prototype.intersect = function (values, comparer, thisp) {
			/// <summary>
			///   Computes the list of values that are the intersection of all the
			///   arrays. Each value in the result is present in each of the arrays.
			/// </summary>
			/// <param name="values" type="Array">
			///   Array containing values to intersect with.
			/// </param>
			/// <param name="comparer" type="Function" optional="true">
			///   Optional comparison function.
			/// </param>
			/// <param name="thisp" type="Object" optional="true">
			///   Optional comparison function scope.
			/// </param>

			var compFn = comparer;

			if (arguments.length > 1) {
				if (typeof compFn !== 'function') {
					throw new TypeError();
				}
			} else {
				compFn = strictEquality;
			}

			return compareArrays(this, values, compFn, thisp, true);
		};
	}

	if (!Array.prototype.execute) {
		Array.prototype.execute = function (name) {
			/// <summary>Execute the named method for each instance.</summary>
			/// <param name="name" type="String">Name of method to execute</param>

			var x, res = [], len = this.length,
				args = $.makeArray(arguments).splice(1, arguments.length);

			res.length = len;

			for (x = 0; x < len; x += 1) {
				if (this.hasOwnProperty(x)) {
					res[x] = this[x][name].apply(this[x], args);
				}
			}

			return res;
		};
	}

	if (!Array.prototype.pluck) {
		Array.prototype.pluck = function (value) {
			/// <summary>Extract a list of property values.</summary>
			/// <param name="value" type="String">
			///   Name of the property to extract.
			/// </param>

			var x, y, res = [], len = this.length, values, match, context;
			res.length = len;

			jsPathRe.lastIndex = 0;
			values = [];
			match = jsPathRe.exec(value);
			while (match) {
				values.push(match[1] || match[3] || "");
				match = jsPathRe.exec(value);
			}

			values = values.filter(Boolean);

			for (x = 0; x < len; x += 1) {
				if (this.hasOwnProperty(x)) {
					context = this[x];
					for (y = 0; y < values.length; y += 1) {
						context = context[values[y]];
					}

					res[x] = context;
				}
			}

			return res;
		};
	}

	if (!Array.prototype.flatten) {
		Array.prototype.flatten = function () {
			return Array.prototype.concat.apply([], this);
		};
	}

	if (!Array.prototype.ofType) {
		Array.prototype.ofType = function (type) {
			return this.filter(function (el) {
				return el instanceof type;
			});
		};
	}

	if (!Array.prototype.humanize) {
		Array.prototype.humanize = function (conj) {
			/// <summary>
			///  Format an array into a comma-delimited list of strings, including
			///  the conjunction "and" for the last time, as apporpriate.
			/// </summary>
			/// <param name="conj">Conjunction, defaults to 'and'</param>
			var arr;

			if (!this.length) {
				return null;
			}

			arr = this.filter(function (item) {
				return item !== null && item !== undefined;
			});

			if (!arr.length) {
				return null;
			}

			function reduce(result, val, index, array) {
				if (index !== 0 && index === array.length - 1) {
					if (array.length > 2) {
						result += ",";
					}

					result += " " + (conj || "and") + " ";

				} else if (index > 0) {
					result += ", ";
				}

				return result + val;
			}

			return arr.map(String).execute("trim").reduce(reduce, "");
		};
	}

	if (!Array.prototype.bagEqual) {
		Array.prototype.bagEqual = function (values, comparer, thisp) {
			/// <summary>
			///   Determines whether 2 arrays contains the same elements,
			///   ignoring order.
			/// </summary>
			/// <param name="values" type="Array">The array to compare to.</param>
			/// <param name="comparer" type="Function" optional="true">
			///   Optional comparison function.
			/// </param>
			/// <param name="thisp" type="Object" optional="true">
			///   Optional comparison function scope.
			/// </param>

			var compFn = comparer;

			if (this === values) {
				return true;
			}

			if (this.length !== values.length) {
				return false;
			}

			if (arguments.length > 1) {
				if (typeof compFn !== 'function') {
					throw new TypeError();
				}
			} else {
				compFn = strictEquality;
			}

			return compareArrays(this, values, compFn, thisp, false).length === 0;
		};
	}

}());

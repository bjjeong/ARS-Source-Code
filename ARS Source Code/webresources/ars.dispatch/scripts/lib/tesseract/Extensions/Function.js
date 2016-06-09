/*global $, window */
/*skip minimize*/

if (!Function.prototype.memoize) {

	Function.prototype.memoize = function (hashFunction, thisp) {
		/// <summary>
		///   Memoize an expensive function by storing its results.
		/// </summary>
		/// <param name="hashFunction" type="Function" optional="true">
		///   A hash function used to generate a unique key for each set of
		///   arguments with which the memoized function is called.
		/// </param>
		/// <param name="thisp" type="Object" optional="true">
		///   Optional scope object.
		/// </param>

		"use strict";

		function defaultHasher() {
			return $.makeArray(arguments).toString();
		}

		var memo = {},
			hasher = defaultHasher,
			self = this;

		if (arguments.length > 0) {
			if (typeof hashFunction !== 'function') {
				throw new TypeError();
			}

			hasher = hashFunction;
		}

		return function () {
			/// <summary>Memoized function.</summary>

			var key = hasher.apply(thisp, arguments), value;
			if (memo.hasOwnProperty(key)) {
				return memo[key];
			}

			value = self.apply(thisp, arguments);
			memo[key] = value;
			return value;
		};
	};
}

if (!Function.prototype.throttle) {
	Function.prototype.throttle = function throttle(wait) {
		/// <summary>
		///   Return a new function that can only be triggered once during a
		///   given window of time. Used to rate-limit events.
		/// </summary>
		/// <param name="wait" type="Number">
		///   Number of milliseconds between possible firings of the function.
		/// </param>

		"use strict";

		var fn = this, prevented = false;

		function clear() {
			prevented = false;
		}

		return function () {
			if (prevented) {
				return;
			}

			fn.apply(this, arguments);

			prevented = true;
			window.setTimeout(clear, wait);
		};
	};
}

if (!Function.prototype.debounce) {
	Function.prototype.debounce = function (wait) {
		/// <summary>
		///   Repeated calls to a debounced function will postpone it's execution
		///   until after wait milliseconds have elapsed. Useful for implementing
		///   behavior that should only happen after the input has stopped
		///   arriving. For example: rendering a preview of a Markdown comment, or
		///   recalculating a layout after the window has stopped being resized.
		/// </summary>
		/// <param name="wait" type="Number">Milliseconds to wait.</param>

		"use strict";

		var fn = this,
			timer = null,
			deferred = new $.Deferred(),
			promise = deferred.promise();

		function resetDeferred() {
			deferred = new $.Deferred();
			promise = deferred.promise();
		}

		return function () {
			var scope = this, args = arguments;

			function applyFunction() {
				var result;

				try {
					result = fn.apply(scope, args);
				} catch (e) {
					deferred.reject(e);
					return false;
				}

				if (result && $.isFunction(result.promise)) {
					result.promise().then(
						deferred.resolve.bind(deferred),
						deferred.reject.bind(deferred),
						deferred.notify.bind(deferred)
					);
				} else {
					deferred.resolve(result);
				}

				return true;
			}

			window.clearTimeout(timer);
			timer = window.setTimeout(function () {
				applyFunction();
				resetDeferred();
			}, wait);

			return promise;
		};
	};
}

if (typeof Function.prototype.after !== "function") {
	Function.prototype.after = function (times) {
		/// <summary>
		///   Produces a function that will only be executed after being called a
		///   specific number of times.
		/// </summary>
		/// <param name="times" type="Number">Number of times to wait.</param>

		"use strict";

		if (times <= 0) {
			return this;
		}

		var fn = this, called = 0;

		return function () {
			called += 1;
			return called >= times ? fn.apply(this, arguments) : null;
		};
	};
}

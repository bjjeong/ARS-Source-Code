/*skip minimize*/

if (!String.prototype.supplant) {
	String.prototype.supplant = function (args) {
		/// <summary>Perform variable substitution on a string.</summary>
		/// <param name="args" type="Object">
		///     An object containing the variables to substitute.
		/// </param>

		"use strict";

		/*jslint regexp: true */

		var re = /\{([^}]*)\}/g;

		/*jslint regexp: false */

		return this.replace(re, function (a, b) {
			var r = args[b], t = typeof r;
			return t === "string" || t === "number" ? r : a;
		});
	};
}

if (!String.prototype.toHtmlString) {
	String.prototype.toHtmlString = function () {
		/// <summary>Escape a string for HTML.</summary>
		/// <returns type="String" />

		"use strict";

		return this
			.replace(/&/g, "&amp;")
			.replace(/\xA0/g, "&nbsp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	};
}

import { n as _defineProperty } from "./objectSpread2-C_IE-bIJ.js";
import { Dr as ViewEncapsulation, Ui as setClassMetadata, Wc as SecurityContext, cn as Component, eo as ɵɵdefineComponent } from "./core-DwmaaD_X.js";
//#region node_modules/@angular/cdk/fesm2022/private.mjs
var _VisuallyHiddenLoader2;
var _VisuallyHiddenLoader = class {};
_VisuallyHiddenLoader2 = _VisuallyHiddenLoader;
_defineProperty(_VisuallyHiddenLoader, "ɵfac", function _VisuallyHiddenLoader_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _VisuallyHiddenLoader2)();
});
_defineProperty(_VisuallyHiddenLoader, "ɵcmp", /* @__PURE__ */ ɵɵdefineComponent({
	type: _VisuallyHiddenLoader2,
	selectors: [["ng-component"]],
	exportAs: ["cdkVisuallyHidden"],
	decls: 0,
	vars: 0,
	template: function _VisuallyHiddenLoader_Template(rf, ctx) {},
	styles: [".cdk-visually-hidden {\n  border: 0;\n  clip: rect(0 0 0 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px;\n  white-space: nowrap;\n  outline: 0;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n  left: 0;\n}\n[dir=rtl] .cdk-visually-hidden {\n  left: auto;\n  right: 0;\n}\n"],
	encapsulation: 2
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(_VisuallyHiddenLoader, [{
		type: Component,
		args: [{
			exportAs: "cdkVisuallyHidden",
			encapsulation: ViewEncapsulation.None,
			template: "",
			styles: [".cdk-visually-hidden {\n  border: 0;\n  clip: rect(0 0 0 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px;\n  white-space: nowrap;\n  outline: 0;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n  left: 0;\n}\n[dir=rtl] .cdk-visually-hidden {\n  left: auto;\n  right: 0;\n}\n"]
		}]
	}], null, null);
})();
var policy;
function getPolicy() {
	if (policy === void 0) {
		policy = null;
		if (typeof window !== "undefined") {
			const ttWindow = window;
			if (ttWindow.trustedTypes !== void 0) try {
				policy = ttWindow.trustedTypes.createPolicy("angular#components", { createHTML: (s) => s });
			} catch (error) {
				console.error(error);
			}
		}
	}
	return policy;
}
function trustedHTMLFromString(html) {
	var _getPolicy;
	return ((_getPolicy = getPolicy()) === null || _getPolicy === void 0 ? void 0 : _getPolicy.createHTML(html)) || html;
}
function _setInnerHtml(element, html, sanitizer) {
	const cleanHtml = sanitizer.sanitize(SecurityContext.HTML, html);
	if (cleanHtml === null && (typeof ngDevMode === "undefined" || ngDevMode)) throw new Error(`Could not sanitize HTML: ${html}`);
	element.innerHTML = trustedHTMLFromString(cleanHtml || "");
}
//#endregion
export { _setInnerHtml as n, trustedHTMLFromString as r, _VisuallyHiddenLoader as t };

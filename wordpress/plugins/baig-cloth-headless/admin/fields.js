/**
 * Shared admin field helpers:
 *  - .bc-media-url inputs get a "Choose" button that opens the Media Library
 *    (images, or videos when data-media="video") and fills in the file URL;
 *  - .bc-rows repeaters edit a hidden JSON list as a small table of inputs
 *    (used for "what is included" pieces and free-form detail rows).
 */
(function () {
	"use strict";

	function enhanceMediaInputs(root) {
		root.querySelectorAll("input.bc-media-url").forEach(function (input) {
			if (input.dataset.enhanced) return;
			input.dataset.enhanced = "1";
			var kind = input.dataset.media === "video" ? "video" : "image";
			var btn = document.createElement("button");
			btn.type = "button";
			btn.className = "button";
			btn.style.marginLeft = "6px";
			btn.textContent = kind === "video" ? "Choose video" : "Choose image";
			btn.addEventListener("click", function () {
				if (!window.wp || !wp.media) return;
				var frame = wp.media({ title: btn.textContent, library: { type: kind }, multiple: false, button: { text: "Use this" } });
				frame.on("select", function () {
					var att = frame.state().get("selection").first();
					if (att) {
						input.value = att.get("url");
						input.dispatchEvent(new Event("change", { bubbles: true }));
					}
				});
				frame.open();
			});
			input.insertAdjacentElement("afterend", btn);
		});
	}

	function enhanceRows(root) {
		root.querySelectorAll(".bc-rows").forEach(function (box) {
			if (box.dataset.enhanced) return;
			box.dataset.enhanced = "1";
			var hidden = box.querySelector("input[type=hidden]");
			var list = box.querySelector(".bc-rows-list");
			var fields = (box.dataset.fields || "").split(",").map(function (f) {
				var p = f.split(":");
				return { key: p[0], placeholder: p[1] || p[0] };
			});

			function read() {
				try {
					var v = JSON.parse(hidden.value);
					return Array.isArray(v) ? v : [];
				} catch (e) {
					return [];
				}
			}
			function write(rows) {
				hidden.value = JSON.stringify(rows);
			}
			function render() {
				var rows = read();
				list.innerHTML = "";
				rows.forEach(function (row, i) {
					var line = document.createElement("div");
					line.style.cssText = "display:flex;gap:6px;margin-bottom:6px;align-items:center";
					fields.forEach(function (f) {
						var inp = document.createElement("input");
						inp.type = "text";
						inp.placeholder = f.placeholder;
						inp.value = row[f.key] || "";
						inp.className = "regular-text";
						inp.style.maxWidth = "260px";
						inp.addEventListener("input", function () {
							var r = read();
							r[i][f.key] = inp.value;
							write(r);
						});
						line.appendChild(inp);
					});
					var del = document.createElement("button");
					del.type = "button";
					del.className = "button button-small";
					del.textContent = "×";
					del.title = "Remove";
					del.addEventListener("click", function () {
						var r = read();
						r.splice(i, 1);
						write(r);
						render();
					});
					line.appendChild(del);
					list.appendChild(line);
				});
			}
			box.querySelector(".bc-rows-add").addEventListener("click", function () {
				var r = read();
				var blank = {};
				fields.forEach(function (f) { blank[f.key] = ""; });
				r.push(blank);
				write(r);
				render();
			});
			render();
		});
	}

	function init() {
		enhanceMediaInputs(document);
		enhanceRows(document);
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
	// Term "add" forms are re-rendered via AJAX after a successful add.
	if (window.jQuery) jQuery(document).on("ajaxComplete", function () { init(); });
})();

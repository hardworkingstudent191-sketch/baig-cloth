/**
 * Product gallery manager: a hidden JSON input holds the ordered URL list;
 * this renders it as thumbnails with reorder/remove controls and feeds it
 * from the media library or a pasted URL.
 */
(function ($) {
	"use strict";

	var input = document.getElementById("bc_image_urls");
	var list = document.getElementById("bc-gallery-list");
	if (!input || !list) {
		return;
	}

	function read() {
		try {
			var v = JSON.parse(input.value);
			return Array.isArray(v) ? v : [];
		} catch (e) {
			return [];
		}
	}

	function write(urls) {
		input.value = JSON.stringify(urls);
		render(urls);
	}

	function displayUrl(url) {
		if (url.indexOf("/") === 0 && url.indexOf("//") !== 0 && window.bcMetabox && bcMetabox.storefront) {
			return bcMetabox.storefront + url;
		}
		return url;
	}

	function render(urls) {
		list.innerHTML = "";
		urls.forEach(function (url, i) {
			var li = document.createElement("li");
			li.className = "bc-gallery-item";

			var img = document.createElement("img");
			img.src = displayUrl(url);
			img.alt = "";
			li.appendChild(img);

			if (i === 0) {
				var badge = document.createElement("span");
				badge.className = "bc-badge";
				badge.textContent = "main";
				li.appendChild(badge);
			}

			var controls = document.createElement("span");
			controls.className = "bc-controls";

			var up = button("↑", "Move earlier", function () {
				if (i > 0) {
					var u = read();
					var t = u[i - 1];
					u[i - 1] = u[i];
					u[i] = t;
					write(u);
				}
			});
			var down = button("↓", "Move later", function () {
				var u = read();
				if (i < u.length - 1) {
					var t = u[i + 1];
					u[i + 1] = u[i];
					u[i] = t;
					write(u);
				}
			});
			var remove = button("×", "Remove", function () {
				var u = read();
				u.splice(i, 1);
				write(u);
			});
			remove.classList.add("bc-remove");

			controls.appendChild(up);
			controls.appendChild(down);
			controls.appendChild(remove);
			li.appendChild(controls);

			var title = document.createElement("span");
			title.className = "bc-url";
			title.title = url;
			title.textContent = url;
			li.appendChild(title);

			list.appendChild(li);
		});
	}

	function button(label, title, onClick) {
		var b = document.createElement("button");
		b.type = "button";
		b.className = "button button-small";
		b.textContent = label;
		b.title = title;
		b.addEventListener("click", onClick);
		return b;
	}

	// Media library picker (multi-select).
	var frame = null;
	document.getElementById("bc-add-media").addEventListener("click", function () {
		if (!frame) {
			frame = wp.media({
				title: (window.bcMetabox && bcMetabox.chooseImages) || "Choose images",
				button: { text: (window.bcMetabox && bcMetabox.addToGallery) || "Add to gallery" },
				library: { type: "image" },
				multiple: "add",
			});
			frame.on("select", function () {
				var urls = read();
				frame
					.state()
					.get("selection")
					.each(function (att) {
						var url = att.get("url");
						if (url && urls.indexOf(url) === -1) {
							urls.push(url);
						}
					});
				write(urls);
			});
		}
		frame.open();
	});

	// Enter in the URL box must add the URL, not submit the whole product
	// form (the box lives inside #post, so implicit submission would save or
	// publish the product and lose the typed text).
	document.getElementById("bc-url-input").addEventListener("keydown", function (e) {
		if (e.key === "Enter") {
			e.preventDefault();
			document.getElementById("bc-add-url").click();
		}
	});

	// Add by URL (absolute, or /relative to the storefront host).
	document.getElementById("bc-add-url").addEventListener("click", function () {
		var field = document.getElementById("bc-url-input");
		var url = (field.value || "").trim();
		if (!url) {
			return;
		}
		var urls = read();
		if (urls.indexOf(url) === -1) {
			urls.push(url);
		}
		field.value = "";
		write(urls);
	});

	render(read());
})(jQuery);

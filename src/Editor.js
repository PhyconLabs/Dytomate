define(
	[
		"scribe",
		"scribe-plugin-toolbar",
		"scribe-plugin-link-prompt-command"
	],
	
	function(Scribe, scribePluginToolbar, scribePluginLinkPromptCommand) {
		function Editor(dytomite, element) {
			this.dytomite = dytomite;
			this.element = element;
			
			this.listeners = {};
			
			this.body = null;
			this.overlay = {};
			this.toolbar = {};
			this.scribe = null;
			this.enabled = false;
		}
		
		Editor.prototype.enable = function() {
			if (!this.enabled) {
				this.body = document.querySelector("body");
				
				this.initElement();
				this.removeNewlines();
				this.initOverlay();
				this.initScribe();
				this.attachListeners();
				
				this.enabled = true;
			}
			
			return this;
		};
		
		Editor.prototype.disable = function() {
			if (this.enabled) {
				this.detachListeners();
				this.deinitOverlay();
				this.deinitElement();
				this.deinitScribe();
				
				this.enabled = false;
			}
			
			return this;
		};
		
		Editor.prototype.initElement = function() {
			this.element.style.outline = "none";
			
			this.element.setAttribute("data-dytomate-in-edit", "true");
			
			return this;
		};
		
		Editor.prototype.deinitElement = function() {
			this.element.removeAttribute("data-dytomate-in-edit");
			
			return this;
		};
		
		Editor.prototype.initOverlay = function() {
			var position = this.element.getBoundingClientRect();
			
			this.overlay.window = document.createElement("div");
			this.toolbar.container = document.createElement("div");
			
			[ "top", "left", "right", "bottom" ].forEach(function(part) {
				this.overlay[part] = document.createElement("div");
				
				this.overlay[part].style.position = "fixed";
				this.overlay[part].style.backgroundColor = this.dytomite.options.editorOverlayColor;
			}, this);
			
			[ "boldButton", "italicButton", "linkButton" ].forEach(function(part, index) {
				this.toolbar[part] = document.createElement("button");
				
				this.toolbar[part].style.position = "absolute";
				this.toolbar[part].style.top = "0";
				this.toolbar[part].style.left = this.toPx(
					(
						this.dytomite.options.editorToolbarButtonSize +
						this.dytomite.options.editorToolbarButtonSpacing
					) *
					index
				);
				this.toolbar[part].style.width = this.toPx(this.dytomite.options.editorToolbarButtonSize);
				this.toolbar[part].style.height = this.toPx(this.dytomite.options.editorToolbarButtonSize);
				this.toolbar[part].style.padding = "0";
				this.toolbar[part].style.margin = "0";
				this.toolbar[part].style.border = this.toPx(this.dytomite.options.editorToolbarButtonBorderWidth) +
					" solid " +
					this.dytomite.options.editorToolbarButtonBorderColor;
				this.toolbar[part].style.boxShadow = "0 0 " +
					this.toPx(this.dytomite.options.editorToolbarButtonShadowSize) +
					" " +
					this.dytomite.options.editorToolbarButtonShadowColor;
				this.toolbar[part].style.cursor = "pointer";
				this.toolbar[part].style.backgroundSize = "contain";
				this.toolbar[part].style.backgroundColor = this.dytomite.options.editorToolbarButtonColor;
				
				this.toolbar[part].classList.add("dytomate-editor-command-button");
				
				this.toolbar[part].addEventListener("mouseover", function() {
					this.toolbar[part].style.backgroundColor = this.dytomite.options.editorToolbarButtonHoverColor;
					this.toolbar[part].style.boxShadow = "0 0 " +
						this.toPx(this.dytomite.options.editorToolbarButtonShadowHoverSize) +
						" " +
						this.dytomite.options.editorToolbarButtonShadowColor;
				}.bind(this));
				
				this.toolbar[part].addEventListener("mouseout", function() {
					this.toolbar[part].style.backgroundColor = this.dytomite.options.editorToolbarButtonColor;
					this.toolbar[part].style.boxShadow = "0 0 " +
						this.toPx(this.dytomite.options.editorToolbarButtonShadowSize) +
						" " +
						this.dytomite.options.editorToolbarButtonShadowColor;
				}.bind(this));
			}, this);
			
			this.overlay.window.style.position = "fixed";
			this.overlay.window.style.boxSizing = "content-box";
			this.overlay.window.style.padding = this.toPx(this.dytomite.options.editorPadding);
			this.overlay.window.style.border = this.toPx(this.dytomite.options.editorBorderWidth) +
				" solid " +
				this.dytomite.options.editorBorderColor;
			this.overlay.window.style.pointerEvents = "none";
			this.overlay.window.style.boxShadow = "0 0 " +
				this.toPx(this.dytomite.options.editorShadowSize) +
				" " +
				this.dytomite.options.editorShadowColor;
			
			this.overlay.top.style.top = "0";
			this.overlay.top.style.left = "0";
			this.overlay.top.style.right = "0";
			
			this.overlay.left.style.left = "0";
			
			this.overlay.right.style.right = "0";
			
			this.overlay.bottom.style.left = "0";
			this.overlay.bottom.style.right = "0";
			this.overlay.bottom.style.bottom = "0";
			
			this.toolbar.container.style.position = "fixed";
			
			this.toolbar.boldButton.setAttribute("data-command-name", "bold");
			this.toolbar.boldButton.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhQABAAKIHALa2tsXFxVJSUvf394WFhebm5gAAAP///yH5BAEAAAcALAAAAABAAEAAQAP/eLrc/jDK+YS5OJsAB7BaaBADZYLiBZjHgKbGylawaga1IZQz9IoCgnBIEBhzOgCv58vJZgOkYdn7hZ4sF1LJPFg1xrA4LI11aWVYEBDgnk9OUxRJeC++GaxEW9vZvTkcDwEENSR/aDB6EgBIfm94GIsUODkCBV2RNlmaF3WIoKGio4idaSIEmKOdkw2NW6CsLAVSqpBxLIWBf7I3SLa3Na0LfCmPsadSgqR3uBIFuoZUZ72cv8GKXa+GwCzVM9swh0zfJtHi2CnLEgGmU7zJZUZuzPX29/j5zO6n89OhnUgUGFiAED8zoso1GHAOHTJh5qT8I+dsQkMgE2cohEALk8m6TBUnmPqUTsSwhaY+UoRooqOhUiE7BHyYbcKcGt1KXmGnaRzAHAQCCBVaJJIAeqQO9mOTUaeGYR4uhjj6kyWFcMZyVonJiI6djey8UuNqcUvTCGDDAj3bxOqMSn20iiTbFahcCWk5ShzrlsJNnE7zzJAKhi3eXREGEJJyLHA8cXeZtBlKubLly0MBRNbHuTO+BAA7)";
			
			this.toolbar.italicButton.setAttribute("data-command-name", "italic");
			this.toolbar.italicButton.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhQABAAKIHAJ2dnSwsLGNjY/j4+OLi4sPDwwAAAP///yH5BAEAAAcALAAAAABAAEAAQAP/eLrc/jDKSasjJmsjrP9RsWUAaJ5DMHZn6wmjMbj0BMRErT/iWO7AA0AVMxSCyAbMEGg6n00mK3nqbY7UGsaXraVWs67rNsKKq7Hf2bTdTNfwuHw+CJOLnNyc0tYEwnsUXxt/gRZLG3qGE4gaiosRd46QE1YaapQPfSSZEQMxb50Mg36AogsDjUympwqSGY+tpJenAKp4tK26u7yBKVG4GgKYmZZXvQREib0HmwbEuqoBsa3OobqvBtSnsxzMB8bPzN2FveHQrbfbop8r3+rjyhnlvOFmu+SsrefvOMzO6GrFuKer27VW2dZ1yscsW8BO4byxIwDAVrBnABTCKcCxC6PHjxwB6PtGMk4CADs=)";
			
			this.toolbar.linkButton.setAttribute("data-command-name", "linkPrompt");
			this.toolbar.linkButton.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhQABAAKIHANXV1YKCgiQkJKenp/f398jIyAAAAP///yH5BAEAAAcALAAAAABAAEAAQAP/eLrc/jDKSSsMJusMrP8HthXUsBkdSIkauRTGAAHCFqj4UdTavdC2nApw8j0IBcKCwMsYhbOTLMK0KaHYA7GY7XoJAZfXy8qIDyaNIDWOlA3nCbDXXqQNa+0pI1DugnUzTQY+MHs+BCdxWXNOHlV0gRFbGlOQjpKZmpucmWVsnR5vAIYaoKENb4sKd3inmqoelE5XbbEWjYSSpZgKuVO+g0+cBR25NwQdf5GowYAYAcIHVauBxw53T5eEtWPXFtvD3org0s2zMQ7h3c0M6FztsrTx9PX29/gPIq/5qSd5/fzt4cOv3q1WKPDdYoCw4KaFDxqigiiBFxx2tshZWNYrfRBFCd8kLSRAcpK5QGBOgJoD7MfJTBJ1DDLjjFknE320DBLAU0nIeD9/truGRGYQAA4zoUP2xtGlanV+InwSU5JQO7qWvIy6VUI4TVepCMPoxWLLCes4oTt7pOumtRC+1oOrFRC+pQDKBCBr7928gA1m7QUcocBgwogTS0gAADs=)";
			
			this.positionOverlay();
			
			for (var i in this.overlay) {
				if (this.overlay.hasOwnProperty(i)) {
					this.body.appendChild(this.overlay[i]);
				}
			}
			
			for (var i in this.toolbar) {
				if (this.toolbar.hasOwnProperty(i) && i !== "container") {
					this.toolbar.container.appendChild(this.toolbar[i]);
				}
			}
			
			this.body.appendChild(this.toolbar.container);
			
			return this;
		};
		
		Editor.prototype.deinitOverlay = function() {
			for (var i in this.overlay) {
				if (this.overlay.hasOwnProperty(i)) {
					this.body.removeChild(this.overlay[i]);
				}
			}
			
			this.body.removeChild(this.toolbar.container);
			
			this.overlay = {};
			this.toolbar = {};
			
			return this;
		};
		
		Editor.prototype.positionOverlay = function() {
			var position = this.element.getBoundingClientRect();
			var viewportHeight = window.innerHeight;
			var elementWidth = this.element.offsetWidth;
			var elementHeight = this.element.offsetHeight;
			var padding = this.dytomite.options.editorPadding;
			var border = this.dytomite.options.editorBorderWidth;
			var toolbarOffsetX = this.dytomite.options.editorToolbarOffsetX;
			var toolbarOffsetY = this.dytomite.options.editorToolbarOffsetY;
			var toolbarButtonSize = this.dytomite.options.editorToolbarButtonSize;
			
			var toolbarSpaceY = toolbarOffsetY > 0 ? 0 : Math.abs(toolbarOffsetY);
			
			var overlayWindowTop = position.top - padding;
			var overlayWindowLeft = position.left - padding;
			var overlayWindowWidth = elementWidth;
			var overlayWindowHeight = elementHeight + toolbarSpaceY;
			
			var overlayTopHeight = overlayWindowTop;
			
			var overlayLeftTop = overlayWindowTop;
			var overlayLeftWidth = overlayWindowLeft;
			var overlayLeftHeight = elementHeight + toolbarSpaceY + (padding * 2) + (border * 2);
			
			var overlayRightTop = overlayWindowTop;
			var overlayRightLeft = position.left + elementWidth + padding + (border * 2);
			var overlayRightHeight = overlayLeftHeight;
			
			var overlayBottomTop = position.top + elementHeight + toolbarSpaceY + padding + (border * 2);
			
			var toolbarContainerTop = overlayBottomTop + toolbarOffsetY;
			var toolbarContainerLeft = overlayWindowLeft + toolbarOffsetX;
			
			if (toolbarContainerTop + toolbarButtonSize > viewportHeight) {
				toolbarContainerTop = position.top - padding - border - toolbarButtonSize - toolbarOffsetY - toolbarSpaceY;
				
				if (toolbarSpaceY > 0) {
					overlayWindowTop -= toolbarSpaceY;
					overlayTopHeight -= toolbarSpaceY;
					overlayLeftTop -= toolbarSpaceY;
					overlayRightTop -= toolbarSpaceY;
					overlayBottomTop -= toolbarSpaceY;
				}
			}
			
			// var toolbarY = (position.top + elementHeight + padding + (border * 2) + toolbarOffsetY + offsetY);
			// if ((toolbarY + toolbarButtonSize) > viewportHeight) {
			// 	toolbarY = position.top - padding - border - toolbarButtonSize - toolbarOffsetY - offsetY;
			// }
			
			this.overlay.window.style.top = this.toPx(overlayWindowTop);
			this.overlay.window.style.left = this.toPx(overlayWindowLeft);
			this.overlay.window.style.width = this.toPx(overlayWindowWidth);
			this.overlay.window.style.height = this.toPx(overlayWindowHeight);
			
			this.overlay.top.style.height = this.toPx(overlayTopHeight);
			
			this.overlay.left.style.top = this.toPx(overlayLeftTop);
			this.overlay.left.style.width = this.toPx(overlayLeftWidth);
			this.overlay.left.style.height = this.toPx(overlayLeftHeight);
			
			this.overlay.right.style.top = this.toPx(overlayRightTop);
			this.overlay.right.style.left = this.toPx(overlayRightLeft);
			this.overlay.right.style.height = this.toPx(overlayRightHeight);
			
			this.overlay.bottom.style.top = this.toPx(overlayBottomTop);
			
			this.toolbar.container.style.top = this.toPx(toolbarContainerTop);
			this.toolbar.container.style.left = this.toPx(toolbarContainerLeft);
			
			return this;
		};
		
		Editor.prototype.removeNewlines = function() {
			var html = this.element.innerHTML;
			
			html = html.replace(/\r?\n|\r|\t/g, "");
			
			this.element.innerHTML = html;
			
			return this;
		};
		
		Editor.prototype.initScribe = function() {
			var scribeToolbar = scribePluginToolbar(this.toolbar.container);
			
			this.scribe = new Scribe(this.element, {
				allowBlockElements: this.elementSupportsBlockElements()
			});
			
			this.scribe.use(scribeToolbar);
			this.scribe.use(scribePluginLinkPromptCommand());
			
			this.element.focus();
			
			return this;
		};
		
		Editor.prototype.deinitScribe = function() {
			this.scribe = null;
			
			this.element.removeAttribute("contenteditable");
			this.element.parentNode.innerHTML = this.element.parentNode.innerHTML;
			
			return this;
		};
		
		Editor.prototype.attachListeners = function() {
			var updater = function() {
				this.positionOverlay();
			}.bind(this);
			
			this.scribe.on("content-changed", this.listeners.scribeContentChanged = function() {
				updater();
			});
			
			window.addEventListener("scroll", this.listeners.windowScroll = function() {
				updater();
			});
			
			window.addEventListener("resize", this.listeners.windowResize = function() {
				updater();
			});
			
			return this;
		};
		
		Editor.prototype.detachListeners = function() {
			this.scribe.off("content-changed", this.listeners.scribeContentChanged);
			delete this.listeners.scribeContentChanged;
			
			window.removeEventListener("scroll", this.listeners.windowScroll);
			delete this.listeners.windowScroll;
			
			window.removeEventListener("resize", this.listeners.windowResize);
			delete this.listeners.windowResize;
			
			return this;
		};
		
		Editor.prototype.getElementTagName = function() {
			return this.element.tagName.toLowerCase();
		};
		
		Editor.prototype.elementSupportsBlockElements = function() {
			var blockSupported = [
				"article",
				"aside",
				"blockquote",
				"dd",
				"div",
				"dl",
				"fieldset",
				"figcaption",
				"figure",
				"footer",
				"form",
				"header",
				"hgroup",
				"ol",
				"section",
				"ul"
			];
			
			return blockSupported.indexOf(this.getElementTagName()) !== -1;
		};
		
		Editor.prototype.toPx = function(number) {
			return number.toString() + "px";
		};
		
		return Editor;
	}
);
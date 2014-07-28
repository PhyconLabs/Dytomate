define([ "scribe", "scribe-plugin-toolbar" ], function(Scribe, scribePluginToolbar) {
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
			this.overlay[part].style.backgroundColor = "rgba(255, 255, 255, .75)";
		}, this);
		
		[ "boldButton", "italicButton" ].forEach(function(part, index) {
			this.toolbar[part] = document.createElement("button");
			
			this.toolbar[part].style.position = "absolute";
			this.toolbar[part].style.top = "0";
			this.toolbar[part].style.width = "32px";
			this.toolbar[part].style.height = "32px";
			this.toolbar[part].style.backgroundSize = "contain";
			this.toolbar[part].style.left = (40 * index).toString() + "px";
			
			this.toolbar[part].classList.add("dytomate-editor-command-button");
		}, this);
		
		this.overlay.window.style.position = "fixed";
		this.overlay.window.style.boxSizing = "content-box";
		this.overlay.window.style.padding = "16px";
		this.overlay.window.style.border = "1px solid #666";
		this.overlay.window.style.pointerEvents = "none";
		this.overlay.window.style.boxShadow = "0 0 20px #333";
		
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
		this.toolbar.boldButton.style.backgroundImage = "url(data:image/gif;base64,R0lGODdhQABAAOMAAMzMzJaWlr6+vqOjo8XFxZycnLGxsbe3t6qqqgAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAQABAAAAEpBDISau9OOvNu/9gKI5kaZ5oqq5s675wLM90bd94ru987//AoHBILBqPyKRyyRwSQk+bYDA5IDbT6rVGKAgmhSim+5WEbYbBQWItTBDwLSC9BrRthcHgGnaD/WZ6fF1cAQBdBAEFAXUAcBOJh2GKjDUBBAdUkpAFZxKXmRKENQedZaMAAwZpVaaigE2xsrO0tba3uLm6u7y9vr/AwcLDxMXGxxURADs=)";
		
		this.toolbar.italicButton.setAttribute("data-command-name", "italic");
		this.toolbar.italicButton.style.backgroundImage = "url(data:image/gif;base64,R0lGODdhQABAAOMAAMzMzJaWlr6+vqOjo8XFxZycnLGxsbe3t6qqqgAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAQABAAAAEpBDISau9OOvNu/9gKI5kaZ5oqq5s675wLM90bd94ru987//AoHBILBqPyKRyyRwSQk+bYDA5IDbT6rVGKAgmhSim+5WEbYbBQWItTBDwLSC9BrRthcHgGnaD/WZ6fF1cAQBdBAEFAXUAcBOJh2GKjDUBBAdUkpAFZxKXmRKENQedZaMAAwZpVaaigE2xsrO0tba3uLm6u7y9vr/AwcLDxMXGxxURADs=)";
		
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
		var elementWidth = this.element.offsetWidth;
		var elementHeight = this.element.offsetHeight;
		
		this.overlay.window.style.top = (position.top - 16).toString() + "px";
		this.overlay.window.style.left = (position.left - 16).toString() + "px";
		this.overlay.window.style.width = elementWidth.toString() + "px";
		this.overlay.window.style.height = elementHeight.toString() + "px";
		
		this.overlay.top.style.height = (position.top - 16).toString() + "px";
		
		this.overlay.left.style.top = (position.top - 16).toString() + "px";
		this.overlay.left.style.width = (position.left - 16).toString() + "px";
		this.overlay.left.style.height = (elementHeight + 34).toString() + "px";
		
		this.overlay.right.style.top = (position.top - 16).toString() + "px";
		this.overlay.right.style.left = (position.left + elementWidth + 18).toString() + "px";
		this.overlay.right.style.height = (elementHeight + 34).toString() + "px";
		
		this.overlay.bottom.style.top = (position.top + elementHeight + 18).toString() + "px";
		
		this.toolbar.container.style.top = (position.top - 16 - 20 - 8 - 32).toString() + "px";
		this.toolbar.container.style.left = (position.left - 16).toString() + "px";
		
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
	
	return Editor;
});
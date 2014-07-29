define([ "Editor", "ImageChanger" ], function(Editor, ImageChanger) {
	function Dytomate(options) {
		options = options || {};
		
		this.options = this.mergeOptions({
			container: "body",
			dataAttribute: "dytomate",
			doubleClickDelay: 250
		}, options);
		
		this.listeners = {};
		
		this.container = null;
		this.editor = null;
		this.enabled = false;
		
		this.enable();
	}
	
	Dytomate.prototype.enable = function() {
		if (!this.enabled) {
			this.initContainer();
			this.attachContainerListeners();
			
			this.enabled = true;
		}
		
		return this;
	};
	
	Dytomate.prototype.disable = function() {
		if (this.enabled) {
			if (this.editor) {
				this.closeTextElementEdit();
			}
			
			this.detachContainerListeners();
			this.deinitContainer();
			
			this.enabled = false;
		}
		
		return this;
	};
	
	Dytomate.prototype.edit = function(element) {
		if (element.tagName.toLowerCase() === "img") {
			return this.editImageElement(element);
		}
		else {
			return this.editTextElement(element);
		}
	};
	
	Dytomate.prototype.editImageElement = function(element) {
		var imageChanger = new ImageChanger(this, element);
		
		imageChanger.enable();
		
		return imageChanger;
	};
	
	Dytomate.prototype.editTextElement = function(element) {
		this.editor = new Editor(this, element);
		this.editor.enable();
		
		window.addEventListener("click", this.listeners.windowClick = function(event) {
			var element = event.target;
			
			while (element && this.container.contains(element)) {
				if (
					element.classList.contains("dytomate-editor-command-button") ||
					element.getAttribute("data-dytomate-in-edit") === "true"
				) {
					return;
				}
				
				element = element.parentNode;
			}
			
			this.closeTextElementEdit();
		}.bind(this));
		
		return this.editor;
	};
	
	Dytomate.prototype.closeTextElementEdit = function() {
		if (this.editor) {
			window.removeEventListener("click", this.listeners.windowClick);
			delete this.listeners.windowClick;
			
			this.editor.disable();
			this.editor = null;
		}
		
		return this;
	};
	
	Dytomate.prototype.initContainer = function() {
		if (typeof this.options.container === "string") {
			this.container = document.querySelector(this.options.container);
		}
		else {
			this.container = this.options.container;
		}
		
		return this;
	};
	
	Dytomate.prototype.deinitContainer = function() {
		this.container = null;
		
		return this;
	};
	
	Dytomate.prototype.attachContainerListeners = function() {
		this.container.addEventListener("click", this.listeners.containerClick = function(event) {
			if (event.detail !== "dytomate") {
				var element = event.target;
				
				while (element && this.container.contains(element)) {
					if (this.getElementDytomateAttribute(element) !== null) {
						if (element.getAttribute("data-dytomate-in-edit") !== "true") {
							event.preventDefault();
							event.stopPropagation();
							
							this.handleDoubleClick(element);
						}
						
						break;
					}
					else {
						element = element.parentNode;
					}
				}
			}
		}.bind(this));
		
		return this;
	};
	
	Dytomate.prototype.detachContainerListeners = function() {
		this.container.removeEventListener("click", this.listeners.containerClick);
		
		return this;
	};
	
	Dytomate.prototype.handleDoubleClick = function(element) {
		var timer = element.getAttribute("data-dytomate-double-click-timer");
		
		timer = timer ? parseInt(timer, 10) : false;
		
		if (timer) {
			clearTimeout(timer);
			element.removeAttribute("data-dytomate-double-click-timer");
			
			this.edit(element);
		}
		else {
			timer = setTimeout(function() {
				var event = new CustomEvent("click", {
					detail: "dytomate",
					bubbles: true,
					cancelable: true
				});
				
				element.removeAttribute("data-dytomate-double-click-timer");
				
				element.dispatchEvent(event);
			}.bind(this), this.options.doubleClickDelay);
			
			element.setAttribute("data-dytomate-double-click-timer", timer);
		}
		
		return this;
	};
	
	Dytomate.prototype.getElementDytomateAttribute = function(element) {
		return element.getAttribute("data-" + this.options.dataAttribute);
	};
	
	Dytomate.prototype.mergeOptions = function(defaults, overrides) {
		for (var i in overrides) {
			if (overrides.hasOwnProperty(i)) {
				defaults[i] = overrides[i];
			}
		}
		
		return defaults;
	};
	
	return Dytomate;
});
define([ "reqwest", "Editor", "ImageChanger" ], function(reqwest, Editor, ImageChanger) {
	function Dytomate(container, options) {
		options = options || {};
		
		this.container = container;
		
		this.options = this.mergeOptions({
			dataAttribute: "dytomate",
			doubleClickDelay: 250,
			editorPadding: 8,
			editorBorderWidth: 1,
			editorBorderColor: "#666",
			editorShadowSize: 10,
			editorShadowColor: "#333",
			editorOverlayColor: "rgba(255, 255, 255, .75)",
			editorToolbarOffsetX: 0,
			editorToolbarOffsetY: 8,
			editorToolbarButtonSize: 24,
			editorToolbarButtonSpacing: 4,
			editorToolbarButtonColor: "#fff",
			editorToolbarButtonHoverColor: "#BDF7FF",
			editorToolbarButtonShadowSize: 0,
			editorToolbarButtonShadowHoverSize: 5,
			editorToolbarButtonShadowColor: "#004A54",
			editorToolbarButtonBorderWidth: 1,
			editorToolbarButtonBorderColor: "#666"
		}, options);
		
		this.saveQueue = [];
		this.listeners = {};
		
		this.editor = null;
		this.currentlySaving = false;
		this.enabled = false;
		
		this.enable();
	}
	
	Dytomate.prototype.enable = function() {
		if (!this.enabled) {
			this.attachListeners();
			
			this.enabled = true;
		}
		
		return this;
	};
	
	Dytomate.prototype.disable = function() {
		if (this.enabled) {
			if (this.editor) {
				this.closeTextElementEdit();
			}
			
			this.detachListeners();
			
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
	
	Dytomate.prototype.save = function(key, value, isFile, onDone, fromQueue) {
		if (!fromQueue && this.saveQueue.length > 0) {
			this.saveQueue.push({
				key: key,
				value: value,
				isFile: isFile,
				onDone: onDone
			});
		}
		else {
			var url = isFile ? "/api/dytomate/upload" : "/api/dytomate/save";
			
			var finalize = function() {
				this.currentlySaving = false;
				
				if (this.saveQueue.length > 0) {
					var nextSave = this.saveQueue.shift();
					
					this.save(nextSave.key, nextSave.value, nextSave.isFile, nextSave.onDone, true);
				}
				
				if (onDone) {
					onDone();
				}
			}.bind(this);
			
			var onSuccess = function() {
				finalize();
			};
			
			var onError = function() {
				alert("Couldn't save `" + key + "`.");
				
				finalize();
			};
			
			if (typeof key === "object") {
				key = this.getElementDytomateAttribute(key);
			}
			
			this.currentlySaving = true;
			
			reqwest({
				url: url,
				method: "post",
				data: { key: key, value: value },
				error: function(error) {
					onError();
				},
				success: function(response) {
					response = parseInt(response, 10);
					
					if (response === 1) {
						onSuccess();
					}
					else {
						onError();
					}
				}
			});
		}
		
		return this;
	};
	
	Dytomate.prototype.saveText = function(key, value, onDone) {
		return this.save(key, value, false, onDone, false);
	};
	
	Dytomate.prototype.saveFile = function(key, file, onDone) {
		var reader = new FileReader();
		
		reader.onload = function(event) {
			var blob = event.target.result.split(",")[1];
			
			this.save(key, { name: file.name, blob: blob }, true, onDone, false);
		}.bind(this);
		
		reader.readAsDataURL(file);
		
		return this;
	};
	
	Dytomate.prototype.attachListeners = function() {
		window.onbeforeunload = function(event) {
			if (this.saveQueue.length > 0 || this.currentlySaving) {
				return "Changes are still being saved. Are you sure you want to navigate away ( changes will be lost )?";
			}
		}.bind(this);
		
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
	
	Dytomate.prototype.detachListeners = function() {
		delete window.onbeforeunload;
		
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
define([], function() {
	function ImageChanger(dytomate, element) {
		this.dytomate = dytomate;
		this.element = element;
		
		this.body = null;
		this.input = null;
		this.listeners = {};
		this.enabled = false;
	}
	
	ImageChanger.prototype.enable = function() {
		if (!this.enabled) {
			this.body = document.querySelector("body");
			
			this.initFileInput();
			this.openBrowseDialog();
			
			this.enabled = true;
		}
		
		return this;
	};
	
	ImageChanger.prototype.disable = function() {
		if (this.enabled) {
			this.deinitFileInput();
			
			this.body = null;
			
			this.enabled = false;
		}
		
		return this;
	};
	
	ImageChanger.prototype.openBrowseDialog = function() {
		var event = new Event("click");
		
		this.input.dispatchEvent(event);
		
		return this;
	};
	
	ImageChanger.prototype.preview = function(doneCallback) {
		var doneCallbackCaller = function() {
			if (doneCallback) {
				doneCallback.call(this);
			}
		}.bind(this);
		
		if (this.input.files && this.input.files[0]) {
			var fileReader = new FileReader();
			
			fileReader.onload = function(e) {
				var image = new Image();
				
				image.onload = function() {
					this.element.src = e.target.result;
					
					doneCallbackCaller();
				}.bind(this);
				
				image.onerror = function() {
					doneCallbackCaller();
				}.bind(this);
				
				image.src = e.target.result;
			}.bind(this);
			
			fileReader.readAsDataURL(this.input.files[0]);
		}
		
		return this;
	};
	
	ImageChanger.prototype.initFileInput = function() {
		this.input = document.createElement("input");
		
		this.input.type = "file";
		this.input.style.display = "none";
		
		this.attachFileInputListener(function() {
			this.preview(function() {
				this.disable();
			});
		});
		
		this.body.appendChild(this.input);
		
		return this;
	};
	
	ImageChanger.prototype.deinitFileInput = function() {
		this.detachFileInputListener();
		
		this.body.removeChild(this.input);
		this.input = null;
		
		return this;
	};
	
	ImageChanger.prototype.attachFileInputListener = function(listener) {
		this.input.addEventListener("change", this.listeners.inputChange = function() {
			this.detachFileInputListener();
			
			listener.call(this);
		}.bind(this));
		
		return this;
	};
	
	ImageChanger.prototype.detachFileInputListener = function() {
		if (this.listeners.inputChange) {
			this.input.removeEventListener("change", this.listeners.inputChange);
			delete this.listeners.inputChange;
		}
		
		return this;
	};
	
	ImageChanger.prototype.requestImageUpload = function() {
		var input = document.createElement("input");
		
		input.type = "file";
		input.addEventListener("change", this.listeners.fileInputChange = function() {
			console.log("CHANGED!!!");
		}.bind(this));
	};
	
	return ImageChanger;
});
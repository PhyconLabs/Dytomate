requirejs([ "Dytomate" ], function(Dytomate) {
	window.Dytomate = Dytomate;
	
	function initDytomate() {
		var html = document.querySelector("html");
		
		if (!html.classList.contains("no-auto-dytomate")) {
			var body = document.querySelector("body");
			var options = body.getAttribute("data-dytomate");
			
			try {
				options = JSON.parse(options);
				
				if (typeof options !== "object") {
					options = {};
				}
			}
			catch (e) {
				options = {};
			}
			
			body.removeAttribute("data-dytomate");
			
			window.dytomate = new Dytomate(body, options);
		}
	}
	
	if ([ "complete", "loaded", "interactive" ].indexOf(document.readyState) !== -1) {
		initDytomate();
	}
	else {
		document.addEventListener("DOMContentLoaded", initDytomate);
	}
});
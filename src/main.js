requirejs([ "Dytomate" ], function(Dytomate) {
	function initDytomate() {
		var dytomate = new Dytomate();
	}
	
	if ([ "complete", "loaded", "interactive" ].indexOf(document.readyState) !== -1) {
		initDytomate();
	}
	else {
		document.addEventListener("DOMContentLoaded", initDytomate);
	}
});
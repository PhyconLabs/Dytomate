requirejs([ "Dytomate" ], function(Dytomate) {
	function initDytomate() {
		window.dytomate = new Dytomate(); // FIXME: don't globalise
	}
	
	if ([ "complete", "loaded", "interactive" ].indexOf(document.readyState) !== -1) {
		initDytomate();
	}
	else {
		document.addEventListener("DOMContentLoaded", initDytomate);
	}
});
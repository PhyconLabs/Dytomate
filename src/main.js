requirejs([ "Dytomate" ], function(Dytomate) {
	function initDytomate() {
		window.dytomate = new Dytomate(); // FIXME: don't globalise
	}
	
	if (document.readyState === "complete") {
		initDytomate();
	}
	else {
		document.addEventListener("DOMContentLoaded", initDytomate);
	}
});
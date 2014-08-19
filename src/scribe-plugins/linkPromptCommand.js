define([], function() {
	return function() {
		return function(scribe) {
			var command = new scribe.api.Command("createLink");
			var containerIsLink = scribe.el.tagName.toLowerCase() === "a";
			
			command.nodeName = "A";
			
			command.execute = function() {
				var node;
				
				if (containerIsLink) {
					node = scribe.el;
				} else {
					var selection = new scribe.api.Selection();
					var range = selection.range;
					
					node = selection.getContaining(function(node) {
						return node.nodeName === this.nodeName;
					}.bind(this));
				}
				
				var initialHref = node ? node.href : "http://";
				var href = window.prompt("Enter a link.", initialHref);
				
				if (!containerIsLink && node) {
					range.selectNode(node);
					selection.selection.removeAllRanges();
					selection.selection.addRange(range);
				}
				
				if (href) {
					if (!/^https?\:\/\//.test(href)) {
						if (!/^mailto\:/.test(href) && /@/.test(href)) {
							href = 'mailto:' + href;
						} else {
							href = "http://" + href;
						}
					}
					
					if (containerIsLink) {
						node.href = href;
					} else {
						scribe.api.SimpleCommand.prototype.execute.call(this, href);
					}
				}
			};
			
			command.queryState = function() {
				var selection = new scribe.api.Selection();
				
				return !! selection.getContaining(function(node) {
					return node.nodeName === this.nodeName;
				}.bind(this));
			};
			
			scribe.commands.linkPrompt = command;
		};
	};
});
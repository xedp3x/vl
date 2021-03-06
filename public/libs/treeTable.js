// vim:noet:sw=8:

$.widget("ui.treeTable", {
	options: {
		moveWidth: 70,
		listMargin: 15,
		styles: {},
		move: {}
	},

	_create: function() {
		var self = this;
		// generateID may return trailing numbers, which are forbidden in classNames
		this.prefix = "a" + generateID() + "-";

		this.element.nestedSortable({
			handle : '.' + this.prefix + 'move',
			items : "li." + this.prefix,
			toleranceElement : "> div",
			update: function (ev, ui) {
				var id = ui.item.children("." + self.prefix + "id").text();
				var type = ui.item.children("." + self.prefix + "type").text();
				var parentid = null;
				var parenttype = null;
				if (! ui.item.parent().hasClass("ui-sortable")) {
					parentid = ui.item.parent().parent().children("." + self.prefix + "id").text();
					parenttype = ui.item.parent().parent().children("." + self.prefix + "type").text();
				}
				var position = ui.item.parent().children("." + self.prefix + type).index(ui.item);

				if (!self.options.move[type] || !self.options.move[type][parenttype]) {
					return false;
				}
				return self.options.move[type][parenttype](id, parentid, position);
			}
		});
	},

	onMove : function (type, parenttype, callback) {
		if (parenttype instanceof Array) {
			for (var i in parenttype) {
				this.onMove(type, parenttype[i], callback);
			}
		}

		if (!this.options.move[type]) {
			this.options.move[type] = new Array();
		}
		this.options.move[type][parenttype] = callback;
	},

	_getMaximumPosition : function (parentList, type) {
		var maxPos = 0;
		var children = parentList.children("li." + this.prefix + type);
		for (var i=0; i<children.length; i++) {
			var pos = $(children[i]).children("." + this.prefix + "position").text();
			if (pos > maxPos) {
				maxPos = pos;
			}
		}
		return parseInt(maxPos);
	},

	add : function (type, id, parenttype, parentid, position, data) {
		var self = this;
		var contentItem = $("<div>").addClass(this.prefix + type);
		for (var key in data) {
			var fieldItem = data[key].addClass(this.prefix + type).addClass(this.prefix + key).css("float", "left");
			if (this.options.styles[type] && this.options.styles[type][key]) {
				fieldItem.css(this.options.styles[type][key]);
			}
			contentItem.append(fieldItem);
		}
		contentItem.append($("<div>").css("clear", "left"));

		var parentList = null;
		// Avoid errors like 1 + 1 = 11
		position = parseInt(position);
		if (parentid == null) {
			parentList = this.element;
		} else {
			var parent = this._getOuter(parenttype, parentid);
			if (parent.children("ol").length == 0) {
				parent.append($("<ol>"));
				parent.children("." + this.prefix + "expand").empty().append(
					$("<i>").addClass("icon icon-minus-sign").click(function () {
						var childList = parent.children("ol");
						childList.toggle();
						$(this).toggleClass("icon-minus-sign", ! childList.is(":hidden")).toggleClass("icon-plus-sign", childList.is(":hidden"));
					})
				);
			}
			parentList = parent.children("ol");
		}

		var moveWidth = this.options.moveWidth;
		var current = parentList;
		while (! current.hasClass("ui-sortable") && moveWidth > 0) {
			moveWidth -= this.options.listMargin;
			current = current.parent().parent();
		}

		var item = $("<li>").attr("id", this.prefix + type + "-" + id).addClass(this.prefix).addClass(this.prefix + type).addClass(this.prefix + "pos" + position)
			.append($("<span>").addClass(this.prefix + "type").text(type).hide())
			.append($("<span>").addClass(this.prefix + "id").text(id).hide())
			.append($("<span>").addClass(this.prefix + "position").text(position).hide())
			.append($("<span>").addClass(this.prefix + "move").css("float","left")
				.append($("<i>").addClass("icon icon-move")))
			.append($("<span>").addClass(this.prefix + "expand").css("float","left").css("width","2em").html("&nbsp;") )
			.append($("<span>").css("float","left").css("width", moveWidth + "px").html("&nbsp;"))
			.append(contentItem);

		if (parentList.children("li." + (this.prefix + type) + "." + (this.prefix + "pos" + position)).length > 0) {
			var maxPosition = this._getMaximumPosition(parentList, type);
			// Decrease pos. Else we would match 2 elements at the same time
			for (var pos = maxPosition; pos >= position; pos--) {
				var currentPosition = parentList.children("li." + (this.prefix + type) + "." + (this.prefix + "pos" + pos));
				currentPosition.removeClass(this.prefix + "pos" + pos);
				currentPosition.addClass(this.prefix + "pos" + (pos+1));
				currentPosition.children("." + this.prefix + "position").text(pos+1);
			}
		}

		var preItem = null;
		for (var pos = position; pos >= 0 && preItem == null; pos--) {
			preItem = parentList.children("li." + (this.prefix + type) + "." + (this.prefix + "pos" + pos));
			if (preItem.length == 0) {
				preItem = null;
			}
		}
		if (preItem == null) {
			parentList.prepend(item);
		} else {
			preItem.after(item);
		}
	},

	_getOuter : function (type, id) {
		return this.element.find("#" + (this.prefix + type + "-" + id));
	},

	get : function (type, id, element) {
		var item = this._getOuter(type, id).children("." + this.prefix + type);
		if (element) {
			item = item.children("." + this.prefix + element);
		}
		return item;
	},

	remove : function (type, id) {
		var item = this._getOuter(type, id);
		var parentList = item.parent();
		var position = parseInt(item.children("." + this.prefix + "position").text());

		var maxPosition = this._getMaximumPosition(parentList, type);
		for (var pos = position; pos <= maxPosition; pos++) {
			var currentPosition = parentList.children("li." + (this.prefix + type) + "." + (this.prefix + "pos" + pos));
			currentPosition.removeClass(this.prefix + "pos" + pos);
			currentPosition.addClass(this.prefix + "pos" + (pos-1));
			currentPosition.children("." + this.prefix + "position").text(pos-1);
		}

		item.remove();
	}
});

function socket() {
}

socket.prototype.connect = function (connectCallback) {
	this.socketIo = io.connect();
	this.socketIo.on('connect', connectCallback);
}

socket.prototype.registerIdentifyBeamer = function (callback) {
	this.socketIo.on('beamer-identify', function (data) {
		callback(data.timeout);
	});
	this.socketIo.emit('registeridentifybeamer', {});
}

socket.prototype.registerBeamers = function (callbacks) {
	var self = this;
	this.socketIo.on('beamer-add', function (data) {
		self.registerBeamer(data.beamerid, callbacks);
		callbacks.init(data.beamerid, data.beamer);
		callbacks.update(data.beamerid, data.beamer);
	});
	this.socketIo.emit('registerbeamers', {});
}

socket.prototype.registerBeamer = function (beamerid, callbacks) {
	this.socketIo.on('beamer-change:' + beamerid, function (data) {
		callbacks.update(beamerid, data.beamer, data.currentslide);
	});
	this.socketIo.on('beamer-flash:' + beamerid, function (data) {
		callbacks.flash(beamerid, data.flash);
	});
	this.socketIo.on('beamer-showtimer:' + beamerid, function (data) {
		callbacks.showTimer(beamerid, data.timerid, data.timer);
	});
	this.socketIo.on('beamer-hidetimer:' + beamerid, function (data) {
		callbacks.hideTimer(beamerid, data.timerid, data.timer);
	});
	this.socketIo.emit('registerbeamer', { beamerid : beamerid });
}

socket.prototype.registerAgenda = function (callbacks) {
	var self = this;
	this.socketIo.on('slide-add', function (data) {
		self.registerSlide(data.slideid, callbacks.update);
		callbacks.init(data.slideid, data.slide);
		callbacks.update(data.slideid, data.slide);
	});
	this.socketIo.emit('registeragenda', {});
}

socket.prototype.registerSlide = function (slideid, updateCallback) {
	this.socketIo.on('slide-change:' + slideid, function (data) {
		updateCallback(slideid, data.slide);
	});
	this.socketIo.emit('registerslide', { slideid : slideid });
}

socket.prototype.unregisterSlide = function (slideid) {
	this.socketIo.emit('unregisterslide', { slideid : slideid });
}

socket.prototype.registerTimers = function (callbacks) {
	var self = this;
	this.socketIo.on('timer-add', function (data) {
		self.registerTimer(data.timerid, callbacks);
		callbacks.init(data.timerid, data.timer);
		callbacks.update(data.timerid, data.timer);
	});
	this.socketIo.emit('registertimers', {});
}

socket.prototype.registerTimer = function (timerid, callbacks) {
	this.socketIo.on('timer-change:' + timerid, function (updateData) {
		callbacks.update(timerid, updateData.timer);
	});
	socket.socketIo.emit('registertimer', { timerid : timerid });
}

socket.prototype.unregisterTimer = function (timerid) {
	socket.socketIo.emit('unregistertimer', { timerid : timerid });
}
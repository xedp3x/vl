exports.getRootSlideID = function (callback) {
	db.get('rootslideid', function (err, rootslideid) {
		callback(rootslideid);
	});
}

exports.setRootSlideID = function (rootslideid, callbackSuccess) {
	db.set('rootslideid', rootslideid, function () {
		if (callbackSuccess) {
			callbackSuccess();
		}
	});
}

exports.exists = function (slideid, callback) {
	db.exists('slides:' + slideid, function (err, exists) {
		callback(exists);
	});
}

exports.get = function(slideid, callback) {
	db.hgetall('slides:' + slideid, function (err, slide) {
		callback(slide);
	});
}

exports.eachChildren = function(slideid, callback) {
	db.zrange('slides:' + slideid + ':children', 0, -1, function (err, subslideids) {
		subslideids.forEach(function (subslideid) {
			exports.get(subslideid, function (subslide) {
				callback(subslideid, subslide);
			});
		});
	});
}

exports.getAll = function(callback) {
	function handleSlide(slideid, slide) {
		callback(slideid, slide);
		exports.eachChildren(slideid, function (subslideid, subslide) {
			handleSlide(subslideid, subslide);
		});
	}
	db.get('rootslideid', function (err, rootslideid) {
		exports.get(rootslideid, function (rootslide) {
			handleSlide(rootslideid, rootslide);
		});
	});
}

exports.add = function(slideid, slide, callbackSuccess) {
	db.zcard('slides:' + slide.parentid + ':children', function (err, slidecount) {
		exports.save(slideid, slide, function() {
			io.sockets.emit('slide-add', { slideid : slideid, slide : slide });
			db.zadd('slides:' + slide.parentid + ":children", slidecount, slideid, function (err) {});

			if (callbackSuccess) {
				callbackSuccess();
			}
		});
	});
}

exports.save = function(slideid, slide, callbackSuccess) {
	db.hmset('slides:' + slideid, slide, function (err) {
		io.sockets.emit('slide-change:' + slideid, { slide : slide });

		if (callbackSuccess) {
			callbackSuccess();
		}
	});
}

exports.move = function(slideid, parentid, position, callbackSuccess) {
	exports.get(slideid, function (slide) {
		db.zrank('slides:' + slide.parentid + ':children', slideid, function (err, slideindex) {
			db.zrange('slides:' + slide.parentid + ':children', slideindex, -1, function (err, childids) {
				if (childids) {
					childids.forEach(function (childid) {
						// Not decrement when childid == slideid, as slideid will get removed parallel
						if (childid != slideid) {
							db.zincrby('slides:' + slide.parentid + ':children', -1, childid);
						}
					});
				}
			});
			db.zrem('slides:' + slide.parentid + ':children', slideid, function (err) {
				slide.parentid = parentid;
				exports.save(slideid, slide, function () {
					db.zrangebyscore('slides:' + parentid + ':children', position, '+inf', function (err, childids) {
						if (childids) {
							childids.forEach(function (childid) {
								db.zincrby('slides:' + parentid + ':children', 1, childid);
							});
						}
					});
					db.zadd('slides:' + parentid + ':children', position, slideid, function () {
						if (callbackSuccess) {
							callbackSuccess();
						}
					});
				});
			});
		});
	});
}

exports.delete = function(slideid, callbackSuccess) {
	db.hget('slides:' + slideid, 'parentid', function (err, parentid) {
		db.zrem('slides:' + parentid + ':children', slideid, function (err) {
			db.del('slides:' + slideid, function (err) {
				io.sockets.emit('slide-delete:' + slideid, {});

				if (callbackSuccess) {
					callbackSuccess();
				}
			});
		});
	});
}

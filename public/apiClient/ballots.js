// vim:noet:sw=8:

APIClient.prototype.ballots = {};

APIClient.prototype.getBallot = function (ballotid, callback) {
	callback(this.ballots[ballotid]);
}

APIClient.prototype.registerBallot = function (ballotid) {
	var self = this;
	this.listen("/ballots", 'err:ballot-not-found:' + ballotid, function (data) {
		console.log("[APIClient] Ballot not found: " + ballotid);
		self.callCallback("error:ballotNotFound", [ ballotid ]);
	});
	this.listen("/ballots", 'ballot-change:' + ballotid, function (updateData) {
		self.ballots[ballotid] = updateData.ballot;

		self.callCallback("updateBallot", [ ballotid, updateData.ballot ] );
	});
	this.listen("/ballots", 'ballot-delete:' + ballotid, function (data) {
		self.unregisterBallot(ballotid);
		self.callCallback("deleteBallot", [ ballotid ] );
	});
	this.listen("/ballots", 'option-add:' + ballotid, function (data) {
		self.registerOption(data.optionid);

		self.callCallback("initBallotOption", [ ballotid, data.optionid, data.position ]);
	});
	this.emit("/ballots", 'registerballot', { ballotid : ballotid });
}

APIClient.prototype.unregisterBallot = function (ballotid) {
	this.unlisten("/ballots", 'err:ballot-not-found:' + ballotid);
	this.unlisten("/ballots", 'ballot-change:' + ballotid);
	this.unlisten("/ballots", 'ballot-delete:' + ballotid);
	this.unlisten("/ballots", 'option-add:' + ballotid);
}

APIClient.prototype.saveBallot = function(ballotid, ballot, callbackSuccess) {
	$.ajax({
		type: 'PUT',
		url: '/ballots/' + ballotid + '/save',
		data: { ballot : ballot },
		success: callbackSuccess
	});
}

APIClient.prototype.ballotAddOption = function(ballotid, optionid, option, callbackSuccess) {
	$.ajax({
		type: 'PUT',
		url: '/ballots/' + ballotid + '/addOption',
		data: { optionid: optionid, option: option },
		success: callbackSuccess
	});
}

APIClient.prototype.ballotMoveOption = function(ballotid, optionid, position, callbackSuccess) {
	$.ajax({
		type: 'POST',
		url: '/ballots/' + ballotid + '/moveOption',
		data: { optionid : optionid, position: position },
		success: callbackSuccess
	});
}

APIClient.prototype.ballotDeleteOption = function(ballotid, optionid, callbackSuccess) {
	$.ajax({
		type: 'POST',
		url: '/ballots/' + ballotid + '/deleteOption',
		data: { optionid : optionid },
		success: callbackSuccess
	});
}

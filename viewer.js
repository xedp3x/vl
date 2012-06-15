/**
 * Module dependencies.
 */

var routes = require('./routes'),
    app = require('./app.js');

// Routes

app.get('/', routes.viewer.index);
app.get('/beamer', routes.viewer.beamer_default);
app.get('/beamer/:beamerid', routes.viewer.beamer);

app.listen(3000, function(){
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var WorkspaceSchema   = new Schema({
	token: String,
	userId: String,
    workspace: String,
	workspace_image: String,
	workspace_background: String,
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
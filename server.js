// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
const axios = require('axios');
const cors = require('cors')
// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

var port     = process.env.PORT || 3001; // set our port

// DATABASE SETUP
var mongoose   = require('mongoose');
mongoose.connect('mongodb://mobx:Admin123#@ds013911.mlab.com:13911/stickflame'); // connect to our database

// Handle the connection event
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  console.log("DB connection alive");
});

// Bear models lives here
var Bear     = require('./app/models/bear');
var Workspace     = require('./app/models/workspace');

// ROUTES FOR OUR API
// =============================================================================

// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});
app.use(function (req, res, next) {

    // Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', 'https://invitetoslack.netlify.com/');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });
});

router.route('/invite/:email').get( (req, res) => {
	const id = req.get('x-token-id');
	const email = req.params.email;
	const SLACK_INVITE_ENDPOINT = 'https://slack.com/api/users.admin.invite';
	console.log(email, '--------tst--------', id);

	Workspace.findById(id, function (err, workspace) {
		if(err){
			res.json({ ok: false, error: err })
		}
		else{
			const token = workspace.token;
			const QUERY_PARAMS = `email=${email}&token=${token}&set_active=true`;

			axios.get(`${SLACK_INVITE_ENDPOINT}?${QUERY_PARAMS}`)
				.then(({status, data}) => res.json(data))
				.catch((error) => res.json({ok: false, error}))
		}
	});
})
router.route('/workspace')
	.post(function(req, res) {
		var workspace = new Workspace();		// create a new instance of the Bear model
		workspace.workspace = req.body.workspace;  // set the bears name (comes from the request)
		workspace.userId = req.body.userId;  // set the bears name (comes from the request)
		workspace.token = req.body.token;  // set the bears name (comes from the request)
		workspace.workspace_image = req.body.workspace_image;  // set the bears name (comes from the request)
        workspace.workspace_background = req.body.workspace_background;
		workspace.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'workspace created!' });
		});
	})

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		const userId = req.get('x-token-userid');
		console.log(email,'--------tst--------',userId);
		if(userId){
			Workspace.find({ userId },function (err, workspace) {
				if (err)
					res.send(err);

				res.json(workspace);
			});
		}
		else{
		    res.json({ok:false, error: 'No data found.'});
		}
	});
// on routes that end in /bears
// ----------------------------------------------------
router.route('/get/:workspace')
	// get the bear with that id
	.get(function(req, res) {
		Workspace.find({workspace: req.params.workspace}, function(err, workspace) {
			if (err)
				res.send(err);

    		if (workspace.length === 0){

			}
			else {
			const [ workspaceData ] = workspace;
			const SLACK_USERS_ENDPOINT = 'https://slack.com/api/users.list';
			const QUERY_PARAMS = `token=${workspaceData.token}&presence=true`;

			axios.get(`${SLACK_USERS_ENDPOINT}?${QUERY_PARAMS}`)
				.then(({ status, data: { ok, members} }) => {
					if(status===200 && ok){
						let totalUsers = 0;
						let onlineUsers = 0;
						members.forEach((user) => {
							if (user.id !== 'USLACKBOT' && !user.is_bot && !user.deleted) {
								totalUsers++;
								if (user.presence === 'active') {
									onlineUsers++;
								}
							}
						});
						res.json({
							ok: true,
							id: workspaceData.id,
							workspace_background: workspaceData.workspace_background,
							workspace_image: workspaceData.workspace_image,
							workspace: workspaceData.workspace,
							totalUsers,
							onlineUsers,
						});
					}
					else{
					}
				});
				}
		});
	});
router.route('/getall/:userId')

	// get the bear with that id
	.get(function (req, res) {
		const userId = req.params.userId;
		if (userId) {
			Workspace.find({ userId }, function (err, workspace) {
				if (err)
					res.send(err);

				res.json(workspace);
			});
		}
		else {
			res.json({ ok: false, error: 'No data found.' });
		}
	});


// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

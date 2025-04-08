// server.js
const express = require('express');
const path = require('path');
const logger = require('morgan');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
app.locals.pretty = true; 

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Routes
const routes = require('./routes/index');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger('dev', {
    skip: function (req, res) {
        return req.url === '/save-workout' || req.url === '/remove-workout';
    }
}));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Route Handlers
app.get('/', routes.indexPage);
app.get('/login', routes.loginPage);
app.get('/register', routes.registerPage);
app.get('/workouts', routes.workoutsPage);
app.get('/get-workouts', routes.getWorkouts);
app.get('/logout', routes.logout);

// Admin route with session check
app.get('/admin', routes.adminPage);

// Fetch workout exercises from WGER API
app.get('/exercises', async (req, res) => {
    try {
        const response = await fetch('https://wger.de/api/v2/exerciseinfo/?language=2&limit=300');
        const data = await response.json();

        if (data.results && Array.isArray(data.results)) {
            res.json(data.results);
        } else {
            console.error('Invalid data structure:', data);
            res.status(500).json({ error: 'Invalid response structure from API' });
        }
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({ error: 'Failed to fetch exercises' });
    }
});
app.delete('/remove-workout', routes.removeWorkout)
// POST routes
app.post('/login', routes.login);
app.post('/register', routes.register);
app.post('/removeUser', routes.removeUser);
app.post('/save-workout', routes.saveWorkout);
app.post('/update-weight', routes.updateWeight);
app.post('/update-fitness-goals', routes.updateFitG);

// 404 handler
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

// General error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, err => {
    if (err) console.error(err);
    else {
        console.log(`Server listening on port: ${PORT}`);
        console.log(`To Test: http://localhost:${PORT}`);
    }
});

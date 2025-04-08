const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/db_users'); // Database file location
// Ensure the database table and some users are created
db.serialize(function () {
    db.run("DROP TABLE IF EXISTS users");

    db.run(`CREATE TABLE IF NOT EXISTS users (
        userid TEXT PRIMARY KEY, 
        password TEXT, 
        role TEXT, 
        height INTEGER, 
        weight INTEGER, 
        age INTEGER, 
        fitness_goals TEXT,
        gender TEXT
    )`);
    db.run("DROP TABLE IF EXISTS workouts");
    db.run(`CREATE TABLE IF NOT EXISTS workouts (
        workout_id INTEGER PRIMARY KEY AUTOINCREMENT,
        userid TEXT,
        workoutname TEXT,
        description TEXT,
        category TEXT,
        imageURL TEXT,
        FOREIGN KEY(userid) REFERENCES users(userid)
    )`);

    // Add test users
    db.run(`INSERT OR REPLACE INTO users (userid, password, role, height, weight, age, fitness_goals, gender)
            VALUES ('ldnel', 'secret', 'admin', 180, 75, 30, 'Strength training', 'male')`);
    db.run(`INSERT OR REPLACE INTO users (userid, password, role, height, weight, age, fitness_goals, gender)
            VALUES ('frank', 'secret2', 'user', 170, 120, 25, 'Strength training', 'male')`);
});

// Route to handle login
exports.login = function(req, res) {
    const { userid, password } = req.body;

    // Check if the user exists
    db.get("SELECT * FROM users WHERE userid = ?", [userid], function(err, row) {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
    
        if (row) {
            if (row.password === password) {
                req.session.role = row.role;
                req.session.userid = row.userid;
                if (row.role === 'admin') {
                    return res.redirect('/admin'); // Use return to stop further execution
                } else {
                    return res.redirect('/workouts'); // Use return here too
                }
            } else {
                return res.render('login', { title: 'Login for Muscle Map', error: 'Incorrect password. Please try again.' });
            }
        } else {
            return res.render('login', { title: 'Login for Muscle Map', error: 'User not registered. Please register first.' });
        }
    });
};
// Route to handle registration
exports.register = function(req, res) {
    const { userid, password, height, weight, age, fitness_goals, gender} = req.body;

    db.get("SELECT * FROM users WHERE userid = ?", [userid], function(err, row) {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
            return res.render('register', { title: 'Register for Muscle Map', error: 'User already exists. Please Sign in' });
        }

        // Insert the new user into the database
        db.run(`INSERT INTO users (userid, password, role, height, weight, age, fitness_goals, gender) VALUES (?, ?, 'user', ?, ?, ?, ?, ?)`, 
        [userid, password, height, weight, age, fitness_goals, gender], function(err) {
            if (err) {
                console.error('Error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            // After successful registration, store the userid in session
            req.session.userid = userid;
            return res.redirect('/workouts');  // Redirect to workouts page
        });
    });
};

// Rendering the login page (First page)
exports.loginPage = function (req, res) {
   return res.render('login', { title: 'Login for Muscle Map' });
};

// Rendering the register page
exports.registerPage = function (req, res) {
    return res.render('register', { title: 'Register for Muscle Map' });
};

// Rendering the index page (Home page after login or registration)
exports.indexPage = function (req, res) {
    return res.render('index', { title: 'Welcome to Muscle Map' });
};
exports.workoutsPage = function(req, res) {
    const { userid } = req.session;

    if (!userid) {
        return res.redirect('/login');
    }
    // Fetch only the necessary user data to render the page
    db.get("SELECT * FROM users WHERE userid = ?", [userid], function(err, userRow) {
        if (err || !userRow) {
            console.error('Error fetching user data:', err);
            return res.status(500).json({ error: 'Database error or user not found' });
        }

        const bmr = calculateBMR(userRow);
        const bmi = calculateBMI(userRow);
        const bmiCategory = getBMICategory(bmi);
        const bodyFatPercent = calculateBodyFat(userRow);
        // Render the page with user-specific data
        return res.render('workouts', {
            title: 'Your Muscle Map Workouts',
            userid: userRow.userid,
            weight: userRow.weight,
            fitness_goals: userRow.fitness_goals,
            bmr,
            bmi,
            bmiCategory,
            bodyFatPercent
        });
    });
};

// Function to calculate BMI
function calculateBMI(user) {
    const heightInInches = user.height * 0.393701; // Convert cm to inches
    const bmi = (user.weight / (heightInInches * heightInInches)) * 703;  // BMI formula
    return Math.round(bmi * 10) / 10;  // Round to one decimal place
}

// Function to get BMI category
function getBMICategory(bmi) {
    if (bmi < 18.5) {
        return 'Underweight';
    } else if (bmi < 24.9) {
        return 'Normal weight';
    } else if (bmi < 29.9) {
        return 'Overweight';
    } else {
        return 'Obesity';
    }
}

// Function to calculate BMR using the Harris-Benedict equation
function calculateBMR(user) {
    const heightInInches = user.height * 0.393701; // Convert cm to inches
    const weightInLbs = user.weight; // Weight in pounds
    const age = user.age;

    let bmr;

    if (user.gender === "male") {
        bmr = 66.5 + (6.23 * weightInLbs) + (12.7 * heightInInches) - (6.8 * age);
    } else if (user.gender === "female") {
        bmr = 655 + (4.35 * weightInLbs) + (4.7 * heightInInches) - (4.7 * age);
    } else {
        throw new Error("Invalid gender");
    }

    return Math.ceil(bmr); // Round up BMR
}

// Function to calculate body fat percentage
function calculateBodyFat(user) {
    const bmi = calculateBMI(user); // Use updated BMI function

    let bodyFatPercentage;

    if (user.gender === "male") {
        bodyFatPercentage = (1.20 * bmi) + (0.23 * user.age) - 16.2;
    } else if (user.gender === "female") {
        bodyFatPercentage = (1.20 * bmi) + (0.23 * user.age) - 5.4;
    } else {
        throw new Error("Invalid gender");
    }

    return Math.round(bodyFatPercentage * 10) / 10;  // Round to one decimal place
}

// Route to display users for admin
exports.adminPage = function(req, res) {
    const { userid, role } = req.session;  // Get the user ID and role from session

    // Check if the user is an admin
    if (role !== "admin") {
        return res.redirect('/login');  // Redirect non-admin users to the login page
    }

    // Fetch all users from the database
    db.all("SELECT userid, fitness_goals, role FROM users", function(err, rows) {
        if (err) {
            console.error('Error fetching users:', err);
            return res.render('admin', {
                title: 'Admin - Manage Users',
                error: 'An error occurred while fetching user data. Please try again later.'
            });
        }

        // Handle empty user list
        if (rows.length === 0) {
            return res.render('admin', {
                title: 'Admin - Manage Users',
                users: [],
                message: 'No users found.'
            });
        }
        rows.forEach(user => {
            user.isAdmin = user.role === "admin";
        });
        
        // Render the admin page with the list of users
        return res.render('admin', {
            title: 'Admin - Manage Users',
            users: rows
        });
    });
};

// Route to remove a user (only accessible by admin)
exports.removeUser = function(req, res) {
    const { userid } = req.body;

    const { role } = req.session;  // Get the user role from session

    // Check if the user is an admin
    if (role !== "admin") {
        return res.redirect('/login');  // Redirect non-admin users to the login page
    }

    // Delete the user from the database
    db.run("DELETE FROM users WHERE userid = ?", [userid], function(err) {
        if (err) {
            console.error('Error removing user:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Redirect to the admin page after removing the user
        return res.redirect('/admin');
    });
};
// Update weight handler
exports.updateWeight = (req, res) => {
    const { weight } = req.body;
    const userId = req.session.userid; // Assuming the user is logged in and we have their ID in the session

    console.log('Received weight:', weight); // Log the weight to verify it's coming correctly

    if (!weight || isNaN(weight) || weight < 50 || weight > 1000) {
        return res.status(400).json({ error: 'Invalid weight' });
    }
    // Update weight in the database
    db.run('UPDATE users SET weight = ? WHERE userid = ?', [weight, userId], function(err) {
        if (err) {
            console.error('Database error:', err);  // Log the error if any
            return res.status(500).json({ error: 'Database error' });
        }

        // Fetch the updated user data after the weight update
        db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, row) => {
            if (err) {
                console.error('Error fetching updated user:', err);  
                return res.status(500).json({ error: 'Database error' });
            }
            const bmr = calculateBMR(row);   
            const bmi = calculateBMI(row); 
            const bmiCategory = getBMICategory(bmi); 
            const bodyFatPercent = calculateBodyFat(row); 

            // Return the updated data to the client
            return res.json({
                success: true,
                weight: row.weight,  // Updated weight
                bmr: bmr,
                bmi: bmi,
                bmiCategory: bmiCategory,
                bodyFatPercent: bodyFatPercent
            });
        });
    });
};

// Update fitness goal handler
exports.updateFitG = (req, res) => {
    const { goal } = req.body;
    const userId = req.session.userid; // Assuming the user is logged in and we have their ID in the session

    if (!goal) {
        return res.status(400).json({ error: 'No fitness goal provided' });
    }

    // Update fitness goal in the database
    db.run('UPDATE users SET fitness_goals = ? WHERE userid = ?', [goal, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, goal });
    });
};
exports.saveWorkout = function(req, res) {
    const { workoutname, description, category, imageURL } = req.body;
    const userid = req.session.userid;

    // Ensure the user is logged in
    if (!userid) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    // Ensure all required fields are provided
    if (!workoutname || !description || !category) {
        return res.status(400).json({ error: 'Missing required fields: workoutname, description, category, imageURL' });
    }
    // Insert the workout data into the workouts table
    db.run(
        `INSERT INTO workouts (userid, workoutname, description, category, imageURL)
        VALUES (?, ?, ?, ?, ?)`,
        [userid, workoutname, description, category, imageURL],
        function(err) {
            if (err) {
                console.error('Error saving workout:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            return res.json({ success: true, message: 'Workout saved successfully' });
        }
    );
};
exports.getWorkouts = function(req, res) {
    const userid = req.session.userid;

    if (!userid) {
        return res.status(401).json({ error: 'User not logged in' });
    }
    db.all(
        `SELECT workout_id, workoutname, description, category, imageURL FROM workouts WHERE userid = ?`,
        [userid],
        function(err, rows) {
            if (err) {
                console.error('Error fetching workouts:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ workouts: rows });
        }
    );
};

exports.logout = function(req, res) {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.status(200).send("Logged out");
    });
};
exports.removeWorkout = function(req, res) {
    const { workoutName } = req.body;  
    if (!workoutName) {
        return res.status(400).json({ success: false, message: 'Missing workoutName' });
    }

    db.run(
        `DELETE FROM workouts WHERE workoutname = ?`,  
        [workoutName],
        function(err) {
            if (err) {
                console.error('Error deleting workout:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Workout not found' });
            }

            res.json({ success: true });
        }
    );
};

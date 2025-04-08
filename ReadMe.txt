// -----------------------------------------------------------
// Muscle Map Web Application
// -----------------------------------------------------------

/*
Affidavit:
I attest that I am the sole author of this submitted work 
and any code borrowed from other sources has been identified 
by comments placed in my submitted code.

Name: Jabir Jamal Abdussalam
Student Number: 101315582
*/

// -----------------------------------------------------------
// Description
// -----------------------------------------------------------

/*
Muscle Map is a fitness web application that helps users track 
their workouts and fitness goals. Users can log in, register, 
track their workouts, and view personalized exercise recommendations 
based on their fitness goals. The application integrates with 
the WGER API to fetch workout exercises and stores user data in 
an SQLite database for persistence.
*/

// -----------------------------------------------------------
// Features
// -----------------------------------------------------------

/*
- User Authentication: Allows users to register, log in, and manage their accounts.
- Workout Tracking: Users can log their workouts and track progress.
- Personalized Exercise Recommendations: Fetches exercise data from the WGER API based on users' fitness goals.
- Admin Dashboard: Admins can view and manage users (only accessible by admin users).
- Responsive UI: The application behaves like a single-page web app (SPA) for a smooth user experience.
*/

// -----------------------------------------------------------
// Requirements
// -----------------------------------------------------------

/*
Before starting the application, ensure you have the following installed:

- Node.js (version 14.x or later)
- npm (Node Package Manager)
- SQLite3 (for local database)
*/

// -----------------------------------------------------------
// Install Instructions
// -----------------------------------------------------------

/*
1. Clone the repository or download the project files.
2. Navigate to the project directory in your terminal.
3. Run the following command to install required dependencies:

   npm install
*/

// -----------------------------------------------------------
// Launch Instructions
// -----------------------------------------------------------

/*
1. After installing dependencies, run the following command to start the server:

   node server.js

2. The server will be available at http://localhost:3000. 
   Open this URL in your web browser to access the application.
*/

// -----------------------------------------------------------
// Testing Instructions
// -----------------------------------------------------------

/*
1. Manual Testing:
   - Navigate to http://localhost:3000 in your browser.
   - Test the login and registration functionality by creating new user accounts and logging in with them.
   - Add and remove workouts to verify workout tracking functionality.
   - Verify that exercises are displayed based on the user's fitness goal.

2. Automated Testing:
   - If you have any automated tests set up (e.g., using Mocha or Jest), 
     you can run them with the following command:

     npm test

3. Role/Admin Testing:
    - log in with the username: `ldnel`
    - password: `secret`
    - View users
    - Remove users
*/

// -----------------------------------------------------------
// Video Demonstration
// -----------------------------------------------------------

/*
        https://youtu.be/xS7fgOE9_eo
        https://youtu.be/xS7fgOE9_eo
        https://youtu.be/xS7fgOE9_eo
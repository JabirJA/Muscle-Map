document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded");
    loadUserWorkouts();
});

// Hide the description column by default
const descriptionHeader = document.querySelector('#your-workouts-table th.description');
descriptionHeader.style.display = 'none';

let allExercises = []; // This will hold all the exercises fetched from the API
let displayedExercises = 15; // Initially 15 exercises are displayed
const exercisesPerClick = 20; // Number of exercises to add per click
const loadingSpinner = document.getElementById('loading-spinner');
loadingSpinner.style.display = 'block';  // Show the spinner when starting the fetch

// Fitness goals and their corresponding categories
const fitnessGoals = {
    "Gain Muscle": ["Arms", "Chest", "Back", "Calves", "Legs", "Shoulders"],
    "Endurance Training": ["Cardio"],
    "Weight Loss": ["Abs", "Legs", "Cardio"], 
    "Strength Train": ["Arms", "Legs", "Chest"], 
};
fetch('/exercises')
    .then(response => response.json())
    .then(data => {
        allExercises = data;
        const recommendedTableBody = document.querySelector('#recommended-workouts-table tbody');
        const recWorkoutsDiv = document.querySelector('.rec-workouts');
        recommendedTableBody.innerHTML = '';

        const goalElement = document.getElementById('fitness-goals-text');
        const fitnessGoal = goalElement.dataset.goals;
        const goalCategories = fitnessGoals[fitnessGoal];

        if (data.length === 0) {
            recWorkoutsDiv.style.display = 'none';
        } else {
            const filteredData = data.filter(exercise =>
                exercise.category &&
                goalCategories.includes(exercise.category.name) &&
                exercise.translations?.[0]?.language === 2 &&
                exercise.images?.length > 0
            );

            const limitedData = filteredData.slice(0, 15);

            limitedData.forEach(exercise => createExerciseRow(exercise, recommendedTableBody));

            checkEmptyWorkouts();
        }

        // Hide the spinner once data is loaded
        loadingSpinner.style.display = 'none';
    })
    .catch(error => {
        console.error('Error fetching recommended workouts:', error);
        loadingSpinner.style.display = 'none';  // Hide the spinner in case of error
    });


document.getElementById('hide-workouts').addEventListener('click', () => {
    const recWorkoutsDiv = document.querySelector('.rec-workouts');
    const descriptionHeader = document.querySelector('#your-workouts-table th.description');
    const descriptionCells = document.querySelectorAll('#your-workouts-table td.description-cell');

    recWorkoutsDiv.style.display = 'none';
    descriptionHeader.style.display = 'table-cell';

    descriptionCells.forEach(cell => {
        cell.style.display = 'table-cell';
    });
});

function createExerciseRow(exercise, tableBody) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = exercise.translations[0]?.name || 'Unnamed Exercise';

    const addCell = document.createElement('td');
    const addBtn = document.createElement('button');
    Object.assign(addBtn.style, {
        width: '30px',
        height: '30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px',
        margin: 'auto'
    });
    addBtn.textContent = '+';

    addBtn.onclick = () => {
        addWorkout(exercise);
        row.remove();
        checkEmptyWorkouts();
    };

    addCell.appendChild(addBtn);
    row.appendChild(nameCell);
    row.appendChild(addCell);
    tableBody.appendChild(row);
}

// Keep track of workout IDs to avoid duplicate saves
let savedWorkoutIds = new Set();

function loadUserWorkouts() {
    fetch('/get-workouts')
        .then(response => response.json())
        .then(data => {
            if (data.workouts && data.workouts.length > 0) {
                const workoutsTableBody = document.querySelector('#your-workouts-table tbody');
                data.workouts.forEach(workout => {
                    const mappedWorkout = {
                        id: workout.workout_id,
                        translations: [{
                            name: workout.workoutname,
                            description: workout.description
                        }],
                        category: {
                            name: workout.category
                        },
                        images: [{
                            image: workout.imageURL
                        }]
                    };
                    // Add workout only if it hasn't been added before
                    if (!savedWorkoutIds.has(workout.workout_id)) {
                        addWorkout(mappedWorkout);
                        savedWorkoutIds.add(workout.workout_id);  // Add to the saved workout list
                    }
                });
            }
        })
        .catch(error => console.error("Error loading workouts:", error));
}

function addWorkout(exercise) {
    const workoutsTableBody = document.querySelector('#your-workouts-table tbody');
    const recWorkoutsDiv = document.querySelector('.rec-workouts');

    // Check if this workout already exists in the table by its name (or ID)
    const existingWorkoutRow = Array.from(workoutsTableBody.getElementsByTagName('tr'))
        .find(row => row.querySelector('td').textContent === exercise.translations[0]?.name);

    // If the exercise already exists, exit the function to prevent adding it again
    if (existingWorkoutRow) {
        return;
    }

    const row = document.createElement('tr');
    row.id = `workout-${exercise.id}`;

    const nameCell = document.createElement('td');
    nameCell.textContent = exercise.translations[0]?.name || 'Unnamed Exercise';

    const categoryCell = document.createElement('td');
    categoryCell.textContent = exercise.category?.name || "Unknown";

    const imageCell = document.createElement('td');
    const img = document.createElement('img');
    img.src = exercise.images?.[0]?.image || '/styles/favicon.png';
    img.alt = exercise.translations[0]?.name || 'Workout Image';
    Object.assign(img.style, {
        width: '60px',
        height: '60px'
    });
    imageCell.appendChild(img);

    const removeCell = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '-';
    Object.assign(removeBtn.style, {
        width: '30px',
        height: '30px',
        backgroundColor: 'red',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px',
        margin: 'auto'
    });
    removeBtn.onclick = () => {
        // Get the workout name from the row
        const workoutName = exercise.translations[0]?.name;
    
        // Remove the workout by its name from the database
        fetch('/remove-workout', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workoutName })  // Send workoutName to the server
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // If the workout was successfully removed from the database, remove it from the DOM
                row.remove();
                savedWorkoutIds.delete(workoutName);  // Delete using workout name instead of id
                checkEmptyWorkouts();
            } else {
                console.error('Error removing workout from database:', data.message);
            }
        })
        .catch(error => console.error('Error removing workout:', error));
    };
    
    
    
    removeCell.appendChild(removeBtn);

    const descriptionCell = document.createElement('td');
    descriptionCell.textContent = cleanDescription(exercise.translations[0]?.description || 'No description available');
    descriptionCell.classList.add('description-cell');
    descriptionCell.style.display = (recWorkoutsDiv.style.display === 'none') ? 'table-cell' : 'none';

    row.append(nameCell, categoryCell, imageCell, removeCell, descriptionCell);
    workoutsTableBody.appendChild(row);

    checkEmptyWorkouts();

    if (!savedWorkoutIds.has(exercise.id)) {
        fetch('/save-workout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workoutname: exercise.translations[0]?.name,
                category: exercise.category?.name,
                imageURL: exercise.images?.[0]?.image,
                description: exercise.translations[0]?.description
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.workoutId) {
                // Update the workout's id with the database's workout_id
                exercise.id = data.workoutId;
                savedWorkoutIds.add(exercise.id);  // Mark this workout as saved with the new ID
            }
        })
        .catch(error => console.error('Error adding workout:', error));
    }
    
}

function checkEmptyWorkouts() {
    const recommendedTableBody = document.querySelector('#recommended-workouts-table tbody');
    const recWorkoutsDiv = document.querySelector('.rec-workouts');
    const descriptionHeader = document.querySelector('#your-workouts-table th.description');
    const descriptionCells = document.querySelectorAll('#your-workouts-table td.description-cell');

    const hasRows = recommendedTableBody.querySelectorAll('tr').length > 0;

    recWorkoutsDiv.style.display = hasRows ? 'block' : 'none';
    descriptionHeader.style.display = hasRows ? 'none' : 'table-cell';
    descriptionCells.forEach(cell => {
        cell.style.display = hasRows ? 'none' : 'table-cell';
    });
}

function cleanDescription(html, maxWords = 20) {
    const text = html.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const trimmed = words.slice(0, maxWords).join(' ');
    return words.length > maxWords ? trimmed + '...' : trimmed;
}
document.getElementById('add-workouts').addEventListener('click', function() {
    // Slice the data to display the next set of exercises
    const filteredData = allExercises.slice(displayedExercises, displayedExercises + exercisesPerClick);
    displayedExercises += exercisesPerClick;
    
    // Get the fitness goal from the page
    const goalElement = document.getElementById('fitness-goals-text');
    const fitnessGoal = goalElement.dataset.goals;
    const goalCategories = fitnessGoals[fitnessGoal]; // Fitness goal categories for comparison

    filteredData.forEach(exercise => {
        // Check if the exercise's category matches the fitness goal
        const isGoalMatch = exercise.category && goalCategories.includes(exercise.category.name);
        
        // Check if the exercise's language is 2 (i.e., language 2 in translations)
        const isLanguageMatch = exercise.translations && exercise.translations[0]?.language === 2;

        // If both criteria are met, create a table row and add the exercise to the table
        if (isGoalMatch && isLanguageMatch && (exercise.images && exercise.images.length > 0)) {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = exercise.translations[0]?.name || 'No Name Available';

            const addCell = document.createElement('td');
            const addBtn = document.createElement('button');
            addBtn.textContent = '+';
            addBtn.style.width = '30px';
            addBtn.style.height = '30px';
            addBtn.style.display = 'flex';
            addBtn.style.justifyContent = 'center';
            addBtn.style.alignItems = 'center';
            addBtn.style.fontSize = '18px';
            addBtn.style.margin = 'auto';
            
            // Handle adding the workout and removing the row when clicked
            addBtn.onclick = () => {
                addWorkout(exercise);  // Function to add workout
                row.remove();           // Remove the row after adding the workout
                checkEmptyWorkouts();   // Recheck if the workout list is empty
            };
            
            addCell.appendChild(addBtn);
            row.appendChild(nameCell);
            row.appendChild(addCell);
        
            const recommendedTableBody = document.querySelector('#recommended-workouts-table tbody');
            recommendedTableBody.appendChild(row);
        }
    });

    checkEmptyWorkouts(); // Recheck visibility after adding new exercises
});
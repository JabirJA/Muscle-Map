// Ensure these are the correct references to your HTML elements
const fitnessGoalsText = document.getElementById('fitness-goals-text'); // Element showing current fitness goal
const updateWeightButton = document.getElementById('update-weight'); // Button to trigger weight update
const weightText = document.getElementById('current-weight'); // Element showing current weight

// Event listener for the change goal button
const changeGoalButton = document.getElementById('fit-goals');
changeGoalButton.addEventListener('click', () => {
    console.log('Change Goal button clicked');
    
    // Create a dropdown with fitness goals
    const select = document.createElement('select');
    select.name = 'fitness_goals';
    select.required = true;

    select.innerHTML = `
        <option value="" disabled selected>Select your fitness goal</option>
        <option value="Weight Loss">Weight Loss</option>
        <option value="Gain Muscle">Gain Muscle</option>
        <option value="Strength Train">Strength Train</option>
        <option value="Endurance Training">Endurance Training</option>
    `;

    // Clear the current content and append the dropdown
    fitnessGoalsText.innerHTML = ''; 
    fitnessGoalsText.appendChild(select);

    // After the user selects a goal, update the goal on the server and in the UI
    select.addEventListener('change', () => {
        const selectedGoal = select.value;
        console.log('Selected Goal:', selectedGoal);

        // Send the updated fitness goal to the server
        updateFitnessGoalInDatabase(selectedGoal)
            .then((data) => {
                // If the update is successful, update the table with the new fitness goal
                fitnessGoalsText.innerHTML = selectedGoal;
            })
            .catch((error) => {
                // If an error occurs, show a message and revert to the previous state
                alert('Error updating fitness goal');
                fitnessGoalsText.innerHTML = ''; 
            });
    });
});

// Function to send the updated fitness goal to the server
function updateFitnessGoalInDatabase(goal) {
    return fetch('/update-fitness-goals', { // Make sure the URL matches your backend route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update fitness goal');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error updating fitness goal:', error);
        throw error; // Rethrow so that the caller knows it failed
    });
}
// Event listener for the update weight button
updateWeightButton.addEventListener('click', () => {
    // Create an input field for the user to enter the new weight
    const input = document.createElement('input');
    input.type = 'number';
    input.value = weightText.textContent.replace(' lbs', ''); // Remove ' lbs' from the current weight
    
    // Replace the current weight with the input field
    weightText.innerHTML = '';
    weightText.appendChild(input);
    
    // Focus on the input field to allow immediate typing
    input.focus();
    
    // Event listeners for when the user finishes editing
    input.addEventListener('blur', () => {
        updateWeight(input);
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            updateWeight(input);
        }
    });
});
// Function to update the weight by making a POST request to the server
function updateWeight(input) {
    const newWeight = input.value;

    // Validate the weight
    if (newWeight && !isNaN(newWeight) && newWeight > 0 && newWeight < 1000) {
        // Send the weight update to the backend
        updateWeightInDatabase(newWeight)
            .then((response) => {
                if (response.success) {
                    // If the update is successful, update the UI with the new weight
                    weightText.innerHTML = `${response.weight} lbs`;

                    // Update the other fields (like BMR, BMI, BFP) using the returned values
                    document.getElementById('bmr').textContent = `${response.bmr} kcal/day`;
                    document.getElementById('bmi').textContent = `${response.bmi} - ${response.bmiCategory}`;
                    document.getElementById('body-fat').textContent = `${response.bodyFatPercent}%`;
                }
            })
            .catch((error) => {
                // If there is an error, show an alert and revert to the old weight
                alert('Error updating weight');
                weightText.innerHTML = `${weightText.textContent} lbs`; // Revert to the old weight
            });
    } else {
        // If invalid, revert to the original weight
        weightText.innerHTML = `${weightText.textContent} lbs`;
    }
}

// Function to send the updated weight to the server
function updateWeightInDatabase(newWeight) {
    return fetch('/update-weight', { // Ensure this URL matches your backend route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: newWeight })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update weight');
        }
        return response.json(); // Return the JSON response containing all the updated data
    })
    .catch(error => {
        console.error('Error updating weight:', error);
        throw error; // Rethrow so that the caller knows it failed
    });
}
document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        // Logout by sending a GET request to the logout endpoint
        await fetch('/logout', {
            method: 'GET'
        });
        // Redirect to login page after logout
        window.location.href = '/login';
    } catch (error) {
        console.error("Error during logout:", error);
    }
});

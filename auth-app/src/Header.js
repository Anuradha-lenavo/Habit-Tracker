import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import './Header.css';
import { jwtDecode } from 'jwt-decode';// Corrected import
import Calendar from 'react-calendar';
import { Line, Pie,Bar } from 'react-chartjs-2';
import { Chart as ChartJS,BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

Modal.setAppElement('#root');
// Register necessary chart.js components
ChartJS.register(CategoryScale,BarElement, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


const Header = () => {
  const [showModal, setShowModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showExistsMessage, setShowExistsMessage] = useState(false);
  const [clickedSkip, setClickedSkip] = useState({});
  const [clickedComplete, setClickedComplete] = useState({});
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [habitStats, setHabitStats] = useState(null);
  const [habitData, setHabitData] = useState({
    name: '',
    description: '',
    startDate: '',
    reminder: false,
    category: '',      // New: habit category
    frequency: 'daily', // New: frequency (daily/weekly)
    reminderTime: '',  // New: reminder time
  });
  const [habits, setHabits] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [completedHabits, setCompletedHabits] = useState({});
  const [username, setUsername] = useState(''); // Add this line to define the username state
  const [loading, setLoading] = useState(true);  // Loading state


  const openStatsModal = (habit) => {
    setHabitStats(habit);
    setShowStatsModal(true);
  };

  const progressDataForChart = () => {
    if (!habitStats || !habitStats.progress) return { labels: [], datasets: [] };

    const dates = [];
    const completed = [];
    const skipped = [];

    habitStats.progress.forEach((progress) => {
      const date = new Date(progress.date).toLocaleDateString();
      if (!dates.includes(date)) {
        dates.push(date);
      }
      if (progress.status === 'completed') {
        completed.push(1);
        skipped.push(0);
      } else if (progress.status === 'skipped') {
        completed.push(0);
        skipped.push(1);
      }
    });

    return {
      labels: dates,
      datasets: [
        {
          label: 'Completed',
          data: completed,
          borderColor: 'green',
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          fill: true,
        },
        {
          label: 'Skipped',
          data: skipped,
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          fill: true,
        },
      ],
    };
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);  // Decode the token to extract user data
          console.log('Decoded token:', decoded);
          // If decoded token contains username, set it
          if (decoded && decoded.username) {
            setUsername(decoded.username);
            console.log('Username:', decoded.username);
          } else {
            // If username is not in token, make an API call to fetch it
            const response = await axios.get('http://localhost:5000/api/habits/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('API response:', response.data);
            setUsername(response.data.username);  // Set the username fetched from the backend
          }
        } catch (error) {
          console.error('Error decoding token or fetching user data:', error);
        }
      }
      setLoading(false);  // Set loading to false once data is fetched
    };

    fetchUser();
    fetchHabits(); // Fetch habits data as well
  }, []);




  const fetchHabits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/habits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const addHabit = async (habitData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/habits', habitData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowSuccessMessage(true);
      fetchHabits();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setShowExistsMessage(true);
      } else {
        console.error('Error saving habit:', error);
      }
    }
  };

  const deleteHabit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/habits/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const updateHabit = async (updatedHabit) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/habits/${updatedHabit._id}`,
        updatedHabit,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh the habits list after updating
      fetchHabits();
      setShowUpdateModal(false);
      setEditingHabit(null); // Clear the editing habit data
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };


  const logout = () => {
    localStorage.removeItem('token'); // Clear token
    window.location.reload(); // Reload the app to show the login screen
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHabitData({
      ...habitData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const openUpdateModal = (habit) => {
    setEditingHabit(habit);
    setShowUpdateModal(true);
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setEditingHabit({
      ...editingHabit,
      [name]: value,
    });
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (editingHabit) {
      updateHabit(editingHabit);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check locally if a habit with the same name already exists
    const habitExists = habits.some(
      (habit) => habit.name.toLowerCase() === habitData.name.toLowerCase()
    );

    if (habitExists) {
      setShowExistsMessage(true); // Show the duplicate modal
      return;
    }

    try {
      // Proceed to add the habit using the backend
      await addHabit(habitData);
      setHabitData({ name: '', description: '', startDate: '', reminder: false });
      setShowModal(false);
    } catch (error) {
      console.error('Error during habit submission:', error);
    }
  };


  const updateHabitProgress = async (habitId, status, type) => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0]; // Format today's date as YYYY-MM-DD

      // Send request to update the habit progress
      await axios.put(
        `http://localhost:5000/api/habits/${habitId}/progress`,
        { date: today, status }, // Send the correct status ('completed' or 'skipped')
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the clicked state for the buttons based on type
      if (type === 'skip') {
        setClickedSkip((prevState) => ({
          ...prevState,
          [habitId]: !prevState[habitId], // Toggle the skip button state
        }));
        // Reset the complete button state if it was clicked
        setClickedComplete((prevState) => ({
          ...prevState,
          [habitId]: false,
        }));
      } else if (type === 'complete') {
        setClickedComplete((prevState) => ({
          ...prevState,
          [habitId]: !prevState[habitId], // Toggle the complete button state
        }));
        // Reset the skip button state if it was clicked
        setClickedSkip((prevState) => ({
          ...prevState,
          [habitId]: false,
        }));
      }

      // Refresh the habits after updating
      fetchHabits();
    } catch (error) {
      console.error('Error updating habit progress:', error);
    }
  };
  const handleAddHabit = (newHabitName) => {
    const habitExists = habits.some(habit => habit.name.toLowerCase() === newHabitName.toLowerCase());

    if (habitExists) {
      setShowExistsMessage(true); // Trigger modal
    } else {
      // Add habit logic
      setHabits([...habits, { name: newHabitName, progress: [] }]);
    }
  };
  // Skip button


  // Inside the habit-actions buttons


  return (
    <div className="header-container">

      {/* Header section */}
      <div className="header">
        <div className="logo">
          <div className="logo-dot green"></div>
          <div className="logo-dot white"></div>
          <h1>Trackify  </h1>

        </div>


        <p>Stay on track with your Trackify</p>

        <button className="add-button" onClick={() => setShowModal(true)}>+</button>

        <button className="logout-button" onClick={logout} >Logout</button>

      </div>

      {/* Habit List Section */}
      <div className="habit-list">
   
        <h2>Your Habits</h2>
        {habits.map((habit) => (
          <div className="habit-card" key={habit._id}>
            <div className="habit-header">
              
              <div className="habit-name-container">
                
                <h3 className="habit-name">{habit.name}</h3> <br></br>{habit.frequency} :{habit.reminderTime}<br></br>{habit.description}
                
              </div>
              <div className="habit-actions">
                <button
                  className={`circle-button1 ${clickedSkip[habit._id] ? 'clicked-red' : ''}`}
                  onClick={() => updateHabitProgress(habit._id, 'skipped', 'skip')}
                >
                  ✖
                </button>

                {/* Right Button - Completed */}
                <button
                  className={`circle-button ${clickedComplete[habit._id] ? 'clicked-green' : ''}`}
                  onClick={() => updateHabitProgress(habit._id, 'completed', 'complete')}
                >
                  ✔
                </button>


                <button
                  className="action-button delete"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the habit "${habit.name}"?`)) {
                      deleteHabit(habit._id);
                    }
                  }}
                >
                  🗑
                </button>

                <button className="action-button update" onClick={() => openUpdateModal(habit)}>✏️</button>

                <button className="action-button stats" onClick={() => openStatsModal(habit)}>📊</button>

              </div>
            </div>
          
      </div>
   

        ))}
      </div>
      {/* Update Modal */}
      <Modal
        isOpen={showUpdateModal}
        onRequestClose={() => setShowUpdateModal(false)}
        contentLabel="Update Habit Modal"
        className="habit-modal"
        overlayClassName="habit-modal-overlay"
      >
        <h2>Update Habit</h2>
        {editingHabit && (
          <form onSubmit={handleUpdateSubmit}>
            <textarea
              name="description"
              placeholder="Description"
              value={editingHabit.description}
              onChange={handleUpdateInputChange}
            />
            <input
              type="date"
              name="startDate"
              value={editingHabit.startDate.split('T')[0]}
              onChange={handleUpdateInputChange}
            />
            <button type="submit">Update Habit</button>
            <button type="button" onClick={() => setShowUpdateModal(false)}>Cancel</button>
          </form>
        )}
      </Modal>
      {/* Modal for adding a new habit */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        contentLabel="Add Habit Modal"
        className="habit-modal"
        overlayClassName="habit-modal-overlay"
      >
        <h2>Add Habit</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Habit Name:
            {/* Habit Name */}
            <input
              type="text"
              name="name"
              placeholder="Habit Name"
              value={habitData.name}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Description:
            {/* Description */}
            <textarea
              name="description"
              placeholder="Description"
              value={habitData.description}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Start Date:
            {/* Start Date */}
            <input
              type="date"
              name="startDate"
              value={habitData.startDate}
              onChange={handleInputChange}
              required
            />
          </label>

          {/* Habit Category */}
          <label>
            Category:
            <select
              name="category"
              value={habitData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a Category</option>
              <option value="Health">Health</option>
              <option value="Work">Work</option>
              <option value="Personal Growth">Personal Growth</option>
              <option value="Hobbies">Hobbies</option>
            </select>
          </label>
          <br></br>

          {/* Frequency: Daily or Weekly */}
          <label>
            Frequency:
            <select
              name="frequency"
              value={habitData.frequency}
              onChange={handleInputChange}
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <br></br>

          {/* Reminder Checkbox */}
          <label>
            Reminder:
            <input
              type="checkbox"
              name="reminder"
              checked={habitData.reminder}
              onChange={handleInputChange}
            />
          </label>

          {/* Reminder Time */}
          {habitData.reminder && (
            <label>
              Reminder Time:
              <input
                type="time"
                name="reminderTime"
                value={habitData.reminderTime}
                onChange={handleInputChange}
              />
            </label>
          )}

          <button type="submit">Save Habit</button>
          <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
        </form>
      </Modal>


      {/* Success and Warning Modals */}
      <Modal
        isOpen={showSuccessMessage}
        onRequestClose={() => setShowSuccessMessage(false)}
        contentLabel="Success Message Modal"
        className="success-modal"
        overlayClassName="success-modal-overlay"
      >
        <h2>Success!</h2>
        <p>Your habit has been saved successfully.</p>
        <button onClick={() => setShowSuccessMessage(false)}>Close</button>
      </Modal>
      <Modal
        isOpen={showExistsMessage}
        onRequestClose={() => setShowExistsMessage(false)}
        contentLabel="Already Exists Message Modal"
        className="success-modal"
        overlayClassName="success-modal-overlay"
      >
        <h2>Warning</h2>
        <p>Habit already exists.</p>
        <button onClick={() => setShowExistsMessage(false)}>Close</button>
      </Modal>

      <Modal
  isOpen={showStatsModal}
  onRequestClose={() => setShowStatsModal(false)}
  contentLabel="Habit Statistics Modal"
  className="habit-modal1"
  overlayClassName="habit-modal-overlay1"
><button className="modal-close-button" onClick={() => setShowStatsModal(false)}>✖</button>
  <h2>{habitStats?.name} - Statistics</h2>
  {habitStats && (
    <div className="stats-container">
     
        Start Date: {new Date(habitStats.startDate).toLocaleDateString()}
        <br />
        Category: {habitStats.category || 'Not specified'}
 
      <br></br>
      <br></br>
      <div className="stats-container1">

  <div className="progress-info">
    <h3>Progress</h3>
    Completed: {habitStats.progress.filter(p => p.status === 'completed').length}<br></br>
    Skipped: {habitStats.progress.filter(p => p.status === 'skipped').length}
  </div>

  <div className="rewards-info">
    <h3>Rewards:</h3>
    <p>Points: {habitStats.rewards.points}</p>
  </div>
</div>
<br></br>


      <div className="calendar-and-chart">
        {/* Calendar view */}
        <div className="calendar-container">
          <h4>Calendar:</h4>
          <Calendar
            tileContent={({ date }) => {
              const progress = habitStats.progress.find(p => new Date(p.date).toLocaleDateString() === date.toLocaleDateString());
              return progress ? <div className={progress.status}>{progress.status === 'completed' ? '✔' : '✖'}</div> : null;
            }}
          />
        </div>

        {/* Progress Chart */}
        <div className="chart-container">
          <h4>Progress Chart:</h4>
          <Bar data={progressDataForChart()} />
        </div>
      </div>

      
    </div>
  )}
</Modal>




    </div>
  );
};

export default Header;
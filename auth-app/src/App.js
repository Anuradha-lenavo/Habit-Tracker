import React, { useState } from 'react';
import AuthScreen from './AuthScreen'; // Import the AuthScreen component
import Header from './Header'; // Import the Header component

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication status
 
  // Callback to handle successful authentication
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <div>
      {isAuthenticated ? (
        <Header /> // Show the Header (main app) after authentication
      ) : (
        <AuthScreen onLoginSuccess={handleLoginSuccess} /> // Pass callback to AuthScreen
      )}
    </div>
  );
};

export default App;

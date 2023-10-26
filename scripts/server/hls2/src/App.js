import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState('');

  useEffect(() => {
    // Fetch data from the server
    fetch('http://localhost:3000/') // Assuming your server is running on port 3000
      .then(response => response.text())
      .then(data => {
        setData(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <div className="App">
      <h1>Data from Server:</h1>
      <p>{data}</p>
      {/* Your other React components */}
    </div>
  );
}

export default App;

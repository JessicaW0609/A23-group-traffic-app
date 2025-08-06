// src/components/Dashboard.jsx
import React, { useState } from 'react';
import LineChart from "./LineChart";
import ParkingMap from "./ParkingMap";

const Dashboard = () => {
  const [ownershipData] = useState([
    { year: 2013, registration_count: 120000 },
    { year: 2014, registration_count: 125000 },
    { year: 2015, registration_count: 130000 },
    { year: 2016, registration_count: 135000 },
    { year: 2017, registration_count: 140000 },
    { year: 2018, registration_count: 145000 },
    { year: 2019, registration_count: 150000 },
    { year: 2020, registration_count: 155000 },
    { year: 2021, registration_count: 160000 },
    { year: 2022, registration_count: 165000 },
    { year: 2023, registration_count: 170000 },
  ]);

  const [location, setLocation] = useState('');
  const [parkingData, setParkingData] = useState(null);

  const handleSearch = () => {
    if (!location) return;

    // Mock parking data
    const mockData = {
      total: 45,
      available: 28,
      streets: [
        { name: "Lygon St", available: 10 },
        { name: "Swanston St", available: 12 },
        { name: "Russell St", available: 6 },
      ],
      coordinates: [
        { name: "Lygon St", lat: -37.8001, lng: 144.9646, available: 10 },
        { name: "Swanston St", lat: -37.8062, lng: 144.9631, available: 12 },
        { name: "Russell St", lat: -37.8090, lng: 144.9654, available: 6 },
      ]
    };

    setParkingData(mockData);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Melbourne Traffic Dashboard</h1>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Car Ownership Trends</h2>
        <LineChart data={ownershipData} />
      </section>

      <section>
        <h2>Available Parking</h2>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Enter suburb or coordinates"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ padding: '0.5rem', width: '300px', marginRight: '1rem' }}
          />
          <button onClick={handleSearch} style={{ padding: '0.5rem 1rem' }}>
            Search
          </button>
        </div>

        {parkingData && (
          <div>
            <p>Total spots: {parkingData.total}</p>
            <p>Available spots: {parkingData.available}</p>
            <h4>Street Breakdown:</h4>
            <ul>
              {parkingData.streets.map((street, index) => (
                <li key={index}>
                  {street.name}: {street.available} available
                </li>
              ))}
            </ul>

            <ParkingMap coordinates={parkingData.coordinates} />
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

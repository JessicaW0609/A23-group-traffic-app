import React, { useState } from 'react';
import { Car, Camera, Settings } from 'lucide-react';

export default function PersonalPage() {
  const [vehicleType, setVehicleType] = useState('Car');
  const [licensePlate, setLicensePlate] = useState('');
  const [carModel, setCarModel] = useState('');

  const handleAddVehicle = (e) => {
    e.preventDefault();
    // TODO: submit or save vehicle data
    console.log({ vehicleType, licensePlate, carModel });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      {/* Illustration placeholder */}
      <div className="w-full max-w-sm mb-6">
        <img
          src="/assets/add-vehicle-illustration.png"
          alt="Add a Vehicle"
          className="w-full h-auto rounded-lg"
        />
      </div>

      <form
        onSubmit={handleAddVehicle}
        className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Add a Vehicle
        </h2>
        <p className="text-gray-500 text-sm text-center">
          Add your vehicle details below
        </p>

        {/* Vehicle Type */}
        <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
          <Car className="text-blue-600 w-6 h-6 mr-3" />
          <label className="flex-grow text-sm font-medium text-gray-700">
            Type
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="ml-2 text-gray-600 bg-transparent focus:outline-none"
            >
              <option>Car</option>
              <option>Motorbike</option>
              <option>Bicycle</option>
            </select>
          </label>
        </div>

        {/* License Plate */}
        <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
          <span className="text-xl font-bold text-blue-600 mr-3">#</span>
          <input
            type="text"
            placeholder="7010 4570 876"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            className="flex-grow bg-transparent focus:outline-none text-gray-600"
          />
          <button
            type="button"
            className="ml-3 bg-blue-100 p-2 rounded-lg"
            // TODO: handle scanning
          >
            <Camera className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        {/* Car Model */}
        <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
          <Settings className="text-blue-600 w-6 h-6 mr-3" />
          <input
            type="text"
            placeholder="Mercedes Benz Z3"
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            className="flex-grow bg-transparent focus:outline-none text-gray-600"
          />
        </div>

        {/* Add Vehicle Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Add Vehicle
        </button>
      </form>
    </div>
  );
}
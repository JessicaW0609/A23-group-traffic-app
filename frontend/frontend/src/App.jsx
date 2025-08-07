import React from "react";
import Dashboard from "./components/Dashboard";

function App() {
const [view, setView] = useState('signup'); // 'signup' or 'addVehicle'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex justify-center space-x-4 py-4 bg-white shadow">
        <button
          onClick={() => setView('signup')}
          className={`px-4 py-2 rounded-lg ${
            view === 'signup'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => setView('addVehicle')}
          className={`px-4 py-2 rounded-lg ${
            view === 'addVehicle'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Add Vehicle
        </button>
      </nav>

      <main className="flex justify-center items-start p-6">
        {view === 'signup' && <GetStartedForm />}
        {view === 'addVehicle' && <AddVehicleForm />}
      </main>
    </div>
  );
}  
export default App;

// src/components/LineChart.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register required components
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No car ownership data available.</p>;
  }

  const chartData = {
    labels: data.map((item) => item.year),
    datasets: [
      {
        label: "Number of Car Registrations",
        data: data.map((item) => item.registration_count),
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Car Ownership Over the Past 10 Years",
      },
    },
  };

  return (
    <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChart;
console.log("LineChart loaded");

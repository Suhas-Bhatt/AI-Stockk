// Importing required components from Chart.js
import {
    Chart as ChartJS,   // Main Chart.js object
    LineElement,        // Line chart drawing element
    CategoryScale,      // X-axis (labels like Mon, Tue, etc.)
    LinearScale,        // Y-axis (numeric values)
    PointElement,       // Points/dots on the line
    Tooltip,            // Tooltip on hover
    Legend,             // Legend display
} from "chart.js";

// Importing Line chart component for React
import { Line } from "react-chartjs-2";

// Registering all required Chart.js components
// (Important: Chart.js v3+ requires manual registration)
ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
);

export default function ChartComponent() {

    // Chart data configuration
    const data = {

        // Labels for X-axis (time/days)
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],

        // Dataset (actual data to plot)
        datasets: [
            {
                label: "Stock Trend",        // Name shown in legend
                data: [100, 120, 110, 130, 140], // Y-axis values

                borderWidth: 2,             // Thickness of line

                // You can enhance later:
                // borderColor: "blue",
                // backgroundColor: "lightblue",
            },
        ],
    };

    // Rendering Line chart with provided data
    return <Line data={data} />;
}

// const data = {
//   labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
//   datasets: [
//     {
//       label: "TCS",
//       data: [100, 120, 110, 130, 140],
//       borderWidth: 2,
//     },
//     {
//       label: "INFY",
//       data: [90, 100, 95, 120, 125],
//       borderWidth: 2,
//     },
//   ],
// };
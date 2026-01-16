import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import {
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  Bar,
  Line,
  Scatter,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";

const DashboardPage = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const API_BASE = "https://klyra-e6ui.onrender.com";

//   const API_BASE = "http://localhost:8000";



  // State
  const [dataset, setDataset] = useState(null);
  const [columns, setColumns] = useState([]); // all columns
  const [numericColumns, setNumericColumns] = useState([]); // only numeric
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState("");

  // Form controls
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [aggregation, setAggregation] = useState("sum");
  const [chartType, setChartType] = useState("bar");
  const [chartTitle, setChartTitle] = useState("");

  // Color palette for pie charts
  const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  if (!user) return null;

  // Fetch dataset info and CSV columns on mount
  useEffect(() => {
    loadDatasetColumns();
  }, [user]);

  async function loadDatasetColumns() {
    try {
      setLoading(true);
      // Get dataset info from MongoDB
      const datasetRes = await fetch(
        `${API_BASE}/datasets/${user.id}`
      );
      const datasetsData = await datasetRes.json();
      const currentDataset = datasetsData.datasets.find(
        (d) => d._id === datasetId
      );

      if (currentDataset) {
        setDataset(currentDataset);

        // Get columns from CSV
        const analyticsRes = await fetch(`${API_BASE}/analytics/preview-columns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataset_id: datasetId,
            csv_url: currentDataset.file_url,
            x_column: "",
            y_column: "",
            aggregation: "sum",
            chart_type: "bar",
          }),
        });

        const analyticsData = await analyticsRes.json();
        if (analyticsData.success && analyticsData.columns.length > 0) {
          // Extract column names and types
          const allCols = analyticsData.columns.map(c => c.name);
          const numericCols = analyticsData.columns
            .filter(c => c.type === "numeric")
            .map(c => c.name);
          
          setColumns(allCols);
          setNumericColumns(numericCols);
          
          // Auto-select first column for X-axis
          setXAxis(allCols[0]);
          // Auto-select first numeric column for Y-axis
          if (numericCols.length > 0) {
            setYAxis(numericCols[0]);
          }
        }
      }
    } catch (err) {
      setError("Failed to load dataset: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Generate chart data
  async function generateChart() {
    if (!xAxis || !yAxis) {
      setError("Please select both X and Y columns");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/analytics/generate-chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: datasetId,
          csv_url: dataset.file_url,
          x_column: xAxis,
          y_column: yAxis,
          aggregation: aggregation,
          chart_type: chartType,
          title: chartTitle,
          color_scheme: "recharts",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to generate chart");
      }

      const data = await res.json();
      setChartData(data.chart_data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Convert chart data to recharts format
  function getRechartsData() {
    if (!chartData) return [];
    return chartData.labels.map((label, idx) => ({
      name: label,
      value: chartData.values[idx],
    }));
  }

  // Render appropriate chart
  function renderChart() {
    if (!chartData) return null;

    const data = getRechartsData();
    const chartProps = {
      data,
      margin: { top: 20, right: 30, left: 0, bottom: 20 },
    };

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
                cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
              />
              <Legend />
              <Bar dataKey="value" fill="#8b5cf6" name={chartData.y_axis} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                name={chartData.y_axis}
                dot={{ fill: "#8b5cf6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                type="number" 
                dataKey="value" 
                stroke="#999"
                name={chartData.y_axis}
              />
              <YAxis 
                type="number" 
                dataKey="value" 
                stroke="#999"
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
                cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
              />
              <Scatter name={chartData.y_axis} data={data} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8b5cf6"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#070708] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/upload")}
          className="mb-4 px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600"
        >
          ← Back
        </button>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        {dataset && (
          <p className="text-gray-400 mt-2">File: {dataset.file_name}</p>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1 bg-black/50 border border-white/10 p-6 rounded-xl h-fit">
          <h2 className="text-xl font-semibold mb-4">Configure Chart</h2>

          {/* X Axis */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">X-Axis</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select column</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Y Axis */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Y-Axis (Numeric Only)</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select numeric column</option>
              {numericColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Aggregation
            </label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>

          {/* Chart Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="scatter">Scatter</option>
              <option value="pie">Pie</option>
            </select>
          </div>

          {/* Chart Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Chart Title (optional)
            </label>
            <input
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full bg-black/30 border border-white/10 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateChart}
            disabled={loading || !xAxis || !yAxis}
            className="w-full py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed font-semibold transition"
          >
            {loading ? "Generating..." : "Generate Chart"}
          </button>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* Chart Canvas */}
        <div className="lg:col-span-3 bg-black/50 border border-white/10 p-6 rounded-xl">
          {chartData ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">{chartData.title}</h3>
              {renderChart()}
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              <p>Select columns and click "Generate Chart" to visualize data</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {chartData && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/50 border border-white/10 p-4 rounded">
            <p className="text-gray-400 text-sm">Total Points</p>
            <p className="text-2xl font-bold">{chartData.labels.length}</p>
          </div>
          <div className="bg-black/50 border border-white/10 p-4 rounded">
            <p className="text-gray-400 text-sm">Max Value</p>
            <p className="text-2xl font-bold">
              {Math.max(...chartData.values).toFixed(2)}
            </p>
          </div>
          <div className="bg-black/50 border border-white/10 p-4 rounded">
            <p className="text-gray-400 text-sm">Min Value</p>
            <p className="text-2xl font-bold">
              {Math.min(...chartData.values).toFixed(2)}
            </p>
          </div>
          <div className="bg-black/50 border border-white/10 p-4 rounded">
            <p className="text-gray-400 text-sm">Average</p>
            <p className="text-2xl font-bold">
              {(
                chartData.values.reduce((a, b) => a + b, 0) /
                chartData.values.length
              ).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

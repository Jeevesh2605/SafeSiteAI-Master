import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Video,
  Clock,
  Shield,
  TrendingUp,
  RefreshCw,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000"
});

api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

const API_ENDPOINT =
    "https://09vprol3o9.execute-api.ap-south-1.amazonaws.com/prod/outliers";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [outlierEvents, setOutlierEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoURL, setVideoURL] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    todayEvents: 0,
    totalViolations: 0,
    complianceRate: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔍 Dashboard loaded. Checking authentication...");
    console.log("Token exists:", !!token);
    if (!token) {
      console.error("❌ No token found. Redirecting to login...");
      navigate("/auth");
      return;
    }
    console.log("✅ Token found. User is authenticated.");
    setIsAuthenticated(true);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("👋 User logged out");
    navigate("/auth");
  };

  const fetchOutlierEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}?limit=50`);
      const data = await response.json();
      if (data.success) {
        setOutlierEvents(data.events || []);
        const today = new Date().setHours(0, 0, 0, 0) / 1000;
        const todayEvents = data.events.filter((e) => e.timestamp >= today);
        const totalViolations = data.events.reduce(
            (sum, e) => sum + e.outlierCount,
            0
        );
        const totalDetections = data.events.reduce(
            (sum, e) => sum + e.totalDetections,
            0
        );
        const compliance =
            totalDetections > 0
                ? ((totalDetections - totalViolations) / totalDetections) * 100
                : 100;
        setStats({
          totalEvents: data.events.length,
          todayEvents: todayEvents.length,
          totalViolations: totalViolations,
          complianceRate: compliance.toFixed(1),
        });
      }
    } catch (error) {
      console.error("Error fetching outlier events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOutlierEvents();
    const interval = setInterval(fetchOutlierEvents, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getViolationColor = (className) => {
    if (!className) return "bg-gray-500";
    const colors = {
      no_helmet: "bg-orange-500",
      no_suit: "bg-fuchsia-500",
      tampering: "bg-orange-600",
      intrusion: "bg-fuchsia-600",
      unauthorized_access: "bg-pink-500",
    };
    return colors[className.toLowerCase()] || "bg-gray-500";
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideo(file);
      setVideoURL(URL.createObjectURL(file));
    } else {
      alert("Please upload a valid video file.");
    }
  };

  // Removed the separate analytics fetch to avoid CORS issues
  // Analytics data is already being computed from outlierEvents

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-gray-900 via-black to-gray-900">
          <div className="text-white text-center">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-orange-400" />
            <p className="text-lg">Loading...</p>
          </div>
        </div>
    );
  }

  return (
      <section className="min-h-screen w-full text-white bg-linear-to-b from-gray-900 via-black to-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Animated Background */}
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "700ms" }}
          ></div>
        </div>

        {/* Navbar */}
        <nav className="relative z-10 w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 sm:mb-10 px-6 py-4 bg-gray-900/60 backdrop-blur-xl rounded-full border border-orange-500/20 shadow-[0_0_30px_rgba(255,122,0,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-xl bg-linear-to-r from-orange-400 to-fuchsia-500 bg-clip-text text-transparent">
              SafeSite AI Dashboard
            </h3>
          </div>
          <button
              onClick={handleLogout}
              className="px-6 py-2.5 rounded-full bg-linear-to-r from-orange-500 to-fuchsia-600 text-white font-semibold shadow-[0_0_25px_rgba(255,122,0,0.4)] hover:shadow-[0_0_40px_rgba(255,122,0,0.6)] hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            Logout
          </button>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-linear-to-br from-orange-500/20 to-fuchsia-600/20 p-3 rounded-xl border border-orange-500/30 backdrop-blur-xl">
                <Shield className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  SafeSite AI Dashboard
                </h1>
                <p className="text-gray-400 text-sm">
                  Real-time Construction Safety Monitoring
                </p>
              </div>
            </div>
            <button
                onClick={fetchOutlierEvents}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-lg border border-orange-500/20 backdrop-blur-xl transition w-full sm:w-auto justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-linear-to-br from-orange-500/20 to-orange-600/20 rounded-xl p-5 border border-orange-500/30 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  <TrendingUp className="w-4 h-4 text-orange-300" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-orange-300">
                  {stats.totalViolations}
                </h2>
                <p className="text-sm text-orange-200 mt-1">Total Violations</p>
              </div>
              <div className="bg-linear-to-br from-fuchsia-500/20 to-fuchsia-600/20 rounded-xl p-5 border border-fuchsia-500/30 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <Clock className="w-6 h-6 text-fuchsia-400" />
                  <Video className="w-4 h-4 text-fuchsia-300" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-fuchsia-300">
                  {stats.todayEvents}
                </h2>
                <p className="text-sm text-fuchsia-200 mt-1">Alerts Today</p>
              </div>
              <div className="bg-linear-to-br from-green-500/20 to-green-600/20 rounded-xl p-5 border border-green-500/30 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <Shield className="w-4 h-4 text-green-300" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-green-300">
                  {stats.complianceRate}%
                </h2>
                <p className="text-sm text-green-200 mt-1">Compliance Rate</p>
              </div>
              <div className="bg-linear-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-5 border border-blue-500/30 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <Video className="w-6 h-6 text-blue-400" />
                  <Eye className="w-4 h-4 text-blue-300" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-blue-300">
                  {stats.totalEvents}
                </h2>
                <p className="text-sm text-blue-200 mt-1">Total Events</p>
              </div>
            </div>

            {/* Video Upload Section */}
            <div className="bg-gray-900/60 border border-orange-500/20 rounded-xl p-5 sm:p-6 text-center backdrop-blur-xl">
              <h3 className="text-lg font-semibold mb-4">Upload Site Video</h3>
              <label
                  htmlFor="video-upload"
                  className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed border-orange-400/40 rounded-lg cursor-pointer hover:border-orange-400 transition"
              >
                {video ? (
                    <div className="px-4">
                      <p className="text-sm text-gray-200 break-all">
                        {video.name}
                        <span className="text-orange-400"> (Selected)</span>
                      </p>
                    </div>
                ) : (
                    <div className="px-4">
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-10 h-10 mb-2 text-gray-300 mx-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                      >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0l3 3m-3-3l-3 3M17 8v12m0 0l-3-3m3 3l3-3"
                        />
                      </svg>
                      <p className="text-sm text-gray-300">
                        Click or drag a video here to upload
                      </p>
                    </div>
                )}
              </label>
              <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
              />
              {video && (
                  <button
                      onClick={async () => {
                        const token = localStorage.getItem("token");
                        console.log(
                            "🎯 Pre-upload token check:",
                            token ? "EXISTS" : "MISSING"
                        );
                        if (!token) {
                          alert("Session expired. Please login again.");
                          navigate("/auth");
                          return;
                        }
                        setUploadingVideo(true);
                        const formData = new FormData();
                        formData.append("file", video);
                        try {
                          console.log("📤 Uploading video...");
                          const res = await api.post("/raw-videos", formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                          });
                          console.log("✅ Upload successful:", res.data);
                          alert("✅ " + res.data.message);
                          setVideoURL(res.data.file_url);
                        } catch (err) {
                          console.error("❌ Upload error:", err);
                          console.error("Error details:", err.response?.data);
                          if (err.response?.status === 401) {
                            alert("Session expired. Please login again.");
                            localStorage.removeItem("token");
                            navigate("/auth");
                          } else {
                            alert(
                                "❌ " +
                                (err.response?.data?.detail || "Upload failed")
                            );
                          }
                        } finally {
                          setUploadingVideo(false);
                        }
                      }}
                      disabled={uploadingVideo}
                      className="mt-4 bg-linear-to-r from-orange-500 to-fuchsia-600 hover:from-orange-600 hover:to-fuchsia-700 px-4 py-2 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(255,122,0,0.3)] hover:shadow-[0_0_30px_rgba(255,122,0,0.5)] transition-all"
                  >
                    {uploadingVideo ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                    ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload to Cloud
                        </>
                    )}
                  </button>
              )}
              {videoURL && (
                  <div className="mt-5 rounded-lg overflow-hidden border border-orange-500/20">
                    <video
                        src={videoURL}
                        controls
                        className="w-full rounded-lg max-h-96"
                    />
                    <p className="mt-2 text-sm text-green-400">
                      Uploaded to Cloud:{" "}
                      <a
                          href={videoURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-300 break-all"
                      >
                        {videoURL}
                      </a>
                    </p>
                  </div>
              )}
            </div>

            {/* Recent Outlier Events */}
            <div className="bg-gray-900/60 border border-orange-500/20 rounded-xl p-5 sm:p-6 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Recent Safety Violations
                </h3>
                <span className="text-sm text-gray-400">
                {outlierEvents.length} events
              </span>
              </div>
              {loading && outlierEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
                    <p className="text-gray-400">Loading events...</p>
                  </div>
              ) : outlierEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                    <p className="text-gray-400">No violations detected</p>
                    <p className="text-sm text-gray-500 mt-1">
                      All sites are compliant!
                    </p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {outlierEvents.slice(0, 9).map((event, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedEvent(event)}
                            className="bg-linear-to-br from-gray-800/50 to-gray-900/50 rounded-lg overflow-hidden border border-orange-500/20 hover:border-orange-400/50 cursor-pointer transition group"
                        >
                          <div className="relative h-48 bg-gray-900">
                            {event.presignedAnnotatedImageUrl ||
                            event.presignedImageUrl ? (
                                <img
                                    src={
                                        event.presignedAnnotatedImageUrl ||
                                        event.presignedImageUrl
                                    }
                                    alt={`Frame ${event.frameNumber}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"

                                    onError={(e) => {
                                      if (e.target && e.target.parentElement) {
                                        e.target.style.display = 'none';
                                        const errorDiv = document.createElement('div');
                                        errorDiv.className = 'flex items-center justify-center h-full bg-gray-800 text-gray-500';
                                        errorDiv.textContent = 'Image unavailable';
                                        e.target.parentElement.appendChild(errorDiv);
                                      }
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                  <Video className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-linear-to-r from-orange-500 to-fuchsia-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              {event.outlierCount} Alert
                              {event.outlierCount > 1 ? "s" : ""}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                              <Video className="w-4 h-4 shrink-0" />
                              <span className="truncate">{event.videoName}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>Frame {event.frameNumber}</span>
                              <span>•</span>
                              <span>{formatTimestamp(event.timestamp)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {event.outliers?.slice(0, 2).map((outlier, i) => (
                                  <span
                                      key={i}
                                      className={`${getViolationColor(
                                          outlier?.class
                                      )} text-white px-2 py-1 rounded text-xs font-medium`}
                                  >
                            {outlier?.class ? outlier.class.replace("_", " ") : "Unknown"}
                          </span>
                              ))}
                              {event.outliers?.length > 2 && (
                                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                            +{event.outliers.length - 2} more
                          </span>
                              )}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* Recent Activity Log */}
            <div className="bg-gray-900/60 border border-orange-500/20 rounded-xl p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <ul className="space-y-3 text-sm">
                {outlierEvents.slice(0, 5).map((event, idx) => (
                    <li
                        key={idx}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                            className={`w-2 h-2 rounded-full shrink-0 ${getViolationColor(
                                event.outliers?.[0]?.class || "default"
                            )}`}
                        ></div>
                        <span className="text-gray-300">
                      {event.outlierCount} violation
                          {event.outlierCount > 1 ? "s" : ""} detected in{" "}
                          {event.videoName}
                    </span>
                      </div>
                      <span className="text-gray-500 text-xs sm:ml-auto pl-5 sm:pl-0">
                    {formatTimestamp(event.timestamp)}
                  </span>
                    </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal for Event Details */}
        {selectedEvent && (
            <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                onClick={() => setSelectedEvent(null)}
            >
              <div
                  className="bg-gray-900/95 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-orange-500/30 backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-orange-400 to-fuchsia-500 bg-clip-text text-transparent">Event Details</h2>
                    <button
                        onClick={() => setSelectedEvent(null)}
                        className="text-gray-400 hover:text-white text-3xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mb-6 rounded-lg overflow-hidden border border-orange-500/20">
                    {selectedEvent.presignedAnnotatedImageUrl ||
                    selectedEvent.presignedImageUrl ? (
                        <img
                            src={
                                selectedEvent.presignedAnnotatedImageUrl ||
                                selectedEvent.presignedImageUrl
                            }
                            alt="Detection with bounding boxes"
                            className="w-full"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-800 text-gray-500">
                          Image unavailable
                        </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
                      <p className="text-sm text-gray-400 mb-1">Video Name</p>
                      <p className="font-semibold break-all">
                        {selectedEvent.videoName}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
                      <p className="text-sm text-gray-400 mb-1">Frame Number</p>
                      <p className="font-semibold">{selectedEvent.frameNumber}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
                      <p className="text-sm text-gray-400 mb-1">Timestamp</p>
                      <p className="font-semibold text-sm">
                        {new Date(selectedEvent.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20">
                      <p className="text-sm text-gray-400 mb-1">Total Detections</p>
                      <p className="font-semibold">
                        {selectedEvent.totalDetections}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Detected Violations
                    </h3>
                    <div className="space-y-3">
                      {selectedEvent.outliers?.map((outlier, i) => (
                          <div
                              key={i}
                              className="bg-gray-800/50 rounded-lg p-4 border border-orange-500/20"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <span
                            className={`${getViolationColor(
                                outlier?.class
                            )} text-white px-3 py-1 rounded text-sm font-medium w-fit`}
                        >
                          {outlier?.class ? outlier.class.replace("_", " ").toUpperCase() : "UNKNOWN"}
                        </span>
                              <span className="text-sm font-semibold text-orange-400">
                          {(outlier.confidence * 100).toFixed(1)}% confidence
                        </span>
                            </div>
                            {outlier.box && (
                                <div className="text-xs text-gray-500 mt-2 break-all">
                                  Location:{" "}
                                  {typeof outlier.box === "object" &&
                                  "x1" in outlier.box
                                      ? `(${outlier.box.x1}, ${outlier.box.y1}) - (${outlier.box.x2}, ${outlier.box.y2})`
                                      : Array.isArray(outlier.box)
                                          ? outlier.box.join(", ")
                                          : "N/A"}
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </section>
  );
};

export default Dashboard;
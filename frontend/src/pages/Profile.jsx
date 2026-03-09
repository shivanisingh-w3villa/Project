import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import "./profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [, setMapCoords] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const autocompleteService = useRef(null);
  const geocoder = useRef(null);
  const [userPlan, setUserPlan] = useState(null);

  // Initialize Google Maps API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === "your_first_api_key_here") {
      console.warn("⚠ Google Maps API key not configured. Set VITE_GOOGLE_MAPS_API_KEY in .env");
      setApiKeySet(false);
      return;
    }
    
    setApiKeySet(true);

    // Load script dynamically
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      try {
        if (window.google && window.google.maps) {
          // Check if Places API is available
          if (window.google.maps.places && window.google.maps.places.AutocompleteService) {
            autocompleteService.current =
              new window.google.maps.places.AutocompleteService();
            console.log("Places API (Autocomplete) loaded");
          } else {
            console.warn("⚠️ Places API not available - enable Places API in Google Cloud Console");
          }

          // Check if Geocoder is available
          if (window.google.maps.Geocoder) {
            geocoder.current = new window.google.maps.Geocoder();
            console.log("Geocoding API loaded");
          }

          setMapsLoaded(true);
          console.log(" Google Maps API loaded successfully");
        }
      } catch (error) {
        console.error("❌ Error initializing Google Maps services:", error);
      }
    };

    script.onerror = () => {
      console.error(" Failed to load Google Maps script");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
    };
  }, []);

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const res = await API.get("/profile");
      setProfile(res.data);
      setNewAddress(res.data.address || "");
      if (res.data.address) {
        geocodeAddress(res.data.address);
      }

      // Fetch plan status
      const userId = localStorage.getItem("userId");
      if (userId) {
        const planRes = await API.get(`/payment/plan-status/${userId}`);
        setUserPlan(planRes.data);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Upload profile picture
  const uploadImage = async () => {
    if (!image) return;

    try {
      const formData = new FormData();
      formData.append("image", image);

      await API.post("/profile/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh profile after upload
      await fetchProfile();
      setImage(null);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  // Get address suggestions using AutocompleteService (if Places API is enabled)
  const getAddressSuggestions = async (input) => {
    if (!input || !mapsLoaded) {
      setSuggestions([]);
      return;
    }

    if (!autocompleteService.current) {
      console.warn("Places API not available. Enable it in Google Cloud Console.");
      setSuggestions([]);
      return;
    }

    try {
      const result = await autocompleteService.current.getPlacePredictions({
        input,
        types: ["geocode"],
      });
      setSuggestions(result.predictions || []);
      console.log("Got suggestions:", result.predictions?.length || 0);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Geocode address to get coordinates (optional - requires Geocoding API enabled)
  const geocodeAddress = async (address) => {
    // Skip if Geocoding API is not available
    if (!geocoder.current) {
      console.log("Geocoding skipped - API not available");
      return;
    }

    try {
      const result = await geocoder.current.geocode({ address });
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        setMapCoords({
          lat: location.lat(),
          lng: location.lng(),
        });
      }
    } catch (error) {
      console.warn("Geocoding unavailable (enable Geocoding API to use maps):", error);
    }
  };

  // Handle address selection from suggestions
  const selectAddress = (suggestion) => {
    setNewAddress(suggestion.description);
    setSuggestions([]);
    geocodeAddress(suggestion.description);
  };

  // Update address on backend
  const updateAddress = async () => {
    try {
      const res = await API.put("/profile/address", { address: newAddress });
      setProfile(res.data);
      setEditingAddress(false);
      geocodeAddress(newAddress);
    } catch (err) {
      console.error("Failed to update address:", err);
    }
  };

  // Download profile as JSON
  const downloadProfileJSON = () => {
    try {
      const profileData = {
        name: profile.name,
        email: profile.email,
        address: profile.address || "Not set",
        profileImage: profile.profileImage ? "Uploaded" : "Not set",
        downloadedAt: new Date().toLocaleString(),
      };

      const dataStr = JSON.stringify(profileData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `profile_${profile.name}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading JSON:", error);
      alert("Failed to download profile");
    }
  };

  // Download profile as CSV
  const downloadProfileCSV = () => {
    try {
      const headers = ["Field", "Value"];
      const rows = [
        ["Name", profile.name],
        ["Email", profile.email],
        ["Address", profile.address || "Not set"],
        ["Profile Image", profile.profileImage ? "Uploaded" : "Not set"],
        ["Downloaded At", new Date().toLocaleString()],
      ];

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => `"${cell.replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      const dataBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `profile_${profile.name}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download profile");
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!profile) return <div className="error-state">Profile not found</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">Profile</h1>
        <p className="profile-subtitle">Manage your account information and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-image-section">
          <div className="profile-image-container">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="profile-image"
              />
            ) : (
              <div className="no-image">No profile image uploaded</div>
            )}
          </div>

          {/* Upload Section */}
          <div className="upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="upload-input"
            />
            <button
              onClick={uploadImage}
              className="upload-button"
              disabled={!image}
            >
              Upload Profile Picture
            </button>
          </div>
        </div>

        {/* User Details */}
        <div className="user-details-section">
          <div className="detail-group">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{profile.name}</span>
          </div>
          <div className="detail-group">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{profile.email}</span>
          </div>
        </div>

        {/* Profile Download Section */}
        <div className="download-section">
          <h3 className="download-title">📥 Download Profile</h3>
          <p style={{ color: "#666", marginTop: 0, marginBottom: "15px" }}>
            Export your profile information in your preferred format:
          </p>
          <div className="download-buttons">
            <button
              onClick={downloadProfileJSON}
              className="download-button"
              title="Download profile as JSON format"
            >
              📄 Download as JSON
            </button>
            <button
              onClick={downloadProfileCSV}
              className="download-button"
              title="Download profile as CSV format"
              style={{ backgroundColor: "#10b981" }}
            >
              📊 Download as CSV
            </button>
          </div>
        </div>

        {/* Plan Status Section */}
        <div className="user-details-section">
          <div className="plan-section">
            <div className="detail-group">
              <span className="detail-label">Current Plan:</span>
              <span className="detail-value">
                {userPlan ? userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1) : "Loading..."}
                {userPlan && userPlan.status === "expired" && (
                  <span style={{ color: "#dc2626", marginLeft: "10px" }}>(Expired)</span>
                )}
              </span>
            </div>
            {userPlan && userPlan.expiration && (
              <div className="detail-group">
                <span className="detail-label">Expires:</span>
                <span className="detail-value">
                  {new Date(userPlan.expiration).toLocaleString()}
                </span>
              </div>
            )}
            <div className="detail-group">
              <button
                onClick={() => window.location.href = "/payment"}
                className="upgrade-button"
              >
                {userPlan?.status === "expired" ? "Renew Plan" : "Upgrade/Manage Plan"}
              </button>
            </div>
          </div>
        </div>

        {/* Address Management Section */}
        <div className="user-details-section">
          <div className="address-section">
            <div className="detail-group">
              <span className="detail-label">Address:</span>
              {!editingAddress ? (
                <div className="address-display">
                  <span className="detail-value">{profile.address || "Not set"}</span>
                  <button
                    onClick={() => setEditingAddress(true)}
                    className="edit-address-button"
                  >
                    Edit Address
                  </button>
                </div>
              ) : (
                <div className="address-edit-form">
                  {!apiKeySet && (
                    <div style={{ padding: "10px", backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: "4px", marginBottom: "10px" }}>
                      <strong>⚠️ Configuration Needed:</strong> Google Maps API key not set. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file.
                    </div>
                  )}

                  {apiKeySet && !mapsLoaded && (
                    <div style={{ padding: "10px", backgroundColor: "#d1ecf1", border: "1px solid #17a2b8", borderRadius: "4px", marginBottom: "10px" }}>
                      <strong>ℹ️ Loading:</strong> Initializing Google Maps APIs...
                    </div>
                  )}

                  {apiKeySet && mapsLoaded && !autocompleteService.current && (
                    <div style={{ padding: "10px", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", borderRadius: "4px", marginBottom: "10px" }}>
                      <strong>⚠️ Places API Not Enabled:</strong> Address suggestions require the <strong>Places API</strong> to be enabled. 
                      <a href="https://console.cloud.google.com/apis/library?filter=category:maps" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "5px" }}>
                        Enable it here
                      </a>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Enter your address"
                    value={newAddress}
                    onChange={(e) => {
                      setNewAddress(e.target.value);
                      getAddressSuggestions(e.target.value);
                    }}
                    className="address-input"
                  />

                  {/* Address Suggestions Dropdown */}
                  {suggestions.length > 0 && mapsLoaded && (
                    <ul className="suggestions-list">
                      {suggestions.map((suggestion, idx) => (
                        <li
                          key={suggestion.place_id || idx}
                          onClick={() => selectAddress(suggestion)}
                          className="suggestion-item"
                        >
                          {suggestion.description}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="address-buttons">
                    <button
                      onClick={updateAddress}
                      className="save-address-button"
                    >
                      Save Address
                    </button>
                    <button
                      onClick={() => {
                        setEditingAddress(false);
                        setNewAddress(profile.address || "");
                        setSuggestions([]);
                      }}
                      className="cancel-address-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Display Section */}
        {profile.address && (
          <div className="map-section">
            <h3>Location Map</h3>
            <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
              <p>📍 Address: <strong>{profile.address}</strong></p>
            </div>
            <div className="map-container">
              <iframe
                title="location-map"
                width="100%"
                height="100%"
                style={{ border: "none", borderRadius: "4px" }}
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(profile.address || "")}`}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onError={() => {
                  console.error("Map failed to load - enable Maps Embed API in Google Cloud Console");
                }}
              ></iframe>
            </div>
            <small style={{ color: "#999", display: "block", marginTop: "5px" }}>
              💡 If the map doesn't load, enable <strong>Maps Embed API</strong> in <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
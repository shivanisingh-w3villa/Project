// //profile.jsx

// import { useEffect, useState } from "react";
// import API from "../api/axios";

// export default function Profile() {
//   const [profile, setProfile] = useState(null);
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Fetch profile
//   const fetchProfile = async () => {
//     try {
//       const res = await API.get("/profile");
//       setProfile(res.data);
//     } catch (err) {
//       console.error("Failed to load profile:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   // Upload profile picture
//   const uploadImage = async () => {
//     if (!image) return;

//     try {
//       const formData = new FormData();
//       formData.append("image", image);

//       await API.post("/profile/upload", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       // Refresh profile after upload
//       await fetchProfile();
//       setImage(null);
//     } catch (err) {
//       console.error("Upload failed:", err);
//     }
//   };

//   if (loading) return <p>Loading...</p>;
//   if (!profile) return <p>Profile not found</p>;

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Profile</h2>

//       {/* Profile Image */}
//       {profile.profileImage ? (
//         <img
//           src={profile.profileImage}
//           alt="Profile"
//           width="120"
//           height="120"
//           style={{
//             borderRadius: "50%",
//             objectFit: "cover",
//             marginBottom: "10px",
//           }}
//         />
//       ) : (
//         <p>No profile image uploaded</p>
//       )}

//       {/* Upload Section */}
//       <div style={{ marginBottom: "20px" }}>
//         <input
//           type="file"
//           accept="image/*"
//           onChange={(e) => setImage(e.target.files[0])}
//         />
//         <br />
//         <button
//           onClick={uploadImage}
//           style={{ marginTop: "10px" }}
//         >
//           Upload Profile Picture
//         </button>
//       </div>

//       {/* User Details */}
//       <p><strong>Name:</strong> {profile.name}</p>
//       <p><strong>Email:</strong> {profile.email}</p>
//       <p>
//         <strong>Address:</strong> {profile.address || "Not set"}
//       </p>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const res = await API.get("/profile");
      setProfile(res.data);
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

      const res = await API.post("/profile/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 🔹 Update UI immediately (no refresh required)
      setProfile((prev) => ({
        ...prev,
        profileImage: res.data.imageUrl,
      }));

      setImage(null);

    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!profile) return <p>Profile not found</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Profile</h2>

      {/* Profile Image */}
      {profile.profileImage ? (
        <img
          src={`${profile.profileImage}?t=${Date.now()}`}  // prevents cache
          alt="Profile"
          width="120"
          height="120"
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "10px",
          }}
        />
      ) : (
        <p>No profile image uploaded</p>
      )}

      {/* Upload Section */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <br />

        <button
          onClick={uploadImage}
          style={{ marginTop: "10px" }}
        >
          Upload Profile Picture
        </button>
      </div>

      {/* User Details */}
      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p>
        <strong>Address:</strong> {profile.address || "Not set"}
      </p>
    </div>
  );
}
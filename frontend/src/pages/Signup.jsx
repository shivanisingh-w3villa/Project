// //Signup.jsx

// import { useState } from "react";
// import API from "../api/axios";

// export default function Signup() {
//   const [form, setForm] = useState({ name: "", email: "", password: "" });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     await API.post("/auth/signup", form);
//     alert("Signup successful");
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input placeholder="Name"
//         onChange={(e) => setForm({ ...form, name: e.target.value })} />
//       <input placeholder="Email"
//         onChange={(e) => setForm({ ...form, email: e.target.value })} />
//       <input type="password" placeholder="Password"
//         onChange={(e) => setForm({ ...form, password: e.target.value })} />
//       <button type="submit">Signup</button>
//     </form>
//   );
// }
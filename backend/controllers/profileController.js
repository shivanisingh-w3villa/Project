import User from "../models/user.js";
import PDFDocument from "pdfkit";

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
};

export const updateAddress = async (req, res) => {
  const { address, lat, lng } = req.body;

  await User.findByIdAndUpdate(req.user.id, {
    address,
    location: { lat, lng },
  });

  res.json({ message: "Address updated" });
};

export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `http://localhost:5000/uploads/${file.filename}`;

    await User.findByIdAndUpdate(userId, {
      profileImage: imageUrl,
    });

    res.json({
      message: "Profile image uploaded successfully",
      imageUrl,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};

export const downloadProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=profile.pdf"
  );

  doc.pipe(res);

  doc.fontSize(18).text("User Profile");
  doc.text(`Name: ${user.name}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Address: ${user.address || "Not set"}`);

  doc.end();
};
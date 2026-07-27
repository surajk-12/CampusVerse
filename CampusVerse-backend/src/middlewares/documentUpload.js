import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    // Unique name to avoid clashes
    cb(null, `notes-${Date.now()}-${file.originalname}`);
  },
});

function checkFileType(file, cb) {
  // Allow PDFs, Word docs, Excels, PowerPoints, text files, and images
  const filetypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|png|jpg|jpeg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname || mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Supported file formats: PDF, Word (doc/docx), Excel (xls/xlsx), PowerPoint (ppt/pptx), Text (txt), or Images!"
      ),
      false
    );
  }
}

const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => checkFileType(file, cb),
});

export default documentUpload;

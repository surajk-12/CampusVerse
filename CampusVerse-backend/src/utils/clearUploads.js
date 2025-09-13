import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");

export const clearUploads = () => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return console.error("Error reading uploads folder:", err);

    for (const file of files) {
      const localFilePath = path.join(uploadsDir, file);

      fs.unlink(localFilePath, (err) => {
        if (err) {
          console.warn(`Failed to delete file at ${localFilePath}:`, err.message);
        } else {
          console.log(`Deleted file: ${localFilePath}`);
        }
      });
    }
  });
};

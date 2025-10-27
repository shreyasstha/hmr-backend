import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + timestamp + fileExtension);
  },
});

// Parse allowed types from env
const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(",");

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: " + allowedTypes.join(", ")));
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) },
  fileFilter,
});
export default upload;

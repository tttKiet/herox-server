import { promises as fs } from "fs";
import path from "path";
import { logger } from "../logger";

/**
 * Lấy ngẫu nhiên một ảnh trong thư mục root-imgs
 * và trả về dưới dạng Data URI Base64.
 */
export async function getRandomImageBase64(
  folderName: string
): Promise<string> {
  // 1. Xác định đường dẫn đến thư mục chứa ảnh
  //    Giả sử file này nằm trong src/utils/getRandomImage.ts
  const imagesDir = path.resolve(
    __dirname,
    "../../../assets/images/root-imgs/" + folderName
  );

  // 2. Đọc danh sách file
  const files = await fs.readdir(imagesDir);

  if (files.length === 0) {
    throw new Error("No images found in root-imgs folder");
  }

  // 3. Chọn ngẫu nhiên một file
  const randomFile = files[Math.floor(Math.random() * files.length)];

  const filePath = path.join(imagesDir, randomFile);
  console.log("randomFile: ", filePath);

  // 4. Đọc nội dung file thành Buffer
  const fileBuffer = await fs.readFile(filePath);

  // 5. Chuyển Buffer sang Base64 string
  const base64 = fileBuffer.toString("base64");

  // 6. Xác định mime-type để dựng Data URI
  const ext = path.extname(randomFile).slice(1).toLowerCase(); // "jpg", "png", ...
  const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

  // 7. Trả về Data URI
  return `data:${mimeType};base64,${base64}`;
}

export async function saveHostedImageToStore(
  imageUrl: string,
  folderName: string
): Promise<string | null> {
  try {
    // 1) Fetch ảnh
    const res = await fetch(imageUrl);
    if (!res.ok) {
      logger.error(`Failed to download image: ${res.status} ${res.statusText}`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const imgBuffer = Buffer.from(arrayBuffer);

    // 2) Tạo đường dẫn thư mục đầy đủ: store-imgs/folderName
    const storeDir = path.resolve(
      __dirname,
      `../../../assets/images/store-imgs/${folderName}`
    );
    await fs.mkdir(storeDir, { recursive: true });

    // 3) Tạo tên file
    const ext = path.extname(new URL(imageUrl).pathname) || ".png";
    const fileName = `${Date.now()}${ext}`;
    const filePath = path.join(storeDir, fileName);

    // 4) Ghi file
    await fs.writeFile(filePath, imgBuffer);
    logger.success(`Upload file to ${folderName} -> OK`);
    return filePath;
  } catch (err: any) {
    logger.error("saveHostedImageToStore error:", err);
    return null;
  }
}

export async function doesFolderExist(folderName: string): Promise<boolean> {
  const folderPath = path.resolve(
    __dirname,
    `../../../assets/images/root-imgs/${folderName}`
  );

  try {
    const stat = await fs.stat(folderPath);
    return stat.isDirectory();
  } catch (err: any) {
    // Lỗi ENOENT là "không tồn tại"
    return false;
  }
}

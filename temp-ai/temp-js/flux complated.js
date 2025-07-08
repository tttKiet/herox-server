// Lấy IMAGE_NAMES từ localStorage (giả sử đã lưu dạng JSON.stringify([...]))
const IMAGE_NAMES = JSON.parse(localStorage.getItem("IMAGE_NAMES") || "[]");

function joinImageNamesToString(names) {
  return Array.isArray(names) ? names.join("|") : String(names);
}

const result = joinImageNamesToString(IMAGE_NAMES);
console.log(result); // "img1|img2|img3|img4"

return result;

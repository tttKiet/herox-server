function addUserToActiveList(username) {
  let storageKeyActive = "usernameActived";

  // Lấy danh sách user đã chọn từ localStorage (nếu có)
  let usernameActived =
    JSON.parse(localStorage.getItem(storageKeyActive)) || [];

  // Kiểm tra xem username đã tồn tại chưa
  if (!usernameActived.includes(username)) {
    usernameActived.push(username); // Thêm user mới vào danh sách
    localStorage.setItem(storageKeyActive, JSON.stringify(usernameActived)); // Lưu lại vào localStorage
    console.log(username + ` đã được thêm vào danh sách.`);
  }
}

// Test hàm
addUserToActiveList("$usernameInteract");

function updateLocalStorageWithUsername(username) {
  const storageKey = "taskLink"; // Tên key trong localStorage
  let usernames = [];

  // Kiểm tra nếu đã có dữ liệu trong localStorage
  const storedData = localStorage.getItem(storageKey);
  if (storedData) {
    usernames = JSON.parse(storedData); // Chuyển từ JSON về array
  }

  // Kiểm tra và thêm username nếu chưa có trong array
  if (!usernames.includes(username)) {
    usernames.push(username.toLowerCase());
    localStorage.setItem(storageKey, JSON.stringify(usernames)); // Lưu lại array xuống localStorage
  }
}

updateLocalStorageWithUsername("$listLink[$loopIndex]");

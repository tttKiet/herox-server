function removeTextInParentheses(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Sử dụng regex để xoá tất cả nội dung trong dấu ngoặc đơn
  return text.replace(/\([^)]*\)/g, "");
}

console.log(
  removeTextInParentheses(
    `Feels great to see this critical aspect finally resolved. 😄`
  )
); // Kết quả: "Portal actually solving bitcoins defi isolation with atomic swaps makes bridging feel obsolete , chain-agnostic sound money... that's  "

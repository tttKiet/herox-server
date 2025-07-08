// convert input
const urlArray = "$currentLink".split("/");
const username = urlArray[3];
console.log("username", username.toLocaleLowerCase());

return username.toLocaleLowerCase();

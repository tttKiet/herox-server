const url =
  "https://telegram124.p.rapidapi.com/telegram/api/chatFullInfo?username=x_interaction_checker_bot";
const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": "7a63382d45msh9641bb32eb5cba8p172583jsnbf1bd7105ab0",
    "x-rapidapi-host": "telegram124.p.rapidapi.com",
  },
};

try {
  const response = await fetch(url, options);
  const result = await response.json();
  console.log(result);
} catch (error) {
  console.error(error);
}

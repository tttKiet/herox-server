const url =
  "https://twitter-api45.p.rapidapi.com/tweet.php?id=1948926195153994222";
const options = {
  method: "GET",
  headers: {
    "x-rapidapi-key": "7a63382d45msh9641bb32eb5cba8p172583jsnbf1bd7105ab0",
    "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
  },
};

try {
  const response = await fetch(url, options);
  const result = await response.json();
  console.log(result);
} catch (error) {
  console.error(error);
}

const REQUEST_ID = "90cfa884-8141-4893-a931-d598126ac1af";
const FAL_KEY =
  "b60ed0c4-3daf-4eab-8f4f-75a5b89db6c6:03039d793b1833bf8a018551d6be40f2";

try {
  const resp = await fetch(
    `https://queue.fal.run/fal-ai/flux/requests/${REQUEST_ID}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${FAL_KEY}`,
      },
    }
  );

  const res = await resp.json();
  console.log(res);
} catch (error) {
  console.log(error);
}

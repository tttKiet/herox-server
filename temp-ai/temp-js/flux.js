const t = {
  prompt: `Capture an intimate close-up bathed in warm, soft, late-afternoon sunlight filtering into a quintessential 1960s kitchen. The focal point is a charmingly designed vintage package of all-purpose flour, resting invitingly on a speckled Formica countertop. The packaging itself evokes pure nostalgia: perhaps thick, slightly textured paper in a warm cream tone, adorned with simple, bold typography (a friendly serif or script) in classic red and blue “ALL-PURPOSE FLOUR”, featuring a delightful illustration like a stylized sheaf of wheat or a cheerful baker character. In smaller bold print at the bottom of the package: “NET WT 5 LBS (80 OZ) 2.27kg”. Focus sharply on the package details – the slightly soft edges of the paper bag, the texture of the vintage printing, the inviting \"All-Purpose Flour\" text. Subtle hints of the 1960s kitchen frame the shot – the chrome edge of the counter gleaming softly, a blurred glimpse of a pastel yellow ceramic tile backsplash, or the corner of a vintage metal canister set just out of focus. The shallow depth of field keeps attention locked on the beautifully designed package, creating an aesthetic rich in warmth, authenticity, and nostalgic appeal.`,
};

const FAL_KEY =
  "b60ed0c4-3daf-4eab-8f4f-75a5b89db6c6:03039d793b1833bf8a018551d6be40f2";

try {
  const resp = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${FAL_KEY}`,
    },

    body: JSON.stringify(t),
  });

  const res = await resp.json();
  console.log(res);
} catch (error) {
  console.log(error);
}

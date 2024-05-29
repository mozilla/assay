export default function getAddonSlug(input: string) {
  let delimiter = "addon/";
  if (input.includes("review/")) {
    delimiter = "review/";
  }
  if (input.includes("review-unlisted/")) {
    delimiter = "review-unlisted/";
  }

  return input.includes("/") ? input.split(delimiter)[1].split("/")[0] : input;
}

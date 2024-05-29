export default function getAddonSlug(input: string) {
  const delimiter = input.includes("review/")
    ? "review/"
    : input.includes("review-unlisted/")
    ? "review-unlisted/"
    : "addon/";

  return input.includes("/") ? input.split(delimiter)[1].split("/")[0] : input;
}

/**
 * Extracts an add-on's slug from a URL or other user input. If a slug cannot be
 * identified, return the input string.
 *
 * The addon's slug is assumed to be the string between a well-known delimiter
 * and an optional slash after the delimiter. For example, in input string of
 * "...addon/ublock-origin/?utm_source..." would return "ublock-origin".
 *
 * Well-known URL delimiters are:
 * - "addon/" - A normal AMO link.
 * - "review/" - A listed add-on in the AMO reviewer tools.
 * - "review-unlisted/" - A unlisted listed add-on in the AMO reviewer tools.
 */
export default function getAddonSlug(input: string) {
  let delimiter = "addon/";
  if (input.includes("review/")) {
    delimiter = "review/";
  } else if (input.includes("review-unlisted/")) {
    delimiter = "review-unlisted/";
  }

  return input.includes("/") ? input.split(delimiter)[1]?.split("/")[0] : input;
}

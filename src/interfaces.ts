export interface AddonInfoResponse {
  slug: string;
  name: {
    [key: string]: string;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  current_version: {
    version: string;
    file: {
      id: string;
    };
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  default_locale: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  review_url: string;
  guid: string;
}

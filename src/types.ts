export type addonInfoResponse = {
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
};

export type addonVersion = {
  map(
    arg0: (version: any) => any
  ): readonly string[] | Thenable<readonly string[]>;
  id: string;
  version: string;
  file: {
    id: string;
  };
};

export type configConstants = {
  apiBaseURL: string;
  reviewBaseURL: string;
  downloadBaseURL: string;
};

export type errorMessages = {
  window: {
    [code: string]: string;
  };
  thrown: {
    [code: string]: string;
  };
};
export enum ExportPreference {
  Save = "Save my Preference",
  Ask = "Ask Every Time",
  None = "No Preference",
  Yes = "Yes",
  No = "No"
}
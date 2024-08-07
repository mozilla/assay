import { Uri } from "vscode";

export type AddonInfoResponse = {
  id: string;
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

export type AddonVersion = {
  map(
    arg0: (version: any) => any
  ): readonly string[] | Thenable<readonly string[]>;
  id: string;
  version: string;
  file: {
    id: string;
  };
};

export type ConfigConstants = {
  apiBaseURL: string;
  reviewBaseURL: string;
  downloadBaseURL: string;
};

export type ErrorMessages = {
  window: {
    [code: string]: string;
  };
  thrown: {
    [code: string]: string;
  };
};

export type CommentsCache = {
  [guid: string]: {
    [version: string]: {
      [filepath: string]: {
        [lineNumber: string]: {
          uri: Uri;
        };
      };
    };
  };
};

export type JSONComment = {
  uri: Uri;
  body: string;
};

export type JSONReview = {
  reviewUrl: string;
  version: string;
  fileID: string;
  id: string;
  isDirty: boolean;
};

export type ThreadLocation = {
  uri: Uri;
  guid: string;
  version: string;
  filepath: string;
  range: string;
};

export type MessageType = "error" | "notice" | "warning";

export type Message = {
  type: MessageType;
  code: string;
  message: string;
  description: string;
  file: string;
  line: number | undefined;
};

export enum QPOption {
  Save = "Save my Preference",
  Ask = "Ask Every Time",
  None = "No Preference",
  Yes = "Yes",
  No = "No",
}

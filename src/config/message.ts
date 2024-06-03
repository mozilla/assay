export type MessageType = "error" | "notice" | "warning";

export default interface Message {
  _type: MessageType;
  code: string;
  message: string;
  description: string;
  file: string;
  line: number | undefined;
}
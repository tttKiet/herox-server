export interface IPrompt {
  _id: string;
  name: string;
  memberId: string;
  context: string;
  type: string;
  status: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: IMember;
}
export interface IMember {
  _id?: string;
  permisson: string;
  type: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

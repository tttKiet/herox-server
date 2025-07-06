import axios from "axios";
import { PROMPT_API } from "../endpoints";

export interface IFilterPrompt {
  _id: string;
  type: string;
  status: string;
}

type PromptBody = {
  name: string;
  apiKey: string;
  context: string;
  type: string;
  status: string;
  description?: string | null;
  _id?: string;
};

class PromptService {
  async getPrompt({
    apiKey,
    filter,
  }: {
    apiKey: string;
    filter?: IFilterPrompt;
  }) {
    const params: Record<string, string> = { apiKey };
    if (filter) {
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
    }
    const res = await axios.get(PROMPT_API, { params });
    return res.data;
  }

  async createOrUpdatePrompt({
    apiKey,
    _id,
    context,
    type,
    status,
    description,
    name,
  }: PromptBody) {
    const body: PromptBody = {
      apiKey,
      context,
      type,
      status,
      description,
      name,
    };
    if (_id) body._id = _id;
    const res = await axios.post(PROMPT_API, body);
    return res.data;
  }

  async deletePrompt({ apiKey, _id }: { apiKey: string; _id: string }) {
    const body = {
      apiKey,
      _id,
    };
    const res = await axios.delete(PROMPT_API, { data: body });
    return res.data;
  }
}

const promptService = new PromptService();

export { promptService };

import axios from "axios";
import { PROJECT_API } from "../endpoints";

export interface IProject {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

class ProjectService {
  async getProjects({ apiKey }: { apiKey?: string }) {
    const params: Record<string, string> = apiKey ? { apiKey } : {};
    const res = await axios.get(PROJECT_API, { params });
    return res.data;
  }

  async createProject({ apiKey, name }: { apiKey: string; name: string }) {
    const body = {
      apiKey,
      name,
    };
    const res = await axios.post(PROJECT_API, body);
    return res.data;
  }

  async deleteProject({
    apiKey,
    projectId,
  }: {
    apiKey: string;
    projectId: string;
  }) {
    const res = await axios.delete(PROJECT_API, {
      data: {
        apiKey,
        projectId,
      },
    });
    return res.data;
  }

  async deleteProjects({
    apiKey,
    projectIds,
  }: {
    apiKey: string;
    projectIds: string[];
  }) {
    const res = await axios.delete(PROJECT_API + "s", {
      data: {
        apiKey,
        projectIds,
      },
    });
    return res.data;
  }
}

export const projectService = new ProjectService();

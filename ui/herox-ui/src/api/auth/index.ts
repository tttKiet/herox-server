import axios from "axios";
import { LOGIN_API } from "../endpoints";

class AuthService {
  async login(apiKey: string) {
    const res = await axios.post(LOGIN_API, { apiKey });
    return res.data;
  }
}

const authService = new AuthService();

export { authService };

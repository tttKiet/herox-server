import axios from "axios";

const API_MEMBER_PAYMENT = "/api/v1/member/payment";

class BillingService {
  constructor() {}

  async getInfoBilling(apiKey: string) {
    console.log(
      "process.env.NEXT_PUBLIC_API_BASE_URL: ",
      process.env.NEXT_PUBLIC_API_BASE_URL
    );
    const res = await axios.post(API_MEMBER_PAYMENT, {
      apiKey,
    });

    return res;
  }
}
const billingService = new BillingService();
export default billingService;

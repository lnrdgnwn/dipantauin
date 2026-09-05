import { PlansRepository } from "./plans.repository";

export class PlansService {
  static async getPlans() {
    return PlansRepository.findActive();
  }

  static async getPlanById(id: string) {
    const plan = await PlansRepository.findById(id);
    if (!plan) {
      throw { statusCode: 404, message: "Plan not found" };
    }
    return plan;
  }
}

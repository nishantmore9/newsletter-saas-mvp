import SubscriberRepo from "./subscribers.repository.js";
import { createSubscriberInput, DeleteSubscriberInput } from "./subscribers.schema.js";

const SubscriberService = {
  create: async(input: createSubscriberInput) => {
    const { publicationId, email, name } = input;
    const normalizedEmail = email.trim().toLowerCase();
    return await SubscriberRepo.create(publicationId, normalizedEmail, name);
  },
  getByPublicationId: async(publicationId: string, page = 1, limit = 20,) => {
    const offset = (page - 1) * limit;
    return await SubscriberRepo.getByPublicationId(publicationId, limit, offset);
  },
  deleteById: async(subscriberId: string) => {
    return await SubscriberRepo.deleteById(subscriberId);
  }
}

export default SubscriberService;
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { subscribers } from "../../db/schema.js";

const SubscriberRepo = {
  create: async (publicationId: string, email: string, name: string) => {
    const [subscriber] = await db
      .insert(subscribers)
      .values({
        publicationId,
        email,
        name,
      })
      .returning();

    return subscriber;
  },

  getByPublicationId: async (
    publicationId: string,
    limit: number,
    offset: number,
  ) => {
    return await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.publicationId, publicationId))
      .limit(limit)
      .offset(offset);
  },
};

export default SubscriberRepo;

import { db, DBorTx } from "../../db/index.js"
import { publications } from "../../db/schema.js"

const PublicationRepo = {
  create: async(ownerId: string, name: string, executor: DBorTx) => {
    const [publication] = await executor
      .insert(publications)
      .values({
        ownerId,
        name
      }).returning();

    return publication;
  }
  
}

export default PublicationRepo;
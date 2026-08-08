import { eq } from "drizzle-orm";
import { db, DBorTx } from "../../db/index.js"
import { users } from "../../db/schema.js";

type User = {
  email: string;
  passwordHash: string;
  verificationToken: string;
}

const UserRepo = {
  create: async (user: User, executor: DBorTx) => {
    const [newUser] = await executor
      .insert(users)
      .values(user)
      .returning({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      });
    return newUser;
  },
  getByEmail: async (email: string) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }
}

export default UserRepo;
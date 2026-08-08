import { z } from 'zod';

const publicationSchema = z.object({
  body: z.object({
    ownerId: z.string().uuid(),
    name: z.string()
  })
})

export type PublicationInput = z.infer<typeof publicationSchema>['body'];
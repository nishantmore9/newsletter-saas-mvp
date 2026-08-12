import z from 'zod'

export const subscriberSchema = z.object({
  params: z.object({
    publicationId: z.string().uuid()
  }),
  body: z.object({
    email: z
      .string('Email is required')
      .trim()
      .toLowerCase()
      .email('Invalid email format'),
    name: z.string().max(100),
    hp_field: z.string().optional(),
  })
})

export const getSubscribersSchema = z.object({
  params: z.object({
    publicationId: z.string().uuid(),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
})

export const createSubscriberSchema = z.object({
    publicationId: z.string().uuid(),
    email: z.string().email('Invalid email format'),
    name: z.string().max(100),
})

export const deleteSubscriberSchema = z.object({
  params: z.object({
    subscriberId: z.string().uuid(),
  }),
})

export type SubscriberInput = z.infer<typeof subscriberSchema>;
export type createSubscriberInput = z.infer<typeof createSubscriberSchema>;
export type GetSubscribersInput = z.infer<typeof getSubscribersSchema>;
export type DeleteSubscriberInput = z.infer<typeof deleteSubscriberSchema>;
import z from 'zod'

export const subscriberSchema = z.object({
  params: z.object({
    publication_id: z.string().uuid
  }),
  body: z.object({
    email: z
      .string('Email is required')
      .trim()
      .toLowerCase()
      .email('Invalid email format'),
    name: z.string().max(100)
  })
})

export type SubscriberInput = z.infer<typeof subscriberSchema>['body'];
import { User } from '@prisma/client'
import prisma from '../lib/prisma.js'

export async function getUserHistory(user: User) {
  const history = await prisma.flowHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    include: {
      question: {
        select: { id: true, text: true, isCheckpoint: true, moduleId: true },
      },
      option: {
        select: { id: true, text: true, nextQuestionId: true },
      },
    },
  })

  return history
}

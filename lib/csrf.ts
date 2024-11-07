import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { nextCsrf } from 'next-csrf'
import { sessionOptions } from './session'

export const csrfProtection = nextCsrf({
  secret: process.env.CSRF_SECRET as string,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
})

export async function getSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession(req, res, sessionOptions)
  return session
}
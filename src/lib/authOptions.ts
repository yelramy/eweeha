import { AuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authUser } from '@/lib/auth'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const username = credentials?.username ?? ''
        const password = credentials?.password ?? ''
        if (!username || !password) return null
        const user = await authUser(username, password)
        if (user) {
          return { id: String(user.id), name: String(user.username), email: user.email ?? undefined } as User
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin'
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET
}



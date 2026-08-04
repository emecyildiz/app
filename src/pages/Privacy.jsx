import { motion } from 'framer-motion'
import { Database, Eye, Lock, Mail, Shield, UserCheck } from 'lucide-react'
import { APP_NAME } from '../config/appConfig'

const sections = [
  ['Information we process', 'We process account details, profile information, ratings, favorites, watch history, comments, recommendations, security logs, and the technical data required to operate the service.', Eye],
  ['Why we use it', 'The data is used to provide your account and movie features, protect the platform, prevent abuse, diagnose faults, and improve reliability. We do not sell personal information or use it for third-party advertising.', Database],
  ['Storage and security', 'Application data is stored in a self-hosted PostgreSQL database. Passwords are hashed, sessions use secure cookies, state-changing requests require CSRF protection, and administrative access is restricted.', Shield],
  ['Your choices', 'You can update your profile, control supported visibility settings, and delete your account from the application. Account deletion removes or anonymizes associated data according to operational and legal requirements.', UserCheck],
  ['Cookies', 'We use essential cookies for authentication, session security, and CSRF protection. These cookies are necessary for signed-in features and are not used for advertising or cross-site tracking.', Lock],
  ['External services', 'TMDB provides movie metadata and images. Resend may deliver account emails. These providers process only the information needed to provide their respective services and maintain their own privacy policies.', Database],
  ['Contact', 'For privacy questions or requests, use the contact channel published on Emecworks. We may update this notice when the application or its service providers change.', Mail],
]

const Privacy = () => (
  <div className="min-h-screen pt-20 pb-16 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
    </div>
    <div className="container mx-auto px-4 max-w-4xl relative">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-5 py-2 mb-6">
          <Lock className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300 font-medium">Privacy and security</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy notice</h1>
        <p className="text-gray-400">Last updated: August 4, 2026</p>
      </motion.header>
      <motion.main initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 md:p-12 border border-white/5 space-y-9">
        <p className="text-gray-300 leading-relaxed">
          This notice explains how {APP_NAME} handles information when you create an account or use its social movie features.
        </p>
        {sections.map(([title, body, Icon]) => (
          <section key={title} className="flex items-start gap-4">
            <Icon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
              <p className="text-gray-300 leading-relaxed">{body}</p>
            </div>
          </section>
        ))}
      </motion.main>
    </div>
  </div>
)

export default Privacy

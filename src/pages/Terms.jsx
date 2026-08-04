import { motion } from 'framer-motion'
import { AlertCircle, FileText, Scale, Shield } from 'lucide-react'
import { APP_NAME } from '../config/appConfig'

const sections = [
  [FileText, 'Using the service', `By using ${APP_NAME}, you agree to use the platform lawfully and in accordance with these terms. The service is an independent portfolio project and may change as it is developed.`],
  [Shield, 'Account responsibilities', 'Provide accurate account information, protect your credentials, and do not attempt to bypass access controls, disrupt the service, automate abusive traffic, or access another user’s account.'],
  [Scale, 'User content', 'You remain responsible for comments, ratings, profile text, and recommendations you submit. Do not publish unlawful, abusive, deceptive, infringing, or privacy-invasive material.'],
  [FileText, 'Movie information', 'Movie metadata and artwork are supplied by The Movie Database (TMDB). Ratemet does not claim ownership of that third-party material and is not endorsed or certified by TMDB.'],
  [AlertCircle, 'Availability and warranties', 'The service is provided as available without a guarantee of uninterrupted operation, permanent data retention, or fitness for a particular purpose. Features may be changed, suspended, or removed.'],
  [Shield, 'Enforcement', 'Accounts or content may be restricted or removed when necessary to protect users, comply with law, investigate abuse, or enforce these terms.'],
]

const Terms = () => (
  <div className="min-h-screen pt-20 pb-16 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
    </div>
    <div className="container mx-auto px-4 max-w-4xl relative">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <p className="text-purple-300 uppercase tracking-[0.3em] text-sm mb-5">Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of use</h1>
        <p className="text-gray-400">Last updated: August 4, 2026</p>
      </motion.header>
      <motion.main initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 md:p-12 border border-white/5 space-y-9">
        {sections.map(([Icon, title, body], index) => (
          <section key={title} className="flex items-start gap-4">
            <Icon className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">{index + 1}. {title}</h2>
              <p className="text-gray-300 leading-relaxed">{body}</p>
            </div>
          </section>
        ))}
        <section className="border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold text-white mb-3">7. Contact</h2>
          <p className="text-gray-300 leading-relaxed">Questions about these terms can be submitted through the contact channel published on Emecworks.</p>
        </section>
      </motion.main>
    </div>
  </div>
)

export default Terms

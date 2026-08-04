import { motion } from 'framer-motion'
import { Film, Heart, Shield, Star, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/appConfig'

const features = [
  [Film, 'Discover movies', 'Browse current, popular, and highly rated titles using metadata supplied by TMDB.'],
  [Star, 'Rate and review', 'Record your rating and share concise opinions about the movies you watch.'],
  [Heart, 'Build collections', 'Keep favorites and watch history together in your personal profile.'],
  [Users, 'Connect and recommend', 'Follow friends and send movie recommendations directly through the platform.'],
  [Shield, 'Self-hosted accounts', 'Account and social data are controlled by the application in its own PostgreSQL database.'],
  [Zap, 'Focused experience', 'A fast interface designed around discovery instead of advertising and tracking.'],
]

const About = () => (
  <div className="min-h-screen pt-20 pb-16 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-20 left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
    </div>
    <div className="container mx-auto px-4 max-w-6xl relative">
      <motion.header initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
        <p className="text-purple-300 uppercase tracking-[0.3em] text-sm mb-5">About the project</p>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Movies are better when they are shared.</h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          {APP_NAME} is an experimental, self-hosted movie discovery and social catalog built to explore full-stack product engineering.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-9">
          <Link to="/movies" className="btn btn-primary">Explore movies</Link>
          <Link to="/register" className="btn btn-secondary">Create an account</Link>
        </div>
      </motion.header>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 py-10">
        {features.map(([Icon, title, description], index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="glass rounded-2xl border border-white/5 p-7"
          >
            <Icon className="w-8 h-8 text-purple-400 mb-5" />
            <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
            <p className="text-gray-400 leading-relaxed">{description}</p>
          </motion.article>
        ))}
      </section>

      <section className="glass rounded-3xl border border-white/5 p-9 md:p-14 my-14 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">Built as a real engineering exercise</h2>
        <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
          The project covers authentication, relational data modeling, API design, security controls, transactional email, containerization, and VPS operations. It remains a portfolio project, but its core workflows are designed to be genuinely usable.
        </p>
      </section>
    </div>
  </div>
)

export default About

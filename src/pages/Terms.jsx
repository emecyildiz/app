import { AlertCircle, Clapperboard, FileText, MessageSquare, Scale, Shield } from 'lucide-react'
import LegalDocument from '../components/LegalDocument'
import { APP_NAME } from '../config/appConfig'

const sections = [
  [FileText, 'Using the service', `By using ${APP_NAME}, you agree to use the platform lawfully and in accordance with these terms. The service is an independent portfolio project and may change as it is developed.`],
  [Shield, 'Account responsibilities', 'Provide accurate account information, protect your credentials, and do not attempt to bypass access controls, disrupt the service, automate abusive traffic, or access another user’s account.'],
  [MessageSquare, 'User content', 'You remain responsible for comments, ratings, profile text, and recommendations you submit. Do not publish unlawful, abusive, deceptive, infringing, or privacy-invasive material.'],
  [Clapperboard, 'Movie information', 'Movie metadata and artwork are supplied by The Movie Database (TMDB). Ratemet does not claim ownership of that third-party material and is not endorsed or certified by TMDB.'],
  [AlertCircle, 'Availability and warranties', 'The service is provided as available without a guarantee of uninterrupted operation, permanent data retention, or fitness for a particular purpose. Features may be changed, suspended, or removed.'],
  [Scale, 'Enforcement', 'Accounts or content may be restricted or removed when necessary to protect users, comply with law, investigate abuse, or enforce these terms.'],
  [Shield, 'Contact', 'Questions about these terms can be submitted through the contact channel published on Emecworks.'],
]

const Terms = () => (
  <LegalDocument
    eyebrow="Legal archive · Terms"
    title="Terms of use"
    summary={`The ground rules for accounts, content, and responsible use of ${APP_NAME}.`}
    updated="August 4, 2026"
    sections={sections}
  />
)

export default Terms

import { Cookie, Database, Eye, Lock, Mail, UserCheck } from 'lucide-react'
import LegalDocument from '../components/LegalDocument'
import { APP_NAME } from '../config/appConfig'

const sections = [
  [Eye, 'Information we process', 'We process account details, profile information, ratings, favorites, watch history, comments, recommendations, security logs, and the technical data required to operate the service.'],
  [Database, 'Why we use it', 'The data is used to provide your account and movie features, protect the platform, prevent abuse, diagnose faults, and improve reliability. We do not sell personal information or use it for third-party advertising.'],
  [Lock, 'Storage and security', 'Application data is stored in a self-hosted PostgreSQL database. Passwords are hashed, sessions use secure cookies, state-changing requests require CSRF protection, and administrative access is restricted.'],
  [UserCheck, 'Your choices', 'You can update your profile, control supported visibility settings, and delete your account from the application. Account deletion removes or anonymizes associated data according to operational and legal requirements.'],
  [Cookie, 'Essential cookies', 'We use essential cookies for authentication, session security, and CSRF protection. These cookies are necessary for signed-in features and are not used for advertising or cross-site tracking.'],
  [Database, 'External services', 'TMDB provides movie metadata and images. Resend may deliver account emails. These providers process only the information needed to provide their respective services and maintain their own privacy policies.'],
  [Mail, 'Contact and changes', 'For privacy questions or requests, use the contact channel published on Emecworks. We may update this notice when the application or its service providers change.'],
]

const Privacy = () => (
  <LegalDocument
    eyebrow="Legal archive · Privacy"
    title="Privacy notice"
    summary={`How ${APP_NAME} handles information when you create an account or use its social movie features.`}
    updated="August 4, 2026"
    sections={sections}
  />
)

export default Privacy

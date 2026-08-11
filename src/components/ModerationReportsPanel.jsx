import { useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { userService } from '../services/userService'
import UserAvatar from './UserAvatar'
import { EmptyState, WorkspacePanel } from './WorkspaceUI'

const statusMeta = {
  pending: {
    label: 'Awaiting review',
    icon: ClockIcon,
    className: 'border-[#d8a34f]/35 bg-[#d8a34f]/10 text-[#e6bd78]',
  },
  reviewing: {
    label: 'Under review',
    icon: MagnifyingGlassIcon,
    className: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircleIcon,
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  },
  dismissed: {
    label: 'Dismissed',
    icon: XCircleIcon,
    className: 'border-white/15 bg-white/[0.04] text-[#918e86]',
  },
}

const filters = [
  { id: 'pending', label: 'Pending' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'all', label: 'All reports' },
]

export default function ModerationReportsPanel() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [reports, setReports] = useState([])
  const [counts, setCounts] = useState({ pending: 0, reviewing: 0, resolved: 0, dismissed: 0 })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedReport, setSelectedReport] = useState(null)
  const [reviewStatus, setReviewStatus] = useState('reviewing')
  const [resolutionNote, setResolutionNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadReports = async () => {
      setLoading(true)
      try {
        const result = await userService.getModerationReports(statusFilter, page, 20)
        if (!mounted) return
        setReports(Array.isArray(result?.items) ? result.items : [])
        setCounts(result?.counts || { pending: 0, reviewing: 0, resolved: 0, dismissed: 0 })
        setTotalPages(result?.totalPages || 0)
        if (result?.currentPage && result.currentPage !== page) setPage(result.currentPage)
      } catch (error) {
        if (mounted) toast.error(error?.message || 'Reports could not be loaded.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadReports()
    return () => { mounted = false }
  }, [statusFilter, page, refreshKey])

  const selectFilter = (nextStatus) => {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  const openReview = (report) => {
    setSelectedReport(report)
    setReviewStatus(report.status === 'pending' ? 'reviewing' : report.status)
    setResolutionNote(report.resolution_note || '')
  }

  const submitReview = async (event) => {
    event.preventDefault()
    const note = resolutionNote.trim()
    if ((reviewStatus === 'resolved' || reviewStatus === 'dismissed') && note.length < 10) {
      toast.error('Add an internal note of at least 10 characters before closing the report.')
      return
    }

    setSaving(true)
    try {
      await userService.updateModerationReport(selectedReport.id, reviewStatus, note)
      toast.success(reviewStatus === 'reviewing' ? 'Report marked as under review.' : 'Report review completed.')
      setSelectedReport(null)
      setResolutionNote('')
      setRefreshKey((value) => value + 1)
    } catch (error) {
      const messages = {
        report_conflict_of_interest: 'You cannot review a report involving your own account.',
        resolution_note_required: 'A longer internal note is required to close this report.',
      }
      toast.error(messages[error?.code] || error?.message || 'The report could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <section aria-label="Report status summary" className="grid overflow-hidden border border-white/10 bg-[#11120f] sm:grid-cols-2 lg:grid-cols-4">
        {['pending', 'reviewing', 'resolved', 'dismissed'].map((status, index) => {
          const meta = statusMeta[status]
          const Icon = meta.icon
          const selected = statusFilter === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => selectFilter(status)}
              className={`flex min-h-28 items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-white/[0.03] ${
                index > 0 ? 'border-t border-white/10 sm:border-t-0 sm:border-l' : ''
              } ${selected ? 'bg-[#e85d4a]/[0.06]' : ''}`}
            >
              <div>
                <p className="ui-eyebrow">{meta.label}</p>
                <p className="mt-2 font-display text-3xl leading-none text-[#f3efe6]">{counts[status] || 0}</p>
              </div>
              <Icon className={`h-6 w-6 ${selected ? 'text-[#e85d4a]' : 'text-[#77756f]'}`} strokeWidth={1.4} />
            </button>
          )
        })}
      </section>

      <WorkspacePanel
        eyebrow="Member safety"
        title="Report queue"
        description="Review reports using the submitted context. Closing a report records your account and timestamp in the audit trail."
        action={
          <label className="block min-w-44">
            <span className="sr-only">Filter reports by status</span>
            <select value={statusFilter} onChange={(event) => selectFilter(event.target.value)} className="input py-2.5">
              {filters.map((filter) => <option key={filter.id} value={filter.id}>{filter.label}</option>)}
            </select>
          </label>
        }
      >
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#e85d4a]" />
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FlagIcon}
            title="No reports in this queue"
            description="New or updated reports matching the selected status will appear here."
          />
        ) : (
          <div className="divide-y divide-white/10">
            {reports.map((report) => {
              const meta = statusMeta[report.status] || statusMeta.pending
              const StatusIcon = meta.icon
              const reporter = report.reporter || {}
              const reportedUser = report.reported_user || {}
              return (
                <article key={report.id} className="px-5 py-6 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="ui-eyebrow text-[#e85d4a]">{formatCategory(report.category)}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#66645f]">
                        Submitted {formatDate(report.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${meta.className}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <PersonCard label="Reported by" person={reporter} />
                    <PersonCard label="Account reported" person={reportedUser} showAccountState />
                  </div>

                  <div className="mt-4 border border-white/10 bg-black/20 p-4">
                    <p className="ui-eyebrow">Submitted context</p>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#d8d2c7]">{report.details}</p>
                  </div>

                  {report.resolution_note && (
                    <div className="mt-3 border-l-2 border-emerald-400/40 bg-emerald-400/[0.04] px-4 py-3">
                      <p className="ui-eyebrow text-emerald-300">Internal resolution note</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#aaa79f]">{report.resolution_note}</p>
                      {report.reviewer && (
                        <p className="mt-2 text-xs text-[#66645f]">
                          Reviewed by {report.reviewer.name || `@${report.reviewer.username}`} {report.reviewed_at ? `on ${formatDate(report.reviewed_at)}` : ''}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex justify-end">
                    <button type="button" onClick={() => openReview(report)} className="ui-button-primary min-h-10 px-4">
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      {report.status === 'pending' ? 'Begin review' : 'Update review'}
                    </button>
                  </div>
                </article>
              )
            })}

            {totalPages > 1 && (
              <nav aria-label="Report queue pagination" className="flex items-center justify-between px-5 py-5 sm:px-6">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="ui-button-secondary min-h-10 px-4 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#77756f]">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="ui-button-secondary min-h-10 px-4 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        )}
      </WorkspacePanel>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="review-report-title" className="ui-surface max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="ui-eyebrow text-[#e85d4a]">Moderation decision</p>
                <h2 id="review-report-title" className="mt-2 font-display text-3xl text-[#f3efe6]">Review report</h2>
                <p className="mt-2 text-sm leading-6 text-[#77756f]">
                  Notes are internal. They are retained for accountability but are not shown to the reporting member.
                </p>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} disabled={saving} className="table-action px-2 py-1" aria-label="Close report review">
                Close
              </button>
            </div>

            <form onSubmit={submitReview} className="mt-6 space-y-5">
              <label className="block">
                <span className="ui-field-label">Decision</span>
                <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} className="input">
                  <option value="reviewing">Under review</option>
                  <option value="resolved">Resolved — action or follow-up completed</option>
                  <option value="dismissed">Dismissed — no action required</option>
                </select>
              </label>

              <label className="block">
                <span className="ui-field-label">Internal note</span>
                <textarea
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value.slice(0, 2000))}
                  rows={6}
                  maxLength={2000}
                  className="input resize-y"
                  placeholder="Record the evidence reviewed and the reason for the decision."
                />
                <span className="mt-2 flex items-center justify-between gap-4 text-xs text-[#66645f]">
                  <span>{reviewStatus === 'resolved' || reviewStatus === 'dismissed' ? 'At least 10 characters required to close.' : 'Optional while investigation is ongoing.'}</span>
                  <span className="font-mono">{resolutionNote.length}/2000</span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setSelectedReport(null)} disabled={saving} className="ui-button-secondary min-h-10 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="ui-button-primary min-h-10 px-4 disabled:cursor-not-allowed disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PersonCard({ label, person, showAccountState = false }) {
  return (
    <div className="flex items-center gap-3 border border-white/10 bg-[#11120f] p-3">
      <UserAvatar
        src={person.avatar}
        name={person.name}
        username={person.username}
        className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
        fallbackClassName="text-xs"
      />
      <div className="min-w-0">
        <p className="ui-eyebrow">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#f3efe6]">{person.name || person.username || 'Unavailable account'}</p>
        {person.username && <p className="truncate text-xs text-[#77756f]">@{person.username}</p>}
        {showAccountState && (
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#66645f]">
            {person.role || 'USER'} / {person.status || 'UNKNOWN'}
          </p>
        )}
      </div>
    </div>
  )
}

function formatCategory(value) {
  return String(value || 'other').replaceAll('_', ' ')
}

function formatDate(value) {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

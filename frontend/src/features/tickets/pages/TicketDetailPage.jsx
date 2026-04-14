import {
  AlertTriangle,
  CheckCheck,
  MessageSquare,
  PencilLine,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { api, resolveApiUrl, toApiError } from '../../../lib/api.js'
import {
  canAdminClose,
  canTechnicianMoveToInProgress,
  canTechnicianResolve,
  formatTicketPriority,
} from '../api/tickets.js'
import { TicketStatusBadge } from '../components/TicketStatusBadge.jsx'

function formatDateTime(value) {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function TicketDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [images, setImages] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentValue, setEditingCommentValue] = useState('')
  const [busyState, setBusyState] = useState('')

  const validateComment = (value) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'Comments cannot be empty.'
    }
    if (trimmed.length > 1500) {
      return 'Comments must be 1500 characters or fewer.'
    }
    return ''
  }

  const loadTicket = async () => {
    setLoading(true)
    setError('')

    try {
      const [ticketResponse, imagesResponse, commentsResponse] = await Promise.all([
        api.get(`/api/tickets/${id}`),
        api.get(`/api/tickets/${id}/images`),
        api.get(`/api/tickets/${id}/comments`),
      ])

      setTicket(ticketResponse.data)
      setImages(imagesResponse.data)
      setComments(commentsResponse.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load this ticket.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTicket()
  }, [id])

  const updateStatus = async (nextStatus) => {
    if (!ticket) {
      return
    }

    setBusyState(`status-${nextStatus}`)
    setError('')

    try {
      const endpoint = user.role === 'ADMIN' ? `/api/admin/tickets/${ticket.id}/status` : `/api/tickets/${ticket.id}/status`
      const response = await api.put(endpoint, { status: nextStatus })
      setTicket(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not update the ticket status.').message)
    } finally {
      setBusyState('')
    }
  }

  const addComment = async (event) => {
    event.preventDefault()
    const validationMessage = validateComment(commentDraft)
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setBusyState('add-comment')
    setError('')

    try {
      const response = await api.post(`/api/tickets/${ticket.id}/comments`, {
        content: commentDraft,
      })
      setComments((current) => [...current, response.data])
      setCommentDraft('')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not add your comment.').message)
    } finally {
      setBusyState('')
    }
  }

  const saveComment = async (commentId) => {
    const validationMessage = validateComment(editingCommentValue)
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setBusyState(`comment-${commentId}`)
    setError('')

    try {
      const response = await api.put(`/api/comments/${commentId}`, {
        content: editingCommentValue,
      })
      setComments((current) => current.map((comment) => (comment.id === commentId ? response.data : comment)))
      setEditingCommentId(null)
      setEditingCommentValue('')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not save this comment.').message)
    } finally {
      setBusyState('')
    }
  }

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) {
      return
    }

    setBusyState(`delete-${commentId}`)
    setError('')

    try {
      await api.delete(`/api/comments/${commentId}`)
      setComments((current) => current.filter((comment) => comment.id !== commentId))
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not delete this comment.').message)
    } finally {
      setBusyState('')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-8">
          <div className="h-6 w-40 rounded-full bg-[var(--surface-muted)]" />
          <div className="mt-4 h-10 w-2/3 rounded-full bg-[var(--surface-muted)]" />
          <div className="mt-4 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
        <p className="font-display mt-4 text-2xl font-semibold">Ticket not available</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-5">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{ticket.category}</p>
              <h1 className="font-display mt-3 text-4xl font-semibold">{ticket.resourceName || 'General operations issue'}</h1>
            </div>
            <TicketStatusBadge status={ticket.status} />
          </div>

          <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">{ticket.description}</p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
            <span>Priority {formatTicketPriority(ticket.priority)}</span>
            <span>Preferred contact {ticket.preferredContact}</span>
            <span>Created {formatDateTime(ticket.createdAt)}</span>
          </div>
        </div>

        {error ? (
          <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        {(user.role === 'TECHNICIAN' || user.role === 'ADMIN') ? (
          <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Workflow controls</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {canTechnicianMoveToInProgress(ticket) ? (
                <button
                  type="button"
                  onClick={() => updateStatus('IN_PROGRESS')}
                  disabled={busyState === 'status-IN_PROGRESS'}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                >
                  <CheckCheck className="h-4 w-4" />
                  {busyState === 'status-IN_PROGRESS' ? 'Updating...' : 'Move to in progress'}
                </button>
              ) : null}

              {canTechnicianResolve(ticket) ? (
                <button
                  type="button"
                  onClick={() => updateStatus('RESOLVED')}
                  disabled={busyState === 'status-RESOLVED'}
                  className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                >
                  <CheckCheck className="h-4 w-4" />
                  {busyState === 'status-RESOLVED' ? 'Updating...' : 'Mark resolved'}
                </button>
              ) : null}

              {user.role === 'ADMIN' && canAdminClose(ticket) ? (
                <button
                  type="button"
                  onClick={() => updateStatus('CLOSED')}
                  disabled={busyState === 'status-CLOSED'}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                >
                  Close ticket
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-semibold">Comments</p>
              <p className="text-sm text-[var(--text-muted)]">{comments.length} entries in the ticket history</p>
            </div>
          </div>

          <form className="space-y-3" onSubmit={addComment}>
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              rows="4"
              placeholder="Add an update, question, or technician note."
              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
            />
            <button
              type="submit"
              disabled={busyState === 'add-comment'}
              className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <MessageSquare className="h-4 w-4" />
              {busyState === 'add-comment' ? 'Posting...' : 'Post comment'}
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {comments.map((comment) => (
              <article key={comment.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{comment.authorName}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {comment.authorRole} • {formatDateTime(comment.updatedAt)}
                    </p>
                  </div>
                  {comment.editable ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(comment.id)
                          setEditingCommentValue(comment.content)
                        }}
                        className="rounded-full border border-[var(--border)] p-2"
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteComment(comment.id)}
                        className="rounded-full border border-[var(--danger)]/20 p-2 text-[var(--danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="mt-3 space-y-3">
                    <textarea
                      rows="4"
                      value={editingCommentValue}
                      onChange={(event) => setEditingCommentValue(event.target.value)}
                      className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => saveComment(comment.id)}
                        disabled={busyState === `comment-${comment.id}`}
                        className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(null)
                          setEditingCommentValue('')
                        }}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{comment.content}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Ticket context</p>
          <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
            <p>
              <span className="font-semibold text-[var(--text)]">Reporter:</span> {ticket.reporterName}
            </p>
            <p>
              <span className="font-semibold text-[var(--text)]">Assigned technician:</span>{' '}
              {ticket.assignedTechnicianName || 'Unassigned'}
            </p>
            <p>
              <span className="font-semibold text-[var(--text)]">Resolved at:</span>{' '}
              {ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : 'Not resolved yet'}
            </p>
            {ticket.rejectionReason ? (
              <p>
                <span className="font-semibold text-[var(--text)]">Rejection reason:</span> {ticket.rejectionReason}
              </p>
            ) : null}
            {ticket.resolutionNotes ? (
              <p>
                <span className="font-semibold text-[var(--text)]">Resolution notes:</span> {ticket.resolutionNotes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Images</p>
          {images.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">No image attachments were added to this ticket.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {images.map((image) => (
                <a
                  key={image.id}
                  href={resolveApiUrl(image.contentUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)]"
                >
                  <img src={resolveApiUrl(image.contentUrl)} alt={image.fileName} className="h-40 w-full object-cover" />
                  <div className="px-4 py-3 text-sm text-[var(--text-muted)]">{image.fileName}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}


import { AlertCircle, Bell, CheckCheck, GitCompareArrows, Hourglass, Scale, Settings2, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, Card, cx, Empty, PageHeader, Tabs, timeAgo } from '../components/ui'
import { useStore } from '../store'
import type { Notification } from '../types'

const ICON: Record<Notification['kind'], [ReactNode, string]> = {
  match: [<GitCompareArrows key="m" size={15} />, 'bg-ok-soft text-ok'],
  'upload-failed': [<AlertCircle key="u" size={15} />, 'bg-bad-soft text-bad'],
  review: [<Hourglass key="r" size={15} />, 'bg-warn-soft text-warn'],
  optimization: [<Scale key="o" size={15} />, 'bg-accent-soft text-accent'],
  system: [<Settings2 key="s" size={15} />, 'bg-sunken text-ink-2'],
}

export default function Notifications() {
  const { notifications, markRead, markAllRead, clearNotification, navigate } = useStore()
  const [f, setF] = useState<'all' | 'unread' | 'match' | 'review' | 'upload-failed'>('all')
  const list = notifications.filter((n) => (f === 'all' ? true : f === 'unread' ? !n.read : n.kind === f))
  return (
    <>
      <PageHeader
        eyebrow="Insights · Notifications"
        title="Notifications"
        description="New matches, failed uploads, pending reviews and completed optimizations."
        actions={
          <Button icon={<CheckCheck size={14} />} onClick={markAllRead}>
            Mark all as read
          </Button>
        }
      />
      <Card
        pad={false}
        title={
          <Tabs
            value={f}
            onChange={setF}
            items={[
              { value: 'all', label: 'All', count: notifications.length },
              { value: 'unread', label: 'Unread', count: notifications.filter((n) => !n.read).length },
              { value: 'match', label: 'New matches' },
              { value: 'review', label: 'Pending reviews' },
              { value: 'upload-failed', label: 'Failed uploads' },
            ]}
          />
        }
      >
        <ul className="divide-y divide-line">
          {list.map((n) => (
            <li key={n.id} className={cx('group flex items-start gap-4 px-5 py-4', !n.read && 'bg-accent-soft/25')}>
              <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg', ICON[n.kind][1])}>{ICON[n.kind][0]}</span>
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  markRead(n.id)
                  if (n.link) navigate(n.link)
                }}
              >
                <div className="flex items-center gap-2 text-[13.5px] font-medium">
                  {n.title}
                  {!n.read && <span className="size-1.5 rounded-full bg-accent" />}
                </div>
                <div className="mt-0.5 text-[12.5px] text-muted">{n.body}</div>
              </button>
              <span className="shrink-0 font-mono text-[11px] text-faint">{timeAgo(n.at)}</span>
              <button onClick={() => clearNotification(n.id)} className="grid size-7 place-items-center rounded-md text-faint opacity-0 group-hover:opacity-100 hover:bg-sunken hover:text-bad" aria-label="Dismiss">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
        {!list.length && <Empty icon={<Bell size={18} />} title="You're all caught up" />}
      </Card>
    </>
  )
}

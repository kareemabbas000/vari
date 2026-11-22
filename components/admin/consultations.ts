/** Shared labels for the free consultation calls inbox. */
export const CONSULT_STATUSES = ['new', 'contacted', 'scheduled', 'done', 'no_show', 'archived', 'spam'] as const;
export type ConsultStatus = (typeof CONSULT_STATUSES)[number];

export const STATUS_LABEL: Record<ConsultStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  scheduled: 'Call scheduled',
  done: 'Call done',
  no_show: 'No-show',
  archived: 'Archived',
  spam: 'Spam',
};
export const STATUS_TONE: Record<ConsultStatus, 'gold' | 'blue' | 'green' | 'grey' | 'red'> = {
  new: 'gold',
  contacted: 'blue',
  scheduled: 'blue',
  done: 'green',
  no_show: 'red',
  archived: 'grey',
  spam: 'red',
};
export const PROJECT_LABEL: Record<string, string> = { interior: 'Interior design', visualization: '3D visualization', architecture: 'Architecture', unsure: 'Not sure yet' };
export const TRIGGER_LABEL: Record<string, string> = {
  reminder: 'Reminder card',
  'reminder-tab': 'Reminder tab',
  'in-article': 'Offer in the article',
  sidebar: 'Sidebar card',
  'blog-cta': 'End of article / blog',
  link: 'Shared link',
};

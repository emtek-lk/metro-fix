import { AppNotification, countUnread, groupNotifications } from '../src/lib/notifications';

const NOW = new Date('2026-10-03T15:00:00').getTime();
const note = (id: string, createdAt: string, unread = false): AppNotification => ({
  id,
  kind: 'system',
  title: id,
  body: '',
  createdAt,
  unread,
});

describe('groupNotifications', () => {
  it('splits into Today and Earlier, newest first', () => {
    const groups = groupNotifications(
      [
        note('yesterday', '2026-10-02T22:00:00'),
        note('morning', '2026-10-03T08:00:00'),
        note('noon', '2026-10-03T12:00:00'),
        note('last-week', '2026-09-26T09:00:00'),
      ],
      NOW,
    );
    expect(groups.map((g) => g.title)).toEqual(['Today', 'Earlier']);
    expect(groups[0].data.map((n) => n.id)).toEqual(['noon', 'morning']);
    expect(groups[1].data.map((n) => n.id)).toEqual(['yesterday', 'last-week']);
  });

  it('drops groups that would be empty', () => {
    expect(groupNotifications([note('a', '2026-10-03T09:00:00')], NOW).map((g) => g.title)).toEqual(['Today']);
    expect(groupNotifications([note('a', '2026-09-01T09:00:00')], NOW).map((g) => g.title)).toEqual(['Earlier']);
    expect(groupNotifications([], NOW)).toEqual([]);
  });

  it('does not mutate its input', () => {
    const input = [note('a', '2026-10-01T09:00:00'), note('b', '2026-10-03T09:00:00')];
    groupNotifications(input, NOW);
    expect(input.map((n) => n.id)).toEqual(['a', 'b']);
  });
});

describe('countUnread', () => {
  it('counts unread items', () => {
    expect(countUnread([note('a', '2026-10-03T09:00:00', true), note('b', '2026-10-03T10:00:00')])).toBe(1);
    expect(countUnread([])).toBe(0);
  });
});

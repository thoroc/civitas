import { useEffect } from 'react';

import { Member } from '../types';

interface UseLiveAnnouncementsParams {
  tooltip: { i: number; member: Member } | null;
  members: Member[];
  filteredMembers: Member[];
  setLiveMessage: (msg: string) => void;
}

/**
 * useLiveAnnouncements
 * --------------------
 * Manages polite live region messaging for seat focus & filter count changes without
 * clobbering active tooltip announcements.
 */
const useLiveAnnouncements = ({
  tooltip,
  members,
  filteredMembers,
  setLiveMessage,
}: UseLiveAnnouncementsParams) => {
  // Filter-driven seat count changes
  useEffect(() => {
    if (!tooltip && members.length) {
      setLiveMessage(
        `${filteredMembers.length} of ${members.length} seats visible`
      );
    }
  }, [filteredMembers.length, members.length, tooltip, setLiveMessage]);

  // Tooltip changes (focused/hovered seat)
  useEffect(() => {
    if (tooltip) {
      const partyPart = tooltip.member.party?.label
        ? `, ${tooltip.member.party.label}`
        : '';
      setLiveMessage(
        `Seat ${tooltip.i + 1}: ${tooltip.member.label}${partyPart}`
      );
    }
  }, [tooltip, setLiveMessage]);
};

export default useLiveAnnouncements;

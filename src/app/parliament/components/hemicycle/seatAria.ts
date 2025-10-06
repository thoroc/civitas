import { Member } from '../../types';

interface SeatAriaOptions {
  seatIndex: number;
  seat: { member?: Member; active?: boolean };
  inactive: boolean;
}

export const buildSeatAria = ({
  seatIndex,
  seat,
  inactive,
}: SeatAriaOptions) => {
  const label = seat.member?.label ?? 'Unknown';
  const party = seat.member?.party?.label ? `, ${seat.member.party.label}` : '';
  const inactivePart = inactive ? ' (filtered out)' : '';
  return {
    ariaLabel: `Seat ${seatIndex + 1}: ${label}${party}${inactivePart}`,
    titleText: `${label}${party ? ' –' + party.slice(1) : ''}${inactivePart}`,
  };
};

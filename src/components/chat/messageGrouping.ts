import type { ChatMessage } from '../../store/types';

export function getGroupFlags(list: ChatMessage[], index: number) {
  const prev = list[index - 1];
  const next = list[index + 1];
  const current = list[index];
  const samePrev = Boolean(prev && prev.role === current.role && prev.author === current.author);
  const sameNext = Boolean(next && next.role === current.role && next.author === current.author);
  return {
    isFirst: !samePrev,
    isLast: !sameNext,
  };
}

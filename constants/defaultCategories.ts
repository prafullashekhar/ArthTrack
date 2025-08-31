import { ExpenseType } from '@/types/expense';

export const DEFAULT_CATEGORIES: Record<ExpenseType, string[]> = {
  Need: [
    'Room Rent',
    'Daily Food',
    'Eggs',
    'Protein',
    'Multivitamin',
    'Daily Transport',
    'Wifi',
    'Recharge',
    'Mobile Recharge',
    'Gym',
    'Daily Use'
  ],
  Want: [
    'Food',
    'Travel',
    'Skills',
    'Outfits',
    'Others',
    'Trip'
  ],
  Invest: [
    'SIP',
    'Stocks',
    'Mutual Fund'
  ]
};

export const EXPENSE_TYPE_COLORS = {
  Need: {
    color: '#10B981',
    gradient: ['#10B981', '#059669'] as const
  },
  Want: {
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'] as const
  },
  Invest: {
    color: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'] as const
  }
};

// Import SVG icons
import NeedIcon from '@/assets/images/need-icon.svg';
import WantIcon from '@/assets/images/want-icon.svg';
import InvestIcon from '@/assets/images/invest-icon.svg';

export const EXPENSE_TYPE_ICONS = {
  Need: NeedIcon,
  Want: WantIcon,
  Invest: InvestIcon
};
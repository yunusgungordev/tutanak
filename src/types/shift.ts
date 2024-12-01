export type ShiftType = 'Morning' | 'Night' | 'Rest';

export interface Employee {
  id: string;
  name: string;
  group_id: string;
}

export interface Group {
  id: string;
  name: string;
  employees: string[];
  current_shift: ShiftType;
}

export interface ShiftSchedule {
  date: string;
  groupId: string;
  shiftType: ShiftType;
} 
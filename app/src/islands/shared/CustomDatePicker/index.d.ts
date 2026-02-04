import { FC } from 'react';

export interface CustomDatePickerProps {
  /** Selected date in YYYY-MM-DD format */
  value: string;
  /** Callback when date is selected */
  onChange: (date: string) => void;
  /** Minimum selectable date in YYYY-MM-DD format */
  minDate?: string;
  /** Placeholder text for input */
  placeholder?: string;
}

declare const CustomDatePicker: FC<CustomDatePickerProps>;
export default CustomDatePicker;

/**
 * @deprecated DEPRECATED - Use SearchScheduleSelector with enablePersistence={true} instead.
 *
 * This component is maintained for backward compatibility only.
 * The functionality has been consolidated into SearchScheduleSelector.
 *
 * Migration:
 *   // Before
 *   <AuthAwareSearchScheduleSelector onSelectionChange={...} />
 *
 *   // After
 *   <SearchScheduleSelector enablePersistence={true} onSelectionChange={...} />
 */
import { useEffect } from 'react';
import SearchScheduleSelector from './SearchScheduleSelector.jsx';

export default function AuthAwareSearchScheduleSelector(props) {
  useEffect(() => {
    console.warn(
      '⚠️ AuthAwareSearchScheduleSelector is DEPRECATED. ' +
      'Use SearchScheduleSelector with enablePersistence={true} instead.'
    );
  }, []);

  // Pass through all props with enablePersistence forced to true
  return (
    <SearchScheduleSelector
      {...props}
      enablePersistence={true}
    />
  );
}

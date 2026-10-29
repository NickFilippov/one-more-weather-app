import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import PagerView from 'react-native-pager-view';

export interface PagerHandle {
  setPage(index: number): void;
}

interface Props {
  initialPage: number;
  onPageSelected: (index: number) => void;
  children: ReactNode;
}

/** Страницы городов, листаются свайпом. Нативный пейджер. */
export const Pager = forwardRef<PagerHandle, Props>(function Pager({ initialPage, onPageSelected, children }, ref) {
  const inner = useRef<PagerView>(null);
  useImperativeHandle(ref, () => ({ setPage: (i) => inner.current?.setPage(i) }), []);
  return (
    <PagerView
      ref={inner}
      style={{ flex: 1 }}
      initialPage={initialPage}
      onPageSelected={(e) => onPageSelected(e.nativeEvent.position)}
    >
      {children}
    </PagerView>
  );
});

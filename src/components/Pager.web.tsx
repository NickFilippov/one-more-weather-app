import { Children, forwardRef, useImperativeHandle, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import type { PagerHandle } from './Pager';

interface Props {
  initialPage: number;
  onPageSelected: (index: number) => void;
  children: ReactNode;
}

/** Веб-превью: react-native-pager-view в вебе не работает, поэтому страницы — горизонтальный ScrollView. */
export const Pager = forwardRef<PagerHandle, Props>(function Pager({ initialPage, onPageSelected, children }, ref) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);

  useImperativeHandle(ref, () => ({ setPage: (i) => scroll.current?.scrollTo({ x: i * width, animated: true }) }), [width]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) onPageSelected(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ flex: 1 }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={{ height: '100%' }}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialPage * width, y: 0 }}
          onMomentumScrollEnd={onEnd}
          scrollEventThrottle={64}
        >
          {Children.map(children, (child) => (
            <View style={{ width, height: '100%' }}>{child}</View>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

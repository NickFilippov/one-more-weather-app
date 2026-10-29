import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { SkyCanvasProps } from './SkyCanvas';

/**
 * Веб-превью: Skia в вебе требует загрузить CanvasKit (wasm) до первого импорта Skia,
 * поэтому SkyCanvas подгружается лениво. Файл public/canvaskit.wasm кладёт `npx setup-skia-web`.
 */
export function SkyEffects(props: SkyCanvasProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./SkyCanvas')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
    />
  );
}

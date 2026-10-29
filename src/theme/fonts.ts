import { Platform } from 'react-native';

// В Bricolage Grotesque нет кириллицы. На телефонах недостающие буквы система подставляет
// из своего шрифта сама, а в вебе нужен явный запасной список, иначе браузер берёт засечный.
const webFallback = Platform.OS === 'web' ? ', system-ui, -apple-system, sans-serif' : '';

/** Имена семейств для fontFamily. Вес 250 из дизайна заменён на 300. */
export const font = {
  thin: `BricolageGrotesque_200ExtraLight${webFallback}`,
  light: `BricolageGrotesque_300Light${webFallback}`,
  medium: `BricolageGrotesque_500Medium${webFallback}`,
} as const;

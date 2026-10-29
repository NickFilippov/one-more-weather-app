// В Bricolage Grotesque нет кириллицы: недостающие буквы система подставляет из своего шрифта.

/** Имена семейств для fontFamily. Вес 250 из дизайна заменён на 300. */
export const font = {
  thin: 'BricolageGrotesque_200ExtraLight',
  light: 'BricolageGrotesque_300Light',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
} as const;

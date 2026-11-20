import { Categories } from 'emoji-picker-react';
import { t } from './index';

export function emojiPickerLabels() {
  return {
    searchPlaceholder: t('common:emojiSearch'),
    searchClearButtonLabel: t('common:emojiClear'),
    previewConfig: { defaultCaption: t('common:emojiMood') },
    categories: Object.values(Categories).map(category => ({ category, name: t(`common:emojiCategory_${category}`) })),
  };
}

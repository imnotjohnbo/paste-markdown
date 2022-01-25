import { install as installHTML, uninstall as uninstallHTML } from './paste-markdown-html';
import { install as installImageLink, uninstall as uninstallImageLink } from './paste-markdown-image-link';
import { install as installLink, uninstall as uninstallLink } from './paste-markdown-link';
import { install as installTable, uninstall as uninstallTable } from './paste-markdown-table';
import { install as installText, uninstall as uninstallText } from './paste-markdown-text';
interface Subscription {
    unsubscribe: () => void;
}
declare function subscribe(el: HTMLElement): Subscription;
export { subscribe, installHTML, installImageLink, installLink, installTable, installText, uninstallHTML, uninstallImageLink, uninstallTable, uninstallLink, uninstallText };

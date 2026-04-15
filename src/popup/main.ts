import '../shared/ui/theme.css';
import './popup.css';
import { mountPopupApp } from './popupApp';

void mountPopupApp(document.getElementById('app') as HTMLDivElement);

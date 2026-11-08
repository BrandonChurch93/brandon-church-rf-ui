import { FaithfulPage } from '@/faithful/FaithfulPage';
import s from './stage.module.scss';

export function App() {
  return (
    <div className={s.stage}>
      <div className={s.layer} data-layer="faithful">
        <FaithfulPage />
      </div>
    </div>
  );
}

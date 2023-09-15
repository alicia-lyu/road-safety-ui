import { SafeRoutingLevelChanged } from "@/actions/Actions";
import Dispatcher from "@/stores/Dispatcher";
import { useState } from "react";
import styles from '@/sidebar/SettingsBox.module.css';

type SafeRoutingLevels = 1 | 2 | 3

export default function LevelsToggle({ safeRoutingEnabled }: { safeRoutingEnabled: boolean }) {
    const [safeRoutingLevel, setSafeRoutingLevel] = useState<SafeRoutingLevels>(2);
    function handleSafeRoutingLevelChange(event: React.ChangeEvent<HTMLInputElement>) {
        const levelNum = parseInt(event.target.value);
        if ([1, 2, 3].includes(levelNum)) {
            const level = levelNum as SafeRoutingLevels
            setSafeRoutingLevel(level);
            Dispatcher.dispatch(new SafeRoutingLevelChanged(level));
        }
    }
    if (safeRoutingEnabled) {
        return (
            <>
                <input type='range' min={1} max={3} step={1}
                    value={safeRoutingLevel} onChange={handleSafeRoutingLevelChange}
                    className={styles.safeRoutingLevel}
                />
                <div style={{ color: safeRoutingEnabled ? '#5b616a' : 'gray' }}>Safety routing level: {safeRoutingLevel}</div>
            </>
        )
    } else {
        return <></>
    }
}
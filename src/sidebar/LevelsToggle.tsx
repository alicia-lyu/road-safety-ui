import { SafeRoutingLevelChanged } from "@/actions/Actions";
import Dispatcher from "@/stores/Dispatcher";
import { useState } from "react";
import styles from '@/sidebar/LevelsToggle.module.css';
import AppleIcon from '@/sidebar/apple.svg';
import LemonIcon from '@/sidebar/lemon.svg';
import CarrotIcon from '@/sidebar/carrot.svg';

type SafeRoutingLevels = 1 | 2 | 3

export default function LevelsToggle({ safeRoutingEnabled }: { safeRoutingEnabled: boolean }) {
    const [safeRoutingLevel, setSafeRoutingLevel] = useState<SafeRoutingLevels>(2);
    const [levelMapping, setLevelMapping] = useState<SafeRoutingLevels[]>(() => {
        const levels: SafeRoutingLevels[] = [1, 2, 3];
        shuffle(levels);
        return levels;
    });

    function createSafeRoutingLevelHandler(level: SafeRoutingLevels) {
        return function handleSafeRoutingLevel(event: React.ChangeEvent<HTMLInputElement>) {
            setSafeRoutingLevel(level);
            Dispatcher.dispatch(new SafeRoutingLevelChanged(level));
        }
    }

    if (safeRoutingEnabled) {
        return (
            <>
                <div style={{ color: '#5b616a' }}>Interface: </div>
                <form className={styles.levelsToggle}>
                    <input type="radio" id="level1" name="level" value="1"
                        checked={safeRoutingLevel === levelMapping[0]}
                        onChange={createSafeRoutingLevelHandler(levelMapping[0])}
                    />
                    <label htmlFor="level1"><AppleIcon /></label>
                    <input type="radio" id="level2" name="level" value="2"
                        checked={safeRoutingLevel === levelMapping[1]}
                        onChange={createSafeRoutingLevelHandler(levelMapping[1])}
                    />
                    <label htmlFor="level2"><LemonIcon /></label>
                    <input type="radio" id="level3" name="level" value="3"
                        checked={safeRoutingLevel === levelMapping[2]}
                        onChange={createSafeRoutingLevelHandler(levelMapping[2])}
                    />
                    <label htmlFor="level3"><CarrotIcon /></label>
                </form>
            </>
        )
    } else {
        return <></>
    }
}

function shuffle(array: any[]): any[] {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}
import { SafeRoutingLevelChanged, ToggleDistanceUnits, ToggleSafeRoutingEnabled } from '@/actions/Actions'
import Dispatcher from '@/stores/Dispatcher'
import styles from '@/sidebar/SettingsBox.module.css'
import { tr } from '@/translation/Translation'
import PlainButton from '@/PlainButton'
import OnIcon from '@/sidebar/toggle_on.svg'
import OffIcon from '@/sidebar/toggle_off.svg'
import { useContext, useState } from 'react'
import { ShowDistanceInMilesContext } from '@/ShowDistanceInMilesContext'

type SafeRoutingLevels = 1 | 2 | 3

export default function SettingsBox() {
    const showDistanceInMiles = useContext(ShowDistanceInMilesContext)
    const [safeRoutingEnabled, setSafeRouting] = useState(true);
    const [safeRoutingLevel, setSafeRoutingLevel] = useState<SafeRoutingLevels>(2);

    function handleSafeRoutingLevelChange(event: React.ChangeEvent<HTMLInputElement>) {
        const levelNum = parseInt(event.target.value);
        if ([1, 2, 3].includes(levelNum)) {
            const level = levelNum as SafeRoutingLevels
            setSafeRoutingLevel(level);
            Dispatcher.dispatch(new SafeRoutingLevelChanged(level));
        }
    }

    return (
        <div className={styles.parent}>
            <div className={styles.title}>{tr('settings')}</div>
            <div className={styles.settingsTable}>
                <PlainButton
                    style={{ color: showDistanceInMiles ? '' : 'lightgray' }} // todonow: move to css?
                    onClick={() => {
                        Dispatcher.dispatch(new ToggleDistanceUnits())
                    }}
                >
                    {showDistanceInMiles ? <OnIcon /> : <OffIcon />}
                </PlainButton>
                <div style={{ color: showDistanceInMiles ? '#5b616a' : 'gray' }}>
                    {tr('distance_unit', [tr(showDistanceInMiles ? 'mi' : 'km')])}
                </div>
                <PlainButton
                    style={{ color: safeRoutingEnabled ? '' : 'lightgray' }} // todonow: move to css?
                    onClick={() => {
                        Dispatcher.dispatch(new ToggleSafeRoutingEnabled())
                        setSafeRouting(!safeRoutingEnabled)
                    }}
                >
                    {safeRoutingEnabled ? <OnIcon /> : <OffIcon />}
                </PlainButton>
                <div style={{ color: safeRoutingEnabled ? '#5b616a' : 'gray' }}>
                    {tr(safeRoutingEnabled ? 'Safe Routing Mode Enabled' : 'Safe Routing Mode Disabled')}
                </div>
                {safeRoutingEnabled && (
                    <>
                        <input type='range' min={1} max={3} step={1}
                            value={safeRoutingLevel} onChange={handleSafeRoutingLevelChange}
                            className={styles.safeRoutingLevel}
                        />
                        <div style={{ color: safeRoutingEnabled ? '#5b616a' : 'gray' }}>Safety routing level: {safeRoutingLevel}</div>
                    </>
                )}
            </div>
            <div className={styles.infoLine}>
                <a href="https://www.graphhopper.com/maps-route-planner/">Info</a>
                <a href="https://github.com/graphhopper/graphhopper-maps/issues">Feedback</a>
                <a href="https://www.graphhopper.com/imprint/">Imprint</a>
                <a href="https://www.graphhopper.com/privacy/">Privacy</a>
                <a href="https://www.graphhopper.com/terms/">Terms</a>
            </div>
        </div>
    )
}

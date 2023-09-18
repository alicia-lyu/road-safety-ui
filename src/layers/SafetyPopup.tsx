import styles from '@/layers/MapFeaturePopup.module.css'
import MapPopup from '@/layers/MapPopup'
import { Map } from 'ol'
import { Coordinate } from '@/stores/QueryStore'

interface SafetyPopupProps {
    map: Map,
    safetyScore: number,
    explanationProperties: object,
    coordinate: Coordinate | null,
    level: 1 | 2 | 3
}

/**
 * The popup shown when certain map features are hovered. For example a road of the routing graph layer.
 */
export default function SafetyPopup({ map, safetyScore, explanationProperties, coordinate, level }: SafetyPopupProps) {
    return <MapPopup map={map} coordinate={coordinate}>
        <div className={styles.popup} style={{ display: level === 1 ? "none" : "block" }}>
            <p>{`Safety Score: ${safetyScore}`}</p>
            {level === 3 && <ul className={styles.explanation}>
                {Object.entries(explanationProperties).map(([k, v], index) => {
                    if (v instanceof Array) {
                        return <li key={index}>
                            <ul>{`${k}:`}
                                {v.map((v, index) => <li key={index}>{v}</li>)}
                            </ul>
                        </li>
                    } else if (k === "Confidence") {
                        return <></>
                        // Not showing confidence as a factor for now
                    } else {
                        return <li key={index}>{`${k}: ${v}`}</li>
                    }
                })}
            </ul>}
        </div>
    </MapPopup>
}
